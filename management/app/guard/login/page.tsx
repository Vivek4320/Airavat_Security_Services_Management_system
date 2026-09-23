'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGuards } from '@/lib/data';

export default function GuardLogin() {
  const [guardId, setGuardId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const auth = localStorage.getItem('airavat_guard_auth');
      if (auth && JSON.parse(auth).loggedIn) router.push('/guard/dashboard');
    } catch {}
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const guards = getGuards();
      const guard = guards.find(
        (g) => g.guardId.toLowerCase() === guardId.trim().toLowerCase() && g.password === password
      );
      if (guard) {
        localStorage.setItem(
          'airavat_guard_auth',
          JSON.stringify({ loggedIn: true, guardId: guard.guardId, name: guard.name })
        );
        router.push('/guard/dashboard');
      } else {
        setError('Invalid Guard ID or password. Check with admin.');
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #040936 0%, #0d1557 50%, #020621 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(201,168,76,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: '#C9A84C', filter: 'blur(80px)' }} />

      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ background: 'rgba(201,168,76,0.12)', border: '2px solid rgba(201,168,76,0.3)' }}>
            <img src="https://www.airavatsecurity.in/logo.png" alt="Airavat Logo" className="w-18 h-18 object-contain" style={{ width: '72px', height: '72px' }} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Guard Portal</h1>
          <p className="text-sm tracking-widest font-medium mt-1" style={{ color: '#C9A84C' }}>AIRAVAT SECURITY SERVICE</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #A68B35)' }}>
              <svg className="w-5 h-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="#040936" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Guard Sign In</h2>
              <p className="text-white/40 text-xs">Access your attendance & schedule</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" suppressHydrationWarning>
            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">Guard ID</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
                <input
                  id="guard-id"
                  type="text"
                  value={guardId}
                  onChange={(e) => setGuardId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/25 transition-all duration-200 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  onFocus={(e) => { e.target.style.borderColor = '#C9A84C'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="e.g. GRD001"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="guard-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-white placeholder-white/25 transition-all duration-200 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  onFocus={(e) => { e.target.style.borderColor = '#C9A84C'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your password"
                  required
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  suppressHydrationWarning
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              id="guard-login-btn"
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #D4AF6A 50%, #A68B35 100%)',
                color: '#040936',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /></svg>
                  Verifying...
                </span>
              ) : 'Sign In to Guard Portal'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white/30 text-xs mb-1">Admin?</p>
            <a href="/admin/login" className="text-sm font-medium transition-colors hover:text-white" style={{ color: '#C9A84C' }}>
              ← Admin Portal Login
            </a>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">© 2026 Airavat Security Service</p>
      </div>
    </div>
  );
}
