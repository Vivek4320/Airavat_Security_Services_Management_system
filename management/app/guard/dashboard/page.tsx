'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGuardById, getAttendanceMap } from '@/lib/data';
import { Guard, AttendanceRecord } from '@/lib/types';
import { formatDate, formatCurrency, attendanceBadgeClass, todayStr, monthLabel } from '@/lib/utils';

export default function GuardDashboard() {
  const router = useRouter();
  const [guard, setGuard] = useState<Guard | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    try {
      const auth = localStorage.getItem('airavat_guard_auth');
      if (!auth) { router.push('/guard/login'); return; }
      const parsed = JSON.parse(auth);
      if (!parsed.loggedIn) { router.push('/guard/login'); return; }
      const g = getGuardById(parsed.guardId);
      if (!g) { router.push('/guard/login'); return; }
      setGuard(g);
    } catch {
      router.push('/guard/login');
    }
  }, [router]);

  useEffect(() => {
    if (!guard) return;
    const attMap = getAttendanceMap();
    const [year, month] = selectedMonth.split('-').map(Number);
    const records: AttendanceRecord[] = [];
    Object.entries(attMap).forEach(([date, dayMap]) => {
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (dayMap[guard.guardId]) records.push(dayMap[guard.guardId]);
      }
    });
    records.sort((a, b) => a.date.localeCompare(b.date));
    setMonthRecords(records);
  }, [guard, selectedMonth]);

  const handleLogout = () => {
    localStorage.removeItem('airavat_guard_auth');
    router.push('/guard/login');
  };

  const summary = {
    present: monthRecords.filter((r) => r.status === 'Present').length,
    absent: monthRecords.filter((r) => r.status === 'Absent').length,
    late: monthRecords.filter((r) => r.status === 'Late').length,
    holiday: monthRecords.filter((r) => r.status === 'Holiday').length,
  };

  const todayRecord = monthRecords.find((r) => r.date === todayStr());

  if (!guard) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#040936' }}>
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: '#C9A84C' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
          </svg>
          <span className="text-white/60 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F8' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #040936 0%, #0a1147 100%)' }}>
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-bold text-sm tracking-wider" style={{ color: '#C9A84C' }}>AIRAVAT</p>
              <p className="text-white/40 text-[10px]">Guard Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Guard Profile Banner */}
        <div className="max-w-4xl mx-auto px-5 pb-6">
          <div className="flex items-center gap-4 mt-2">
            {guard.photo ? (
              <img src={guard.photo} alt={guard.name} className="w-16 h-16 rounded-2xl object-cover border-2" style={{ borderColor: '#C9A84C40' }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ background: 'rgba(201,168,76,0.2)', border: '2px solid rgba(201,168,76,0.3)' }}>
                {guard.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{guard.name}</h1>
              <p className="text-white/60 text-sm">{guard.designation} · <span className="font-mono" style={{ color: '#C9A84C' }}>{guard.guardId}</span></p>
              <p className="text-white/40 text-xs mt-0.5">{guard.site}</p>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">{guard.status}</span>
              </div>
              <p className="text-white/40 text-xs mt-1">Joined {formatDate(guard.joinDate)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        {/* Today's Status */}
        <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'white', boxShadow: '0 1px 3px rgba(4,9,54,0.08), 0 4px 16px rgba(4,9,54,0.05)' }}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Status</p>
            <p className="text-gray-600 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          {todayRecord ? (
            <div className="text-right">
              <span className={`text-sm font-bold px-4 py-2 rounded-xl ${attendanceBadgeClass(todayRecord.status)}`}>{todayRecord.status}</span>
              {todayRecord.checkIn && <p className="text-xs text-gray-400 mt-1.5">In: {todayRecord.checkIn} · Out: {todayRecord.checkOut}</p>}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Not marked yet</span>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Present', value: summary.present, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            { label: 'Absent', value: summary.absent, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
            { label: 'Late', value: summary.late, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
            { label: 'Holiday', value: summary.holiday, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Attendance History</h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
              style={{ color: '#040936' }}
            />
          </div>

          {monthRecords.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-4xl mb-2">📅</p>
              <p className="text-gray-500 text-sm">No attendance records for this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8f9fc' }}>
                    {['Date', 'Day', 'Status', 'Check In', 'Check Out'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthRecords.map((r) => {
                    const d = new Date(r.date);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <tr key={r.date} className={`transition-colors hover:bg-gray-50/50 ${isWeekend ? 'bg-blue-50/20' : ''}`}>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">{formatDate(r.date)}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${attendanceBadgeClass(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 font-mono">{r.checkIn || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 font-mono">{r.checkOut || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">My Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { label: 'Full Name', value: guard.name },
              { label: 'Guard ID', value: guard.guardId },
              { label: 'Mobile', value: guard.phone },
              { label: 'Email', value: guard.email || '—' },
              { label: 'Designation', value: guard.designation },
              { label: 'Site', value: guard.site },
              { label: 'Monthly Salary', value: formatCurrency(guard.salary) },
              { label: 'Date of Birth', value: formatDate(guard.dob) },
              { label: 'Join Date', value: formatDate(guard.joinDate) },
              { label: 'Aadhar No.', value: guard.aadharNo || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-24 text-xs font-medium text-gray-400 shrink-0 pt-0.5">{label}</div>
                <div className="text-sm font-medium text-gray-700">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs pb-4">Airavat Security Service · सर्वदा शक्तिशाली</p>
      </div>
    </div>
  );
}
