/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Guard } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton Supabase client (typed as any to avoid missing DB type definitions)
let _client: SupabaseClient<any> | null = null;

export function isDBConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

export function getSupabaseClient(): SupabaseClient<any> | null {
  if (!isDBConfigured()) return null;
  if (!_client) {
    _client = createClient<any>(supabaseUrl, supabaseKey);
  }
  return _client;
}

// No-op: table management is done via Supabase Dashboard / migrations
export async function ensureGuardsTable(): Promise<void> {
  return;
}

// Map database row to Guard interface
function rowToGuard(row: any): Guard {
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
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchGuardsFromDB error:', error.message);
    return [];
  }

  return ((data as any[]) ?? []).map(rowToGuard);
}

// Save (upsert) a guard into Supabase
export async function saveGuardToDB(guard: Guard): Promise<Guard> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database is not configured.');

  const row: Record<string, any> = {
    id: guard.id,
    guard_id: guard.guardId,
    name: guard.name,
    phone: guard.phone,
    email: guard.email || null,
    address: guard.address,
    dob: guard.dob,
    age: guard.age || null,
    gender: guard.gender,
    designation: guard.designation,
    site: guard.site,
    salary: guard.salary,
    status: guard.status,
    join_date: guard.joinDate,
    password: guard.password,
    photo: guard.photo || null,
    aadhar_no: guard.aadharNo || null,
    emergency_contact: guard.emergencyContact || null,
    old_experience: guard.oldExperience || null,
    preferred_shift: guard.preferredShift || null,
    work_type: guard.workType || null,
    remarks: guard.remarks || null,
  };

  const { data, error } = await supabase
    .from('guards')
    .upsert(row as any, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToGuard(data as any);
}

// Update guard status
export async function updateGuardStatusInDB(id: string, status: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('guards')
    .update({ status } as any)
    .eq('id', id);

  if (error) {
    console.error('updateGuardStatusInDB error:', error.message);
    return false;
  }
  return true;
}

// Delete a guard
export async function deleteGuardFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('guards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteGuardFromDB error:', error.message);
    return false;
  }
  return true;
}
