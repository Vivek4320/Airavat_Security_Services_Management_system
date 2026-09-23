import { Pool } from 'pg';
import { Guard } from './types';

let pool: Pool | null = null;
let initialized = false;

// Determine if valid connection string exists
export function isDBConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) return false;
  if (url.includes('[YOUR-PASSWORD]')) return false;
  return true;
}

export function getDBPool(): Pool | null {
  if (!isDBConfigured()) return null;

  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

// Ensure the guards table exists in Supabase
export async function ensureGuardsTable(): Promise<void> {
  if (initialized) return;
  const db = getDBPool();
  if (!db) return;

  const query = `
    CREATE TABLE IF NOT EXISTS guards (
      id TEXT PRIMARY KEY,
      guard_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      dob TEXT NOT NULL,
      age NUMERIC,
      gender TEXT NOT NULL,
      designation TEXT NOT NULL,
      site TEXT NOT NULL,
      salary NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      join_date TEXT NOT NULL,
      password TEXT NOT NULL,
      photo TEXT,
      aadhar_no TEXT,
      emergency_contact TEXT,
      old_experience TEXT,
      preferred_shift TEXT,
      work_type TEXT,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Ensure backwards compatibility if table was created previously
    ALTER TABLE guards ADD COLUMN IF NOT EXISTS age NUMERIC;
    ALTER TABLE guards ADD COLUMN IF NOT EXISTS old_experience TEXT;
    ALTER TABLE guards ADD COLUMN IF NOT EXISTS preferred_shift TEXT;
    ALTER TABLE guards ADD COLUMN IF NOT EXISTS work_type TEXT;
    ALTER TABLE guards ADD COLUMN IF NOT EXISTS remarks TEXT;
  `;

  try {
    await db.query(query);
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize guards table in Supabase:', err);
    throw err;
  }
}

// Map database row to Guard interface
function rowToGuard(row: Record<string, unknown>): Guard {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : '',
    address: String(row.address),
    dob: String(row.dob),
    age: row.age ? Number(row.age) : undefined,
    gender: row.gender as Guard['gender'],
    designation: String(row.designation),
    site: String(row.site),
    salary: Number(row.salary),
    status: row.status as Guard['status'],
    joinDate: String(row.join_date),
    password: String(row.password),
    photo: row.photo ? String(row.photo) : undefined,
    aadharNo: row.aadhar_no ? String(row.aadhar_no) : undefined,
    emergencyContact: row.emergency_contact ? String(row.emergency_contact) : undefined,
    oldExperience: row.old_experience ? String(row.old_experience) : undefined,
    preferredShift: row.preferred_shift as Guard['preferredShift'],
    workType: row.work_type as Guard['workType'],
    remarks: row.remarks ? String(row.remarks) : undefined,
  };
}

// Fetch all guards from Supabase
export async function fetchGuardsFromDB(): Promise<Guard[]> {
  const db = getDBPool();
  if (!db) return [];

  await ensureGuardsTable();
  const res = await db.query('SELECT * FROM guards ORDER BY created_at DESC, guard_id ASC');
  return res.rows.map(rowToGuard);
}

// Save a new guard into Supabase
export async function saveGuardToDB(guard: Guard): Promise<Guard> {
  const db = getDBPool();
  if (!db) {
    throw new Error('Database is not configured.');
  }

  await ensureGuardsTable();

  const query = `
    INSERT INTO guards (
      id, guard_id, name, phone, email, address, dob, age, gender, designation, site, salary, status, join_date, password, photo, aadhar_no, emergency_contact, old_experience, preferred_shift, work_type, remarks
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT (id) DO UPDATE SET
      guard_id = EXCLUDED.guard_id,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address = EXCLUDED.address,
      dob = EXCLUDED.dob,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      designation = EXCLUDED.designation,
      site = EXCLUDED.site,
      salary = EXCLUDED.salary,
      status = EXCLUDED.status,
      join_date = EXCLUDED.join_date,
      password = EXCLUDED.password,
      photo = EXCLUDED.photo,
      aadhar_no = EXCLUDED.aadhar_no,
      emergency_contact = EXCLUDED.emergency_contact,
      old_experience = EXCLUDED.old_experience,
      preferred_shift = EXCLUDED.preferred_shift,
      work_type = EXCLUDED.work_type,
      remarks = EXCLUDED.remarks
    RETURNING *;
  `;

  const values = [
    guard.id,
    guard.guardId,
    guard.name,
    guard.phone,
    guard.email || null,
    guard.address,
    guard.dob,
    guard.age || null,
    guard.gender,
    guard.designation,
    guard.site,
    guard.salary,
    guard.status,
    guard.joinDate,
    guard.password,
    guard.photo || null,
    guard.aadharNo || null,
    guard.emergencyContact || null,
    guard.oldExperience || null,
    guard.preferredShift || null,
    guard.workType || null,
    guard.remarks || null,
  ];

  const res = await db.query(query, values);
  return rowToGuard(res.rows[0]);
}

// Toggle or update status in Supabase
export async function updateGuardStatusInDB(id: string, status: string): Promise<boolean> {
  const db = getDBPool();
  if (!db) return false;

  await ensureGuardsTable();
  await db.query('UPDATE guards SET status = $1 WHERE id = $2', [status, id]);
  return true;
}

// Delete guard from Supabase
export async function deleteGuardFromDB(id: string): Promise<boolean> {
  const db = getDBPool();
  if (!db) return false;

  await ensureGuardsTable();
  await db.query('DELETE FROM guards WHERE id = $1', [id]);
  return true;
}
