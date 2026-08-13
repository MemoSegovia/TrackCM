'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ExportPdfButton from '@/components/ExportPdfButton';
import { UserSession } from '@/lib/types';
import { Award, Trophy, Medal, Filter, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LeaderboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [nivel, setNivel] = useState<string>('Todos');
  const [grado, setGrado] = useState<string>('Todos');
  const [grupo, setGrupo] = useState<string>('Todos');

  const [leaderboards, setLeaderboards] = useState<Record<string, Array<any>>>({});
  const [loading, setLoading] = useState<boolean>(true);

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

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (nivel !== 'Todos') params.append('nivel', nivel);
      if (grado !== 'Todos') params.append('grado', grado);
      if (grupo !== 'Todos') params.append('grupo', grupo);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboards(data.leaderboards || {});

        // Fire celebratory confetti effect!
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore if canvas not supported
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();
  }, [nivel, grado, grupo]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-black text-white">Leaderboards & Tablas de Posiciones</h1>
            </div>
            <p className="text-xs text-slate-400">
              Colegio Mexicano • Mejores Marcas Top 3 por Grupo, Nivel y Prueba Deportiva
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportPdfButton
              elementId="leaderboard-pdf-report"
              fileName="Leaderboards_Top3_Colegio_Mexicano.pdf"
              title="Tabla de Posiciones Top 3"
              buttonText="PDF Ranking"
            />
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Ranking Oficial
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Filtrar Ranking:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Nivel */}
            <div>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los Niveles</option>
                <option value="Kinder">Kinder</option>
                <option value="Primaria Menor">Primaria Menor</option>
                <option value="Primaria Mayor">Primaria Mayor</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Preparatoria">Preparatoria</option>
              </select>
            </div>

            {/* Grado */}
            <div>
              <select
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los Grados</option>
                <option value="1">1° Grado</option>
                <option value="2">2° Grado</option>
                <option value="3">3° Grado</option>
                <option value="4">4° Grado</option>
                <option value="5">5° Grado</option>
                <option value="6">6° Grado</option>
              </select>
            </div>

            {/* Grupo */}
            <div>
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los Grupos</option>
                <option value="A">Grupo A</option>
                <option value="B">Grupo B</option>
                <option value="C">Grupo C</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboards Display Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Procesando mejores marcas en la cancha...
          </div>
        ) : Object.keys(leaderboards).length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
            No se encontraron marcas para el filtro seleccionado.
          </div>
        ) : (
          <div id="leaderboard-pdf-report" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(leaderboards).map(([pruebaName, top3List]) => (
              <div
                key={pruebaName}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold text-white">{pruebaName}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    TOP 3
                  </span>
                </div>

                {top3List.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Sin atletas en el podio</p>
                ) : (
                  <div className="space-y-3">
                    {top3List.map((item) => {
                      let medalBg = 'bg-slate-800 border-slate-700 text-slate-300';
                      let badge = '🥇 1er Lugar';
                      let iconColor = 'text-amber-400';

                      if (item.posicion === 1) {
                        medalBg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
                        badge = '🥇 1er Lugar';
                        iconColor = 'text-amber-400';
                      } else if (item.posicion === 2) {
                        medalBg = 'bg-slate-300/10 border-slate-300/30 text-slate-200';
                        badge = '🥈 2do Lugar';
                        iconColor = 'text-slate-300';
                      } else if (item.posicion === 3) {
                        medalBg = 'bg-amber-700/10 border-amber-700/30 text-amber-400';
                        badge = '🥉 3er Lugar';
                        iconColor = 'text-amber-600';
                      }

                      return (
                        <div
                          key={item.idRegistro}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-transform hover:scale-[1.01] ${medalBg}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-slate-950 font-black text-xs flex items-center justify-center border border-slate-800 ${iconColor}`}>
                              #{item.posicion}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                {item.nombreAlumno}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.nivel} • {item.grado}° "{item.grupo}" | {item.fecha}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-black text-amber-400 font-mono">
                              {item.resultado}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {badge}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
