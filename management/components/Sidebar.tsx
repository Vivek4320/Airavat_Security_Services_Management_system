'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Guards',
    href: '/admin/guards',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    sub: [
      { label: 'Guard List', href: '/admin/guards' },
      { label: 'Register Guard', href: '/admin/guards/register' },
    ],
  },
  {
    label: 'Attendance',
    href: '/admin/attendance',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Invoices',
    href: '/admin/invoices',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string | null>('Guards');

  const handleLogout = () => {
    localStorage.removeItem('airavat_admin_auth');
    router.push('/admin/login');
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #040936 0%, #020621 100%)' }}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(201,168,76,0.4)' }}>
            <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2" style={{ borderColor: '#040936' }} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm tracking-wider" style={{ color: '#C9A84C' }}>AIRAVAT</p>
          <p className="text-white/50 text-[10px] truncate">Security Management</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold tracking-widest mb-3" style={{ color: 'rgba(201,168,76,0.5)' }}>MAIN MENU</p>

        {navItems.map((item) => {
          const active = isActive(item.href);
          const hasSubMenu = !!item.sub;
          const isExpanded = expandedItem === item.label;

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (hasSubMenu) {
                    setExpandedItem(isExpanded ? null : item.label);
                  } else {
                    router.push(item.href);
                    onClose?.();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group"
                style={{
                  background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: active ? '#C9A84C' : 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                  }
                }}
              >
                {/* Active indicator */}
                <span
                  className="shrink-0 transition-all duration-200"
                  style={{ color: active ? '#C9A84C' : 'inherit' }}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {active && !hasSubMenu && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#C9A84C' }} />
                )}
                {hasSubMenu && (
                  <svg
                    className="w-4 h-4 shrink-0 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Submenu */}
              {hasSubMenu && isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l pl-3" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
                  {item.sub!.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <button
                        key={sub.href}
                        onClick={() => { router.push(sub.href); onClose?.(); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                        style={{
                          background: subActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                          color: subActive ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                        }}
                        onMouseEnter={(e) => { if (!subActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                        onMouseLeave={(e) => { if (!subActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; } }}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: User + Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #C9A84C, #A68B35)', color: '#040936' }}>
            A
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Administrator</p>
            <p className="text-white/30 text-[10px]">admin@airavat.in</p>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
