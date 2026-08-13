'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { UserSession } from '@/lib/types';
import {
  Trophy,
  Dumbbell,
  Users,
  Timer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Award,
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
              Plataforma digital para profesores y alumnos del Colegio Mexicano. Registra marcas de atletismo con cronómetro en cancha, saltos, lanzamientos, fichas antropométricas con IMC en tiempo real y evaluaciones cualitativas respaldadas por Google Sheets API.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {user ? (
                user.rol === 'Maestro' ? (
                  <Link
                    href="/maestro"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                  >
                    <Dumbbell className="w-5 h-5" /> Portal de Registro en Cancha
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/alumno"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                  >
                    <Activity className="w-5 h-5" /> Consultar Mi Historial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                  >
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    <Trophy className="w-5 h-5 text-amber-400" /> Ver Leaderboards Top 3
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Core Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Atletismo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Módulo de Atletismo</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Cronómetro digital integrado en frontend con botones de Iniciar, Pausar, Lap/Vuelta y guardado directo a Sheets. Formulario de 3 intentos para Saltos y Lanzamientos.
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

          {/* Card 3: Google Sheets Backend */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Base de Datos Google Sheets</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Comunicación transparente vía Serverless Functions de Vercel (API Routes). Soporta Service Account con Googleapis y capa de contingencia automática.
            </p>
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 5 Pestañas Sincronizadas
            </span>
          </div>
        </section>

        {/* Direct Links Footer */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Tablas de Posiciones Top 3</h4>
              <p className="text-xs text-slate-400">Consulta los mejores tiempos y marcas clasificadas por Grupo, Nivel o General.</p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all"
          >
            Explorar Leaderboards
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 TrackCM — Colegio Mexicano. Desarrollado por Soporte de Sistemas.
      </footer>
    </div>
  );
}
