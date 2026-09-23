// ─── Guard ────────────────────────────────────────────────────────────────────
export interface Guard {
  id: string;
  guardId: string; // e.g., "GRD001" — used as login ID
  name: string;
  phone: string;
  email: string;
  address: string;
  dob: string; // YYYY-MM-DD
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  designation: string;
  site: string;
  salary: number; // payment / salary amount
  status: 'Active' | 'Inactive';
  joinDate: string; // YYYY-MM-DD
  password: string;
  photo?: string; // base64 data URL
  aadharNo?: string;
  emergencyContact?: string;
  // User requested fields
  oldExperience?: string; // e.g., "Fresher", "2 Years at SIS Security"
  preferredShift?: 'Day shift' | 'Night shift' | 'Rotational / Any';
  workType?: 'Permanent work' | 'Temporary work';
  remarks?: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Holiday';

export interface AttendanceRecord {
  guardId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

// AttendanceMap: date string → map of guardId → AttendanceRecord
export type AttendanceMap = Record<string, Record<string, AttendanceRecord>>;

// ─── Invoice ──────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  description: string;
  guards: number;
  days: number;
  ratePerDay: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  clientGST?: string;
  clientPhone?: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  fromDate: string;
  toDate: string;
  items: InvoiceItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid';
  notes?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AdminAuth {
  loggedIn: boolean;
  role: 'admin';
}

export interface GuardAuth {
  loggedIn: boolean;
  guardId: string;
  name: string;
}
