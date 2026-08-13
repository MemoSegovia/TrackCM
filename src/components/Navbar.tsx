'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Award, UserCheck, LogOut, ShieldCheck, Dumbbell } from 'lucide-react';
import { UserSession } from '@/lib/types';

interface NavbarProps {
  user?: UserSession | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trackcm_user');
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Dumbbell className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                TrackCM
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Colegio Mexicano
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {(user?.rol?.toLowerCase() === 'maestro' || user?.rol?.toLowerCase() === 'profesor') && (
              <Link
                href="/maestro"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/maestro'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Registro Cancha
              </Link>
            )}

            <Link
              href="/leaderboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/leaderboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              Leaderboard
            </Link>

            <Link
              href="/alumno"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/alumno'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              Historial Estudiante
            </Link>
          </nav>

          {/* Right User Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-200">{user.nombre}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    {user.rol}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-slate-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          {(user?.rol?.toLowerCase() === 'maestro' || user?.rol?.toLowerCase() === 'profesor') && (
            <Link
              href="/maestro"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
                pathname === '/maestro' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Cancha
            </Link>
          )}
          <Link
            href="/leaderboard"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
              pathname === '/leaderboard' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
            Ranking
          </Link>
          <Link
            href="/alumno"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
              pathname === '/alumno' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            Historial
          </Link>
        </div>
      </div>
    </header>
  );
}
