'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PerformanceCharts from '@/components/PerformanceCharts';
import ExportPdfButton from '@/components/ExportPdfButton';
import { UserSession, AlumnoInscrito, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from '@/lib/types';
import { Activity, Trophy, HeartPulse, Award, Search, Table, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { calculateIMC } from '@/lib/utils';
import { calculateBestMarksForStudent } from '@/lib/mejoresResultados';

export default function AlumnoPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [student, setStudent] = useState<AlumnoInscrito | null>(null);
  const [historial, setHistorial] = useState<{
    antropometrico: RegistroAntropometrico[];
    atletismo: RegistroAtletismo[];
    cualitativo: RegistroCualitativo[];
  }>({ antropometrico: [], atletismo: [], cualitativo: [] });

  const [loading, setLoading] = useState<boolean>(true);
  const [searched, setSearched] = useState<boolean>(false);
  const [syncingConsolidado, setSyncingConsolidado] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rolLower = user?.rol?.toLowerCase() || '';
  const isTeacherOrAdmin = rolLower === 'maestro' || rolLower === 'profesor' || rolLower === 'administrador' || rolLower === 'admin';

  const handleSyncConsolidado = async () => {
    if (!student) return;
    try {
      setSyncingConsolidado(true);
      setSyncMsg(null);
      const studentGrupo = (student.Grupo || '').trim() || `${student.Grado || ''}${student.Grupo || ''}`;
      const res = await fetch('/api/mejores-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo: studentGrupo,
          cicloEscolar: student.Ciclo_Escolar || '2026-2027',
          nombreMaestro: user?.nombre || 'Profesor de Educación Física',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMsg({
          type: 'success',
          text: `¡Los mejores resultados y tiempos de ${student.Nombre_Completo} han sido registrados y sincronizados exitosamente en la Tabla Consolidada de Google Sheets (Pestaña "${studentGrupo}")!`,
        });
      } else {
        setSyncMsg({
          type: 'error',
          text: data.error || 'Error al sincronizar con Google Sheets',
        });
      }
    } catch (err) {
      console.error(err);
      setSyncMsg({
        type: 'error',
        text: 'Error de red al sincronizar la tabla consolidada',
      });
    } finally {
      setSyncingConsolidado(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          const parsed: UserSession = JSON.parse(stored);
          setUser(parsed);

          const userRol = parsed.rol?.toLowerCase() || '';
          const isStaff = userRol === 'maestro' || userRol === 'profesor' || userRol === 'administrador' || userRol === 'admin';

          if (!isStaff && parsed.correo) {
            // Students automatically view their own history
            fetchHistorial(parsed.correo);
          } else {
            setLoading(false);
          }
        } catch (e) {
          console.error(e);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchHistorial = async (query: string) => {
    if (!query) return;
    try {
      setLoading(true);
      setSearched(true);

      const isEmail = query.includes('@');
      const param = isEmail ? `email=${encodeURIComponent(query)}` : `studentId=${encodeURIComponent(query)}`;

      const res = await fetch(`/api/historial?${param}`);
      const data = await res.json();

      if (data.success) {
        setStudent(data.alumno || null);
        setHistorial(data.historial || { antropometrico: [], atletismo: [], cualitativo: [] });
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error(err);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchHistorial(searchQuery.trim());
    }
  };

  const latestAntro = historial.antropometrico.length > 0 ? historial.antropometrico[0] : null;
  const latestImcInfo = latestAntro ? calculateIMC(latestAntro.Peso_kg, latestAntro.Estatura_cm) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Historial del Estudiante
              </h1>
              <p className="text-xs text-slate-400">
                {isTeacherOrAdmin
                  ? 'Consulta el historial buscando por nombre de alumno, ID o correo'
                  : user
                  ? `Registros pertenecientes a ${user.nombre}`
                  : 'Consulta de expediente de educación física'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 max-w-lg w-full justify-end">
              {/* Search Form for Teachers and Administrators */}
              {isTeacherOrAdmin && (
                <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 w-full">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Escribe el nombre del alumno, ID o correo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-600 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>
              )}

              {/* Export PDF Button */}
              {student && (
                <ExportPdfButton
                  elementId="student-full-report"
                  fileName={`Historial_${student.Nombre_Completo.replace(/\s+/g, '_')}.pdf`}
                  title={`Historial de ${student.Nombre_Completo}`}
                  buttonText="PDF"
                />
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Cargando historial del estudiante...</p>
            </div>
          )}

          {/* Teacher/Admin initial state before search */}
          {!loading && isTeacherOrAdmin && !student && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center font-bold">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Búsqueda de Historial de Alumnos</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searched
                  ? 'No se encontró ningún estudiante con ese nombre, ID o correo.'
                  : 'Como Maestro o Administrador, escribe el nombre del alumno en la barra de búsqueda superior para consultar sus marcas de atletismo, avances de IMC y evaluaciones.'}
              </p>
            </div>
          )}

          {/* Student logged in but no profile record found */}
          {!loading && !isTeacherOrAdmin && user && !student && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3 my-4">
              <h3 className="text-base font-bold text-white">Expediente no encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No se encontró un registro de estudiante asociado a la cuenta <span className="text-cyan-400 font-semibold">{user.correo}</span>.
              </p>
            </div>
          )}

          {/* Not Logged In State */}
          {!loading && !user && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3 my-4">
              <h3 className="text-base font-bold text-white">Inicio de Sesión Requerido</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Debes iniciar sesión para poder consultar el historial deportivo y de salud.
              </p>
              <a
                href="/login"
                className="inline-block px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-600 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                Ir a Iniciar Sesión
              </a>
            </div>
          )}

          {/* Student Profile Header Banner & Full Report Container */}
          {!loading && student && (
            <div id="student-full-report" className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-extrabold text-xl flex items-center justify-center">
                    {student.Nombre_Completo.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{student.Nombre_Completo}</h2>
                    <p className="text-xs text-slate-400">
                      {student.Nivel} • {student.Grado}° "{student.Grupo}" | ID: {student.ID_Alumno}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ciclo Escolar: {student.Ciclo_Escolar}</p>
                  </div>
                </div>

                {/* Latest IMC summary widget */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Último IMC</p>
                    <p className="text-xl font-black text-white font-mono">
                      {latestAntro ? latestAntro.IMC : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {latestAntro ? `${latestAntro.Peso_kg} kg | ${latestAntro.Estatura_cm} cm` : 'Sin registros'}
                    </p>
                  </div>
                  {latestImcInfo && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${latestImcInfo.badgeClass}`}>
                      {latestImcInfo.categoria}
                    </span>
                  )}
                </div>

                {/* Athletic marks count widget */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Pruebas Registradas</p>
                    <p className="text-xl font-black text-emerald-400 font-mono">
                      {historial.atletismo.length}
                    </p>
                    <p className="text-[10px] text-slate-500">Atletismo y Saltos</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Consolidated Best Results Card for the Student */}
              {(() => {
                const bestMarks = calculateBestMarksForStudent(student, historial.atletismo, historial.cualitativo);
                const studentGrupo = (student.Grupo || '').trim() || `${student.Grado || ''}${student.Grupo || ''}`;

                return (
                  <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <Table className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            Tabla de Mejores Resultados Consolidados
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Pestaña "{studentGrupo}"
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Marcas más destacadas y mejores tiempos registrados del estudiante
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSyncConsolidado}
                        disabled={syncingConsolidado}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingConsolidado ? 'animate-spin' : ''}`} />
                        {syncingConsolidado ? 'Registrando...' : 'Registrar en Tabla Consolidada (Google Sheets)'}
                      </button>
                    </div>

                    {syncMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          syncMsg.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {syncMsg.text}
                      </div>
                    )}

                    {/* Grid of 7 Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {/* Velocidad */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1 relative overflow-hidden">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" /> Velocidad
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.velocidad}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Mejor Tiempo</p>
                      </div>

                      {/* Salto */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                          Salto
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.salto}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Mejor Distancia</p>
                      </div>

                      {/* Lanzamiento */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                          Lanzamiento
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.lanzamiento}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Mejor Distancia</p>
                      </div>

                      {/* Resistencia */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                          Resistencia
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.resistencia}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Mejor Tiempo</p>
                      </div>

                      {/* Cuerda */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                          Cuerda
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.cuerda}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Resultado</p>
                      </div>

                      {/* Orden y Control */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                          Orden/Control
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.ordenYControl}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Evaluación</p>
                      </div>

                      {/* ABC */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <div className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider">
                          ABC
                        </div>
                        <p className="text-sm font-black text-white font-mono">{bestMarks.abc}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Evaluación</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Progression Charts Section */}
              <PerformanceCharts
                antropometricos={historial.antropometrico}
                atletismo={historial.atletismo}
              />

              {/* Detail Records Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Atletismo Records */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Pruebas de Atletismo</h3>
                  </div>
                  {historial.atletismo.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No hay registros de atletismo.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {historial.atletismo.map((r) => (
                        <div key={r.ID_Registro} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>{r.Prueba}</span>
                            <span className="text-emerald-400 font-mono text-sm">{r.Resultado_Principal}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Fecha: {r.Fecha}</span>
                            <span className="font-mono text-slate-500">Puntos: {r.Puntos || 90}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Antropométrico Records */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <HeartPulse className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Historial de IMC y Peso</h3>
                  </div>
                  {historial.antropometrico.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No hay registros antropométricos.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {historial.antropometrico.map((r) => (
                        <div key={r.ID_Registro} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>IMC: {r.IMC}</span>
                            <span className="text-cyan-400 font-mono">{r.Peso_kg} kg | {r.Estatura_cm} cm</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Fecha: {r.Fecha}</span>
                            <span>Edad: {r.Edad} años</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qualitative Records */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">Evaluaciones Cualitativas</h3>
                  </div>
                  {historial.cualitativo.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No hay evaluaciones cualitativas.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {historial.cualitativo.map((r) => (
                        <div key={r.ID_Registro} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>{r.Deporte_o_Prueba}</span>
                            <span className="text-purple-400 font-bold">{r.Calificacion}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">Fecha: {r.Fecha}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
