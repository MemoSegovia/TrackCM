'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Award, UserCheck, LogOut, ShieldCheck, Dumbbell, BarChart3, Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';
import { UserSession } from '@/lib/types';
import { getOfflineQueue, syncOfflineQueue } from '@/lib/offlineManager';

interface NavbarProps {
  user?: UserSession | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setPendingQueueCount(getOfflineQueue().length);

    const handleStatusChange = (e: any) => {
      if (e.detail && typeof e.detail.isOnline === 'boolean') {
        setIsOnline(e.detail.isOnline);
      } else {
        setIsOnline(navigator.onLine);
      }
    };

    const handleQueueChange = () => {
      setPendingQueueCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('trackcm_offline_status_change', handleStatusChange as EventListener);
    window.addEventListener('trackcm_queue_updated', handleQueueChange as EventListener);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('trackcm_offline_status_change', handleStatusChange as EventListener);
      window.removeEventListener('trackcm_queue_updated', handleQueueChange as EventListener);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncOfflineQueue();
    setPendingQueueCount(getOfflineQueue().length);
    setIsSyncing(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trackcm_user');
    }
    router.push('/login');
  };

  const rolLower = user?.rol?.toLowerCase() || '';
  const isTeacher = rolLower === 'maestro' || rolLower === 'profesor';
  const isAdmin = rolLower === 'administrador' || rolLower === 'admin';

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
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/admin'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Dashboard Admin
              </Link>
            )}

            {isTeacher && !isAdmin && (
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

            {pathname !== '/' && pathname !== '/login' && (
              <>
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
              </>
            )}
          </nav>

          {/* Right User Controls & Network Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Network Status Badge */}
            {isOnline ? (
              <span
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title="Conexión activa a internet"
              >
                <Wifi className="w-3.5 h-3.5" /> En línea
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                title="Modo Sin Conexión - Los cambios se guardan localmente"
              >
                <WifiOff className="w-3.5 h-3.5" /> Sin conexión
              </span>
            )}

            {/* Offline Pending Queue Badge */}
            {pendingQueueCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-75"
                title={isOnline ? 'Haga clic para sincronizar registros pendientes' : 'Conecte a internet para sincronizar'}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{pendingQueueCount} pend.</span>
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

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
              pathname !== '/login' && (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  Iniciar Sesión
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                pathname === '/admin' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {isTeacher && !isAdmin && (
            <Link
              href="/maestro"
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                pathname === '/maestro' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Cancha
            </Link>
          )}

          {pathname !== '/' && pathname !== '/login' && (
            <>
              <Link
                href="/leaderboard"
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  pathname === '/leaderboard' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Ranking
              </Link>

              <Link
                href="/alumno"
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  pathname === '/alumno' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Historial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
