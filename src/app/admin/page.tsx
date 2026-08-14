'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ExportPdfButton from '@/components/ExportPdfButton';
import BestResultsTable from '@/components/BestResultsTable';
import { UserSession, AdminMetrics } from '@/lib/types';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Trophy,
  HeartPulse,
  Award,
  BarChart2,
  PieChart,
  RefreshCw,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const rolLower = parsed.rol?.toLowerCase() || '';
          if (rolLower !== 'administrador' && rolLower !== 'admin') {
            router.push('/maestro');
          } else {
            setUser(parsed);
          }
        } catch (e) {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-black text-white">Dashboard de Administrador</h1>
            </div>
            <p className="text-xs text-slate-400">
              Colegio Mexicano • Monitoreo Global de Avance de Alumnos y Registros de Profesores
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportPdfButton
              elementId="admin-dashboard-report"
              fileName="Reporte_General_Administrador_TrackCM.pdf"
              title="Reporte Global de Administrador"
            />
            <button
              onClick={loadMetrics}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
              title="Actualizar Métricas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Exportable PDF Container */}
        <div id="admin-dashboard-report" className="space-y-6 p-2 rounded-2xl">
          {/* Top Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Alumnos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-slate-400">Total Alumnos</p>
                <p className="text-3xl font-black text-white font-mono mt-1">
                  {metrics?.totalAlumnos || 0}
                </p>
                <p className="text-[10px] text-slate-500">Inscritos en 5 Niveles</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Total Maestros */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-slate-400">Profesores Activos</p>
                <p className="text-3xl font-black text-indigo-400 font-mono mt-1">
                  {metrics?.totalMaestros || 0}
                </p>
                <p className="text-[10px] text-slate-500">Personal de Educación Física</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Total Registros Atletismo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-slate-400">Marcas de Atletismo</p>
                <p className="text-3xl font-black text-amber-400 font-mono mt-1">
                  {metrics?.totalRegistrosAtl || 0}
                </p>
                <p className="text-[10px] text-slate-500">Pruebas en Cancha</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            {/* Total Fichas IMC */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-slate-400">Fichas Antropométricas</p>
                <p className="text-3xl font-black text-cyan-400 font-mono mt-1">
                  {metrics?.totalRegistrosAntro || 0}
                </p>
                <p className="text-[10px] text-slate-500">Mediciones de IMC</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <HeartPulse className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* School Level Breakdown & Teacher Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alumnos por Nivel Escolar (2 cols) */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <PieChart className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Alumnos por Nivel Escolar</h3>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'Kinder', label: 'Kinder', color: 'bg-pink-500' },
                  { key: 'Primaria Menor', label: 'Primaria Menor', color: 'bg-emerald-500' },
                  { key: 'Primaria Mayor', label: 'Primaria Mayor', color: 'bg-cyan-500' },
                  { key: 'Secundaria', label: 'Secundaria', color: 'bg-indigo-500' },
                  { key: 'Preparatoria', label: 'Preparatoria', color: 'bg-amber-500' },
                ].map((item) => {
                  const count = metrics?.alumnosPorNivel[item.key] || 0;
                  const total = metrics?.totalAlumnos || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-white font-mono font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actividad de Profesores (Table) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Reporte de Registros por Profesor</h3>
              </div>

              {metrics?.actividadMaestros.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No hay actividad de profesores registrada aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Profesor</th>
                        <th className="py-2.5 px-3 text-center">Atletismo</th>
                        <th className="py-2.5 px-3 text-center">IMC / Antro</th>
                        <th className="py-2.5 px-3 text-center">Cualitativos</th>
                        <th className="py-2.5 px-3 text-right">Total Registros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {metrics?.actividadMaestros.map((m) => (
                        <tr key={m.idMaestro} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                              {m.nombreMaestro.charAt(0)}
                            </div>
                            {m.nombreMaestro}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-400">
                            {m.totalAtletismo}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-cyan-400">
                            {m.totalAntropometricos}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-purple-400">
                            {m.totalCualitativos}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {m.totalRegistros}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Table of Consolidated Best Results */}
          <BestResultsTable user={user} cicloEscolar="2026-2027" />
        </div>
      </main>
    </div>
  );
}
