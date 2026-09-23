import { Guard, AttendanceRecord, AttendanceMap, Invoice } from './types';
import { todayStr, generateId } from './utils';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const GUARDS_KEY = 'airavat_guards';
const ATTENDANCE_KEY = 'airavat_attendance';
const INVOICES_KEY = 'airavat_invoices';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const seedGuards: Guard[] = [
  {
    id: generateId(),
    guardId: 'GRD001',
    name: 'Ramesh Kumar Sharma',
    phone: '9876543210',
    email: 'ramesh.sharma@airavat.in',
    address: 'Plot 12, Khodiyar Colony, Jamnagar, Gujarat - 361006',
    dob: '1988-05-14',
    gender: 'Male',
    designation: 'Senior Security Guard',
    site: 'Kataria Builders, Rajkot',
    salary: 18000,
    status: 'Active',
    joinDate: '2022-03-01',
    password: 'guard123',
    aadharNo: '2345 6789 0123',
    emergencyContact: '9988776655',
  },
  {
    id: generateId(),
    guardId: 'GRD002',
    name: 'Suresh Patel',
    phone: '9856741230',
    email: 'suresh.patel@airavat.in',
    address: '45B, Nilkamal Chowk, Jamnagar, Gujarat - 361006',
    dob: '1992-11-20',
    gender: 'Male',
    designation: 'Security Guard',
    site: 'The Emerald Club, Jamnagar',
    salary: 15000,
    status: 'Active',
    joinDate: '2023-01-15',
    password: 'guard123',
    aadharNo: '3456 7890 1234',
    emergencyContact: '9977665544',
  },
  {
    id: generateId(),
    guardId: 'GRD003',
    name: 'Priya Desai',
    phone: '9765432100',
    email: 'priya.desai@airavat.in',
    address: '78, Sector 7, Gandhinagar, Gujarat - 382007',
    dob: '1995-07-08',
    gender: 'Female',
    designation: 'Security Supervisor',
    site: 'Yash Pinnacle, Ahmedabad',
    salary: 22000,
    status: 'Active',
    joinDate: '2021-09-10',
    password: 'guard123',
    aadharNo: '4567 8901 2345',
    emergencyContact: '9966554433',
  },
  {
    id: generateId(),
    guardId: 'GRD004',
    name: 'Ajay Singh Chauhan',
    phone: '9845123670',
    email: 'ajay.chauhan@airavat.in',
    address: '23, MG Road, Rajkot, Gujarat - 360001',
    dob: '1985-03-25',
    gender: 'Male',
    designation: 'Head Guard',
    site: 'Topland Complex, Rajkot',
    salary: 25000,
    status: 'Active',
    joinDate: '2020-06-01',
    password: 'guard123',
    aadharNo: '5678 9012 3456',
    emergencyContact: '9955443322',
  },
  {
    id: generateId(),
    guardId: 'GRD005',
    name: 'Vikram Joshi',
    phone: '9712345670',
    email: 'vikram.joshi@airavat.in',
    address: '56, Crystal Tower, Surat, Gujarat - 395003',
    dob: '1990-09-12',
    gender: 'Male',
    designation: 'Security Guard',
    site: 'Crystal Tower, Surat',
    salary: 14500,
    status: 'Inactive',
    joinDate: '2022-11-15',
    password: 'guard123',
    aadharNo: '6789 0123 4567',
    emergencyContact: '9944332211',
  },
];

function seedAttendance(guards: Guard[]): AttendanceMap {
  const map: AttendanceMap = {};
  const today = todayStr();
  const statuses: Array<'Present' | 'Absent' | 'Late'> = ['Present', 'Present', 'Present', 'Late', 'Absent'];

  map[today] = {};
  guards.forEach((g, i) => {
    map[today][g.guardId] = {
      guardId: g.guardId,
      date: today,
      status: statuses[i % statuses.length],
      checkIn: statuses[i % statuses.length] !== 'Absent' ? '08:30' : undefined,
      checkOut: statuses[i % statuses.length] !== 'Absent' ? '20:30' : undefined,
    };
  });
  return map;
}

const seedInvoices: Invoice[] = [
  {
    id: generateId(),
    invoiceNumber: 'INV-1001',
    clientName: 'Kataria Builders Pvt. Ltd.',
    clientAddress: '12, Business Hub, Rajkot, Gujarat - 360001',
    clientGST: '24AABCK1234D1Z5',
    clientPhone: '0281-2345678',
    date: '2026-09-01',
    dueDate: '2026-09-15',
    fromDate: '2026-08-01',
    toDate: '2026-08-31',
    items: [
      { description: 'Security Guard Services', guards: 2, days: 31, ratePerDay: 650, amount: 40300 },
    ],
    subtotal: 40300,
    gstRate: 18,
    gstAmount: 7254,
    total: 47554,
    status: 'Paid',
    notes: 'Thank you for your business.',
  },
  {
    id: generateId(),
    invoiceNumber: 'INV-1002',
    clientName: 'The Emerald Club',
    clientAddress: '56, MG Road, Jamnagar, Gujarat - 361001',
    clientGST: '24AABCE5678F2Z3',
    clientPhone: '0288-2234567',
    date: '2026-09-10',
    dueDate: '2026-09-25',
    fromDate: '2026-08-01',
    toDate: '2026-08-31',
    items: [
      { description: 'Security Guard Services', guards: 1, days: 31, ratePerDay: 600, amount: 18600 },
    ],
    subtotal: 18600,
    gstRate: 18,
    gstAmount: 3348,
    total: 21948,
    status: 'Sent',
    notes: '',
  },
];

// ─── Guards ───────────────────────────────────────────────────────────────────
export function getGuards(): Guard[] {
  if (typeof window === 'undefined') return seedGuards;
  const stored = localStorage.getItem(GUARDS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(GUARDS_KEY, JSON.stringify(seedGuards));
  return seedGuards;
}

export function saveGuards(guards: Guard[]): void {
  localStorage.setItem(GUARDS_KEY, JSON.stringify(guards));
}

export function getGuardById(guardId: string): Guard | undefined {
  return getGuards().find((g) => g.guardId === guardId);
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function getAttendanceMap(): AttendanceMap {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(ATTENDANCE_KEY);
  if (stored) return JSON.parse(stored);
  const guards = getGuards();
  const map = seedAttendance(guards);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(map));
  return map;
}

export function saveAttendanceMap(map: AttendanceMap): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(map));
}

export function getAttendanceForDate(date: string): Record<string, AttendanceRecord> {
  const map = getAttendanceMap();
  return map[date] || {};
}

export function setAttendanceRecord(record: AttendanceRecord): void {
  const map = getAttendanceMap();
  if (!map[record.date]) map[record.date] = {};
  map[record.date][record.guardId] = record;
  saveAttendanceMap(map);
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return seedInvoices;
  const stored = localStorage.getItem(INVOICES_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(seedInvoices));
  return seedInvoices;
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function addInvoice(invoice: Invoice): void {
  const invoices = getInvoices();
  saveInvoices([invoice, ...invoices]);
}

export function updateInvoiceStatus(id: string, status: Invoice['status']): void {
  const invoices = getInvoices().map((inv) =>
    inv.id === id ? { ...inv, status } : inv
  );
  saveInvoices(invoices);
}
