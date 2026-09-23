import { AttendanceStatus } from './types';

// ─── Currency ─────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Dates ────────────────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthDateRange(year: number, month: number): string[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    return `${year}-${m}-${d}`;
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

// ─── Status badge colours ────────────────────────────────────────────────────
export function attendanceBadgeClass(status: AttendanceStatus): string {
  switch (status) {
    case 'Present':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Absent':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'Late':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Holiday':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
}

export function guardStatusClass(status: 'Active' | 'Inactive'): string {
  return status === 'Active'
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : 'bg-red-100 text-red-700 border border-red-200';
}

export function invoiceStatusClass(status: 'Draft' | 'Sent' | 'Paid'): string {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Sent':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
}

// ─── ID Generators ────────────────────────────────────────────────────────────
export function generateGuardId(existingIds: (string | undefined | null)[]): string {
  const nums = (existingIds || [])
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((id) => parseInt(id.replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `GRD${String(next).padStart(3, '0')}`;
}

export function generateInvoiceNumber(existingNumbers: (string | undefined | null)[]): string {
  const nums = (existingNumbers || [])
    .filter((n): n is string => typeof n === 'string' && n.length > 0)
    .map((n) => parseInt(n.replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1001;
  return `INV-${next}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
