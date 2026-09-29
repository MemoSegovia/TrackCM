'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Dumbbell, Lock, Mail, ArrowRight, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { getActiveCicloEscolar, DEFAULT_ACTIVE_CICLO } from '@/lib/ciclosEscolares';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeCiclo, setActiveCiclo] = useState<string>(DEFAULT_ACTIVE_CICLO);

  useEffect(() => {
    // Read the active ciclo set by the Admin
    setActiveCiclo(getActiveCicloEscolar());

    const handleCicloChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.ciclo) setActiveCiclo(detail.ciclo);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('trackcm_active_ciclo_changed', handleCicloChange);
      return () => window.removeEventListener('trackcm_active_ciclo_changed', handleCicloChange);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('trackcm_user', JSON.stringify(data.user));
          // Always persist the admin-set active ciclo for this session
          localStorage.setItem('trackcm_active_ciclo', activeCiclo);
        }

        const rolLower = data.user.rol?.toLowerCase() || '';
        if (rolLower === 'administrador' || rolLower === 'admin') {
          router.push('/admin');
        } else if (rolLower === 'maestro' || rolLower === 'profesor') {
          router.push('/maestro');
        } else {
          router.push('/alumno');
        }
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      setError('Error de comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión en TrackCM</h2>
            <p className="text-xs text-slate-400">Colegio Mexicano • Sistema de Educación Física</p>

            {/* Active Ciclo Escolar — Read-only badge */}
            <div className="pt-2 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 bg-slate-950 border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400 font-semibold">Ciclo Escolar:</span>
                <span className="text-xs font-black font-mono text-emerald-300 tracking-wide">{activeCiclo}</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> Correo Institucional
              </label>
              <input
                type="email"
                placeholder="ejemplo@colmexi.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 overflow-hidden relative
                ${loading
                  ? 'bg-slate-800 border border-emerald-500/40 text-emerald-300 cursor-not-allowed shadow-inner shadow-emerald-900/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40'}`}
            >
              {loading ? (
                <>
                  {/* Animated shimmer bar */}
                  <span className="absolute inset-0 overflow-hidden rounded-xl">
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
                  </span>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-300 font-semibold tracking-wide text-sm">Accediendo</span>
                    <span className="flex gap-0.5 items-end pb-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </span>
                </>
              ) : (
                <>
                  Entrar a la Plataforma
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
