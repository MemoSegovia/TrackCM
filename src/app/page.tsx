'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { UserSession } from '@/lib/types';
import {
  Dumbbell,
  Timer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Colegio Mexicano • Educación Física
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Registro y Clasificación Deportiva{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                TrackCM
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              Plataforma digital para profesores y alumnos del Colegio Mexicano. Registra marcas de atletismo con cronómetro en cancha, saltos, lanzamientos, fichas antropométricas con IMC en tiempo real y evaluaciones cualitativas.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {user ? (
                (user.rol === 'Maestro' || user.rol === 'Administrador') && (
                  <Link
                    href="/maestro"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                  >
                    <Dumbbell className="w-5 h-5" /> Portal de Registro en Cancha
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                >
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Core Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Atletismo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Módulo de Atletismo</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Cronómetro digital integrado en frontend con botones de Iniciar, Pausar, Lap/Vuelta y guardado directo. Formulario de 3 intentos para Saltos y Lanzamientos.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Alta Precisión en Cancha
            </span>
          </div>

          {/* Card 2: Antropometría */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ficha Antropométrica & IMC</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Captura interactiva de Edad, Peso (kg) y Estatura (cm). Calcula el IMC en tiempo real con semáforo nutricional y seguimiento por ciclo escolar.
            </p>
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> IMC en Tiempo Real
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 TrackCM — Colegio Mexicano. Desarrollado por Soporte de Sistemas.
      </footer>
    </div>
  );
}

