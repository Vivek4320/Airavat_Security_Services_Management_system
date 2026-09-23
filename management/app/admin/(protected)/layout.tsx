'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const auth = localStorage.getItem('airavat_admin_auth');
      if (auth && JSON.parse(auth).loggedIn) {
        setAuthorized(true);
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#040936' }}>
        <div className="flex flex-col items-center gap-4">
          <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat" className="w-16 h-16 opacity-80" />
          <div className="flex items-center gap-3">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: '#C9A84C' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
            <span className="text-white/60 text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0F2F8' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full shadow-2xl">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full shadow-2xl z-10">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 py-3 shadow-sm shrink-0"
          style={{ background: '#040936', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm tracking-wider" style={{ color: '#C9A84C' }}>AIRAVAT</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
