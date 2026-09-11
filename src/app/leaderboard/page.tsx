'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ExportPdfButton from '@/components/ExportPdfButton';
import { UserSession } from '@/lib/types';
import { Award, Trophy, Medal, Filter, Flame, Sparkles } from 'lucide-react';
import { getGradosByNivel, getPruebasByNivel } from '@/lib/pruebasNivel';
import confetti from 'canvas-confetti';

export default function LeaderboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [nivel, setNivel] = useState<string>('Todos');
  const [grado, setGrado] = useState<string>('Todos');
  const [grupo, setGrupo] = useState<string>('Todos');
  const [rama, setRama] = useState<string>('Mixto');
  const [prueba, setPrueba] = useState<string>('Todas');

  const [leaderboards, setLeaderboards] = useState<Record<string, Array<any>>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Available grade options based on selected level
  const availableGrados = getGradosByNivel(nivel);
  // Available test options based on selected level
  const availablePruebas = getPruebasByNivel(nivel);

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

  const getGenderLabel = (genero?: string): string => {
    if (!genero) return '';
    const g = genero.trim().toUpperCase();
    if (g === 'F' || g === 'FEMENINO' || g === 'MUJER' || g === 'FEMENIL') return 'Femenil';
    if (g === 'M' || g === 'H' || g === 'MASCULINO' || g === 'VARONIL' || g === 'HOMBRE') return 'Varonil';
    return genero;
  };

  // When nivel changes, reset grade and test if invalid for new level
  const handleNivelChange = (newNivel: string) => {
    setNivel(newNivel);
    const validGrados = getGradosByNivel(newNivel);
    if (grado !== 'Todos' && !validGrados.some((g) => g.value === grado)) {
      setGrado('Todos');
    }
    const validPruebas = getPruebasByNivel(newNivel);
    if (prueba !== 'Todas' && !validPruebas.some((p) => p.value === prueba)) {
      setPrueba('Todas');
    }
  };

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (nivel !== 'Todos') params.append('nivel', nivel);
      if (grado !== 'Todos') params.append('grado', grado);
      if (grupo !== 'Todos') params.append('grupo', grupo);
      if (rama !== 'Mixto') params.append('rama', rama);
      if (prueba !== 'Todas') params.append('prueba', prueba);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboards(data.leaderboards || {});

        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
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
  }, [nivel, grado, grupo, rama, prueba]);

  const isFilteredGroup = nivel !== 'Todos' || grado !== 'Todos' || grupo !== 'Todos' || rama !== 'Mixto';

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
              Colegio Mexicano • Ranking por Nivel, Grado, Grupo, Rama y Prueba Deportiva
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportPdfButton
              elementId="leaderboard-pdf-report"
              fileName="Leaderboards_Colegio_Mexicano.pdf"
              title="Tabla de Posiciones Oficial"
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Nivel Escolar</label>
              <select
                value={nivel}
                onChange={(e) => handleNivelChange(e.target.value)}
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Grado</label>
              <select
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los Grados</option>
                {availableGrados.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Grupo</label>
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los Grupos</option>
                <option value="A">Grupo A</option>
                <option value="B">Grupo B</option>
                <option value="C">Grupo C</option>
                <option value="D">Grupo D</option>
                <option value="E">Grupo E</option>
              </select>
            </div>

            {/* Rama / Género */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Rama</label>
              <select
                value={rama}
                onChange={(e) => setRama(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-sky-300 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="Mixto">Mixto</option>
                <option value="Varonil">Varonil</option>
                <option value="Femenil">Femenil</option>
              </select>
            </div>

            {/* Resultado por Prueba */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Prueba</label>
              <select
                value={prueba}
                onChange={(e) => setPrueba(e.target.value)}
                className="bg-slate-950 text-xs font-semibold text-amber-300 rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="Todas">Todas las Pruebas</option>
                {availablePruebas.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboards Display Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Cargando ranking y mejores marcas...
          </div>
        ) : Object.keys(leaderboards).length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
            No se encontraron marcas para los filtros seleccionados.
          </div>
        ) : (
          <div id="leaderboard-pdf-report" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(leaderboards).map(([pruebaName, studentList]) => (
              <div
                key={pruebaName}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold text-white">{pruebaName}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {isFilteredGroup
                      ? `RANKING ${rama !== 'Mixto' ? rama.toUpperCase() : 'GRUPO'} (${studentList.length} ALUMNOS)`
                      : 'TOP 3 GENERAL'}
                  </span>
                </div>

                {studentList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Sin alumnos en la prueba</p>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {studentList.map((item) => {
                      let medalBg = 'bg-slate-950 border-slate-800 text-slate-300';
                      let badge = `#${item.posicion}`;
                      let iconColor = 'text-slate-400';

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
                      } else if (item.posicion > 3) {
                        badge = `#${item.posicion} Lugar`;
                      } else {
                        medalBg = 'bg-slate-950/60 border-slate-900 text-slate-500 opacity-60';
                        badge = 'Sin Marca';
                      }

                      return (
                        <div
                          key={item.idRegistro || item.idAlumno}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.005] ${medalBg}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-slate-950 font-mono font-black text-xs flex items-center justify-center border border-slate-800 ${iconColor}`}>
                              {item.posicion ? `#${item.posicion}` : '-'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                {item.nombreAlumno}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.nivel} • {item.grado}° "{item.grupo}" {item.genero ? `• ${getGenderLabel(item.genero)}` : ''} {item.fecha ? `| ${item.fecha}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-base font-black font-mono ${item.resultado === 'Sin marca' ? 'text-slate-500 text-xs font-normal' : 'text-amber-400'}`}>
                              {item.resultado}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
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
