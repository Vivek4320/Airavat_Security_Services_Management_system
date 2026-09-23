'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quickActions = [
    {
      title: 'Register New Guard',
      href: '/admin/guards/register',
      desc: 'Enroll guards with live photo capture, ID generation, and full profile details',
      badge: 'Registration',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #040936 0%, #16206c 100%)',
      btnText: 'Open Registration Form',
    },
    {
      title: 'Guard Roster & Profiles',
      href: '/admin/guards',
      desc: 'View active guard roster, search, filter by deployment site, and manage statuses',
      badge: 'Personnel',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #081254 0%, #1e3a8a 100%)',
      btnText: 'View Guard List',
    },
    {
      title: 'Daily Attendance Tracker',
      href: '/admin/attendance',
      desc: 'Mark daily attendance, manage present/absent logs, and monitor deployment status',
      badge: 'Operations',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
      btnText: 'Open Attendance Sheet',
    },
    {
      title: 'Invoice & Billing Generator',
      href: '/admin/invoices',
      desc: 'Generate professional GST invoices with client billing items and printable format',
      badge: 'Finance',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #854d0e 0%, #C9A84C 100%)',
      btnText: 'Create / View Invoices',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#C9A84C] bg-[#040936]">
              AIRAVAT SECURITY
            </span>
            <span className="text-xs font-medium text-gray-400">Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#040936] tracking-tight">
            Welcome back, Admin 👋
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{today}</p>
        </div>

        <Link
          href="/admin/guards/register"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg self-start sm:self-auto shrink-0"
          style={{
            background: 'linear-gradient(135deg, #040936 0%, #16206c 100%)',
            boxShadow: '0 4px 14px rgba(4,9,54,0.25)',
          }}
        >
          <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Guard
        </Link>
      </div>

      {/* Main Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {quickActions.map((action) => (
          <div
            key={action.href}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                  style={{ background: action.gradient }}
                >
                  {action.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {action.badge}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-1.5">{action.title}</h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">{action.desc}</p>
            </div>

            <Link
              href={action.href}
              className="inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors bg-gray-50 hover:bg-[#040936] text-[#040936] hover:text-white group"
            >
              <span>{action.btnText}</span>
              <svg
                className="w-4 h-4 text-[#C9A84C] transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
