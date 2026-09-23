'use client';

import { useEffect, useState, useCallback } from 'react';
import { getGuards, getAttendanceForDate, setAttendanceRecord } from '@/lib/data';
import { Guard, AttendanceStatus, AttendanceRecord } from '@/lib/types';
import { todayStr, attendanceBadgeClass } from '@/lib/utils';

const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Holiday'];

const statusColors: Record<AttendanceStatus, { bg: string; text: string }> = {
  Present: { bg: '#059669', text: 'white' },
  Absent:  { bg: '#DC2626', text: 'white' },
  Late:    { bg: '#D97706', text: 'white' },
  Holiday: { bg: '#2563EB', text: 'white' },
};

export default function AttendancePage() {
  const [date, setDate] = useState(todayStr());
  const [guards, setGuards] = useState<Guard[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus | ''>('');

  const loadData = useCallback(() => {
    const allGuards = getGuards().filter((g) => g.status === 'Active');
    setGuards(allGuards);
    setRecords(getAttendanceForDate(date));
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const markStatus = (guardId: string, status: AttendanceStatus) => {
    setSaving(guardId);
    const record: AttendanceRecord = {
      guardId,
      date,
      status,
      checkIn: status !== 'Absent' && status !== 'Holiday' ? '08:30' : undefined,
      checkOut: status !== 'Absent' && status !== 'Holiday' ? '20:30' : undefined,
    };
    setAttendanceRecord(record);
    setRecords((prev) => ({ ...prev, [guardId]: record }));
    setTimeout(() => setSaving(null), 400);
  };

  const markAll = (status: AttendanceStatus) => {
    guards.forEach((g) => markStatus(g.guardId, status));
    setBulkStatus('');
  };

  const getRecord = (guardId: string) => records[guardId];

  const summary = {
    present: Object.values(records).filter((r) => r.status === 'Present').length,
    absent: Object.values(records).filter((r) => r.status === 'Absent').length,
    late: Object.values(records).filter((r) => r.status === 'Late').length,
    holiday: Object.values(records).filter((r) => r.status === 'Holiday').length,
    unmarked: guards.filter((g) => !records[g.guardId]).length,
  };

  const isToday = date === todayStr();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Mark and track guard attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayStr()}
            className="form-input text-sm px-3 py-2"
            style={{ width: 'auto' }}
          />
          {isToday && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>Today</span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Present', value: summary.present, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
          { label: 'Absent', value: summary.absent, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
          { label: 'Late', value: summary.late, color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
          { label: 'Holiday', value: summary.holiday, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
          { label: 'Unmarked', value: summary.unmarked, color: '#6b7280', bg: '#f0f2f8' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Mark All:</span>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => markAll(s)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: statusColors[s].bg, color: statusColors[s].text }}
          >
            All {s}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400">{guards.length} active guards</div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {guards.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-5xl mb-3">📋</p>
            <p className="text-gray-500">No active guards found. Register guards first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guard</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guards.map((g, idx) => {
                  const rec = getRecord(g.guardId);
                  const isSaving = saving === g.guardId;

                  return (
                    <tr key={g.id} className={`transition-colors ${isSaving ? 'bg-amber-50/40' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-5 py-4 text-sm text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {g.photo ? (
                            <img src={g.photo} alt={g.name} className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #040936, #0a1147)' }}>
                              {g.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{g.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{g.guardId} · {g.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-[150px]">
                        <span className="truncate block" title={g.site}>{g.site}</span>
                      </td>
                      <td className="px-5 py-4">
                        {rec ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${attendanceBadgeClass(rec.status)}`}>
                            {rec.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not marked</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => markStatus(g.guardId, s)}
                              title={`Mark ${s}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border"
                              style={{
                                background: rec?.status === s ? statusColors[s].bg : 'transparent',
                                color: rec?.status === s ? statusColors[s].text : '#9ca3af',
                                borderColor: rec?.status === s ? statusColors[s].bg : '#e5e7eb',
                                transform: rec?.status === s ? 'scale(1.05)' : 'scale(1)',
                              }}
                            >
                              {s === 'Present' ? 'P' : s === 'Absent' ? 'A' : s === 'Late' ? 'L' : 'H'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Legend:</span>
        {STATUSES.map((s) => (
          <span key={s} className={`px-2.5 py-1 rounded-full font-semibold ${attendanceBadgeClass(s)}`}>{s}</span>
        ))}
        <span className="text-gray-400">· Click P/A/L/H to toggle status · Changes auto-save</span>
      </div>
    </div>
  );
}
