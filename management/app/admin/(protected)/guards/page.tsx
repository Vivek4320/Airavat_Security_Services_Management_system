'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getGuards, saveGuards } from '@/lib/data';
import { Guard } from '@/lib/types';
import { formatCurrency, formatDate, guardStatusClass } from '@/lib/utils';

const COMPANY = {
  name: 'Airavat Security Service',
  tagline: 'Premier Security & Facility Solutions',
  address: '1st Floor, Akash Complex, Nilkamal Chowk, Jamnagar, Gujarat - 361006',
  phone: '+91-9426865263 / +91-9876543210',
  email: 'airavats1@gmail.com',
  website: 'www.airavatsecurity.in',
  gstin: '24ABCDE1234F1Z5',
  regNo: 'GUJ/JAM/SEC/2019/0842',
};

export default function GuardsPage() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [filtered, setFiltered] = useState<Guard[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [deleteTarget, setDeleteTarget] = useState<Guard | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [printGuard, setPrintGuard] = useState<Guard | null>(null);

  // Database sync states
  const [loading, setLoading] = useState(true);
  const [dbSource, setDbSource] = useState<'supabase' | 'local'>('local');
  const [dbMessage, setDbMessage] = useState<string>('');

  // Fetch guards from API (Supabase) with local fallback
  const loadGuards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guards');
      const data = await res.json();

      if (data.guards && data.guards.length > 0) {
        setGuards(data.guards);
        setFiltered(data.guards);
        setDbSource('supabase');
        setDbMessage('Connected to Supabase PostgreSQL Database');
      } else {
        // Fallback to local storage
        const local = getGuards();
        setGuards(local);
        setFiltered(local);
        setDbSource(data.source === 'supabase' ? 'supabase' : 'local');
        setDbMessage(data.message || 'Running in local cache mode');
      }
    } catch {
      const local = getGuards();
      setGuards(local);
      setFiltered(local);
      setDbSource('local');
      setDbMessage('Using local storage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuards();
  }, [loadGuards]);

  // Filtering
  useEffect(() => {
    let result = guards;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.guardId.toLowerCase().includes(q) ||
          g.site.toLowerCase().includes(q) ||
          g.designation.toLowerCase().includes(q) ||
          g.phone.includes(q) ||
          (g.aadharNo && g.aadharNo.includes(q))
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((g) => g.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, guards]);

  // Toggle status
  const toggleStatus = async (id: string) => {
    const target = guards.find((g) => g.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    const updated = guards.map((g) =>
      g.id === id ? ({ ...g, status: nextStatus } as Guard) : g
    );
    setGuards(updated);
    saveGuards(updated);

    try {
      await fetch(`/api/guards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.warn('Status patch DB sync:', err);
    }
  };

  // Delete guard
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const updated = guards.filter((g) => g.id !== id);
    setGuards(updated);
    saveGuards(updated);
    setDeleteTarget(null);

    try {
      await fetch(`/api/guards/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Delete DB sync:', err);
    }
  };

  const stats = {
    total: guards.length,
    active: guards.filter((g) => g.status === 'Active').length,
    inactive: guards.filter((g) => g.status === 'Inactive').length,
  };

  // ─── PRINTABLE OFFICIAL GUARD PROFILE PDF SHEET ─────────────────────────
  if (printGuard) {
    return (
      <div className="p-4 sm:p-8 animate-fade-in bg-gray-50 min-h-screen">
        {/* Print Controls Bar */}
        <div className="no-print max-w-4xl mx-auto flex items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <button
            onClick={() => setPrintGuard(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            ← Back to Guard Roster
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Choose "Save as PDF" in print destination
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #040936 0%, #16206c 100%)',
                boxShadow: '0 4px 15px rgba(4,9,54,0.3)',
              }}
            >
              <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save Profile as PDF
            </button>
          </div>
        </div>

        {/* Official Printable Sheet (A4 Proportion) */}
        <div className="guard-print-area bg-white max-w-4xl mx-auto rounded-3xl shadow-xl border border-gray-200 overflow-hidden text-gray-800">
          {/* Official Document Header */}
          <div className="p-8 text-white relative flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: 'linear-gradient(135deg, #040936 0%, #0a1147 60%, #020621 100%)' }}>
            <div className="flex items-center gap-5">
              <img
                src="https://www.airavatsecurity.in/logo.png"
                alt="Airavat Security"
                className="w-20 h-20 object-contain drop-shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#040936] bg-[#C9A84C] tracking-wider uppercase">
                    OFFICIAL DOSSIER
                  </span>
                  <span className="text-[10px] text-white/60 tracking-wider">REG: {COMPANY.regNo}</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mt-1">{COMPANY.name}</h1>
                <p className="text-xs text-white/70 max-w-md mt-0.5 leading-relaxed">{COMPANY.address}</p>
                <p className="text-xs text-[#C9A84C] mt-1 font-semibold">
                  📞 {COMPANY.phone} · ✉ {COMPANY.email}
                </p>
              </div>
            </div>

            <div className="text-right border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-6 shrink-0">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">PERSONNEL ID</p>
              <p className="font-mono font-black text-2xl text-[#C9A84C] tracking-wider">{printGuard.guardId}</p>
              <p className="text-[11px] text-white/70 mt-1">Status: <span className="text-emerald-400 font-bold">{printGuard.status}</span></p>
              <p className="text-[10px] text-white/40 mt-0.5">Enrolled: {formatDate(printGuard.joinDate)}</p>
            </div>
          </div>

          {/* Sub Header Ribbon */}
          <div className="bg-[#C9A84C] px-8 py-2 text-[#040936] font-bold text-xs uppercase tracking-widest flex items-center justify-between">
            <span>SECURITY GUARD OFFICIAL EMPLOYMENT RECORD & IDENTITY PROFILE</span>
            <span>AIRAVAT SECURITY SERVICES PVT. LTD.</span>
          </div>

          {/* Body */}
          <div className="p-8 space-y-7">
            {/* Top Identity Row: Photo + Core Overview */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-200">
              {/* Photograph */}
              <div className="relative shrink-0">
                <div className="w-36 h-36 rounded-2xl overflow-hidden border-4 border-[#C9A84C] shadow-md bg-white flex items-center justify-center">
                  {printGuard.photo ? (
                    <img
                      src={printGuard.photo}
                      alt={printGuard.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 font-bold">
                      <span className="text-3xl mb-1">👮</span>
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>
                <div className="text-center mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#040936] bg-emerald-100 border border-emerald-300">
                    VERIFIED PERSONNEL
                  </span>
                </div>
              </div>

              {/* Guard Overview Details */}
              <div className="flex-1 text-left space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{printGuard.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${guardStatusClass(printGuard.status)}`}>
                      {printGuard.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#040936] mt-0.5">{printGuard.designation}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-gray-200">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Official Guard ID:</span>
                    <span className="font-mono font-bold text-gray-800 text-sm">{printGuard.guardId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Primary Mobile:</span>
                    <span className="font-bold text-gray-800">+91 {printGuard.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Gender / Age:</span>
                    <span className="font-semibold text-gray-800">{printGuard.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Assigned Site:</span>
                    <span className="font-bold text-gray-800">{printGuard.site}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Monthly Salary:</span>
                    <span className="font-bold text-[#040936] text-sm">{formatCurrency(printGuard.salary)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Date of Joining:</span>
                    <span className="font-semibold text-gray-800">{formatDate(printGuard.joinDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Detailed Personal & Identification Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#040936] border-b-2 border-[#040936] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#040936] text-white flex items-center justify-center text-[10px]">1</span>
                Personal Bio-Data & Government Verification
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 text-[11px] block">Full Legal Name:</span>
                  <span className="font-bold text-gray-800">{printGuard.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Date of Birth:</span>
                  <span className="font-semibold text-gray-800">{printGuard.dob || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Gender:</span>
                  <span className="font-semibold text-gray-800">{printGuard.gender}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Aadhar Card Number:</span>
                  <span className="font-mono font-bold text-gray-800">{printGuard.aadharNo || 'Not Provided'}</span>
                </div>

                <div>
                  <span className="text-gray-400 text-[11px] block">Official Email Address:</span>
                  <span className="font-medium text-gray-800">{printGuard.email || 'Not Provided'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Residential Address & Deployment */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#040936] border-b-2 border-[#040936] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#040936] text-white flex items-center justify-center text-[10px]">2</span>
                Permanent Address & Client Deployment Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                  <span className="text-gray-400 text-[11px] block mb-1">Residential Address:</span>
                  <p className="font-medium text-gray-800 leading-relaxed">{printGuard.address}</p>
                </div>

                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-[11px]">Deployed Client Site:</span>
                    <span className="font-bold text-gray-800">{printGuard.site}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-[11px]">Assigned Role / Rank:</span>
                    <span className="font-bold text-gray-800">{printGuard.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-[11px]">Gross Monthly Remuneration:</span>
                    <span className="font-bold text-[#040936]">{formatCurrency(printGuard.salary)} / Month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Portal Login Credentials */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#040936] border-b-2 border-[#040936] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#040936] text-white flex items-center justify-center text-[10px]">3</span>
                Airavat Guard Portal Authentication Credentials
              </h3>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Portal Login ID:</span>
                  <span className="font-mono font-black text-[#040936] text-sm">{printGuard.guardId}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Access Password:</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">{printGuard.password}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Portal Web Address:</span>
                  <span className="font-mono font-medium text-blue-700 text-xs">/guard/login</span>
                </div>
              </div>
            </div>

            {/* Terms & Verification Signatures */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 text-center mb-10 leading-relaxed italic">
                This document certifies that the individual named above is an officially registered and verified security operative under contract with {COMPANY.name}. All certifications, background screenings, and photo authentications are recorded in our security database.
              </p>

              <div className="grid grid-cols-3 gap-8 text-center text-xs">
                <div>
                  <div className="h-14 border-b border-gray-400 mx-6 mb-2" />
                  <p className="font-bold text-gray-800">Operative Signature</p>
                  <p className="text-[10px] text-gray-400">({printGuard.name})</p>
                </div>
                <div>
                  <div className="h-14 border-b border-gray-400 mx-6 mb-2 flex items-center justify-center">
                    <span className="text-[10px] text-gray-300 font-serif">[OFFICIAL STAMP]</span>
                  </div>
                  <p className="font-bold text-gray-800">Field Inspection Officer</p>
                  <p className="text-[10px] text-gray-400">Jamnagar Division</p>
                </div>
                <div>
                  <div className="h-14 border-b border-gray-400 mx-6 mb-2" />
                  <p className="font-bold text-[#040936]">Authorized Signatory</p>
                  <p className="text-[10px] text-gray-500">{COMPANY.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Ribbon */}
          <div className="bg-[#040936] px-8 py-3 text-white text-center text-[11px] flex items-center justify-between">
            <span className="text-white/60">Airavat Security System Record ID: {printGuard.id}</span>
            <span className="text-[#C9A84C] font-semibold">ISO 9001:2015 Certified Security Provider</span>
            <span className="text-white/60">Generated: {new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN GUARD ROSTER VIEW ─────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#C9A84C] bg-[#040936]">
              AIRAVAT SECURITY
            </span>
            <button
              onClick={() => setShowDbModal(true)}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-all hover:opacity-80 cursor-pointer ${dbSource === 'supabase' && dbTestResult?.connected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              title="Click to manage Supabase database connection"
            >
              <span className={`w-2 h-2 rounded-full ${dbSource === 'supabase' && dbTestResult?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {dbSource === 'supabase' && dbTestResult?.connected
                ? 'Supabase Database Connected ✓'
                : 'Connect Supabase Database ⚡'}
            </button>
          </div>
          <h1 className="text-2xl font-black text-[#040936] tracking-tight">Security Personnel Roster</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {stats.total} total enrolled guards · {stats.active} on active duty deployment
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDbModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>⚡</span>
            <span>DB Setup</span>
          </button>

          <button
            onClick={loadGuards}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh list from database"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <Link
            href="/admin/guards/register"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #040936, #16206c)',
              boxShadow: '0 4px 12px rgba(4,9,54,0.2)',
            }}
          >
            <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Enroll New Guard
          </Link>
        </div>
      </div>

      {/* Database Setup Banner if still on local / awaiting password */}
      {(!dbTestResult?.connected || dbSource === 'local') && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="font-bold text-amber-900">Connect to Supabase PostgreSQL Database</p>
              <p className="text-amber-700 mt-0.5">
                Click <strong>"Connect Supabase"</strong> to enter your database password and activate direct cloud synchronization.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDbModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-colors"
          >
            Enter DB Password →
          </button>
        </div>
      )}

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Enrolled Personnel', value: stats.total, color: '#040936', bg: 'rgba(4,9,54,0.06)', sub: 'Roster Count' },
          { label: 'Active Deployments', value: stats.active, color: '#059669', bg: 'rgba(5,150,105,0.08)', sub: 'On Duty' },
          { label: 'Inactive / On Leave', value: stats.inactive, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', sub: 'Standby' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl" style={{ background: s.bg, color: s.color }}>
              👮
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, Guard ID, site, designation, mobile, or Aadhar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 text-xs sm:text-sm"
            />
          </div>
          <div className="flex gap-1.5 shrink-0">
            {(['All', 'Active', 'Inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s
                    ? 'bg-[#040936] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table with Complete Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-3">👮</div>
            <p className="text-gray-800 font-bold text-base">No Guards Found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your search criteria or register a new guard</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-gray-100">
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Guard ID</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Photo & Name</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Site Deployed</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Guard ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold px-2 py-1 rounded bg-[#040936]/5 text-[#040936] text-xs">
                        {g.guardId}
                      </span>
                    </td>

                    {/* Photograph & Name */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {g.photo ? (
                          <img
                            src={g.photo}
                            alt={g.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#C9A84C]/40 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0" style={{ background: 'linear-gradient(135deg, #040936, #16206c)' }}>
                            {g.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 hover:text-[#040936] cursor-pointer" onClick={() => setSelectedGuard(g)}>
                            {g.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {g.gender} {g.dob ? `· DOB: ${g.dob}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Mobile & Email */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-semibold text-gray-800">+91 {g.phone}</p>
                      {g.email && <p className="text-[11px] text-gray-400">{g.email}</p>}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                        {g.designation}
                      </span>
                    </td>

                    {/* Site */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="font-medium text-gray-800 truncate" title={g.site}>
                        {g.site}
                      </p>
                    </td>

                    {/* Salary */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900">
                      {formatCurrency(g.salary)}
                      <span className="text-[10px] text-gray-400 font-normal">/mo</span>
                    </td>

                    {/* Join Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                      {formatDate(g.joinDate)}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(g.id)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${guardStatusClass(g.status)}`}
                        title="Click to toggle Active / Inactive"
                      >
                        {g.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download Profile PDF Button */}
                        <button
                          onClick={() => setPrintGuard(g)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Download Official Profile as PDF"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>

                        {/* View Full Profile Modal */}
                        <button
                          onClick={() => setSelectedGuard(g)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#040936] hover:bg-gray-100 transition-colors"
                          title="View complete guard details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Delete Guard */}
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete guard record"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── FULL GUARD DETAILS MODAL ────────────────────────────────────── */}
      {selectedGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header Banner */}
            <div className="p-6 bg-gradient-to-r from-[#040936] to-[#16206c] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-base">
                  👮
                </span>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">Guard Complete Profile</h3>
                  <p className="text-xs text-slate-300">Airavat Security Services Official Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuard(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Photo & Identity Section */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                {selectedGuard.photo ? (
                  <img
                    src={selectedGuard.photo}
                    alt={selectedGuard.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C9A84C] shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, #040936, #0a1147)' }}>
                    {selectedGuard.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#040936] text-white text-xs">
                      {selectedGuard.guardId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${guardStatusClass(selectedGuard.status)}`}>
                      {selectedGuard.status}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-gray-900">{selectedGuard.name}</h4>
                  <p className="text-gray-500 font-medium">{selectedGuard.designation}</p>
                </div>
              </div>

              {/* Personal Details Grid */}
              <div>
                <h5 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider mb-2 text-[#040936]">
                  Personal & ID Information
                </h5>
                <div className="grid grid-cols-2 gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Mobile Phone:</span>
                    <span className="font-bold text-gray-800">+91 {selectedGuard.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Email Address:</span>
                    <span className="font-medium text-gray-800">{selectedGuard.email || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Date of Birth:</span>
                    <span className="font-medium text-gray-800">{selectedGuard.dob || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Gender:</span>
                    <span className="font-medium text-gray-800">{selectedGuard.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Aadhar Number:</span>
                    <span className="font-mono font-semibold text-gray-800">{selectedGuard.aadharNo || 'Not Provided'}</span>
                  </div>

                </div>
              </div>

              {/* Address */}
              <div>
                <h5 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider mb-2 text-[#040936]">
                  Residential Address
                </h5>
                <div className="p-3.5 rounded-2xl bg-gray-50/60 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{selectedGuard.address}</p>
                </div>
              </div>

              {/* Deployment & Employment */}
              <div>
                <h5 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider mb-2 text-[#040936]">
                  Deployment & Remuneration
                </h5>
                <div className="grid grid-cols-2 gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Client Site:</span>
                    <span className="font-bold text-gray-800">{selectedGuard.site}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Monthly Salary:</span>
                    <span className="font-bold text-[#040936] text-sm">{formatCurrency(selectedGuard.salary)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Date Joined:</span>
                    <span className="font-medium text-gray-800">{formatDate(selectedGuard.joinDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Portal Password:</span>
                    <span className="font-mono font-semibold text-gray-800">{selectedGuard.password}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setPrintGuard(selectedGuard);
                  setSelectedGuard(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg, #040936, #16206c)' }}
              >
                <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleStatus(selectedGuard.id);
                    setSelectedGuard((prev) =>
                      prev ? { ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' } : null
                    );
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedGuard.status === 'Active'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    }`}
                >
                  Mark as {selectedGuard.status === 'Active' ? 'Inactive' : 'Active'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGuard(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Delete Guard Record?</h3>
            <p className="text-gray-500 text-xs text-center mb-6">
              This will permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.guardId}) from the roster and database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
