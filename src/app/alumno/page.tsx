'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PerformanceCharts from '@/components/PerformanceCharts';
import ExportPdfButton from '@/components/ExportPdfButton';
import { UserSession, AlumnoInscrito, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from '@/lib/types';
import { Search, Activity, Calendar, Trophy, HeartPulse, Award, UserCheck, Scale } from 'lucide-react';
import { calculateIMC } from '@/lib/utils';

export default function AlumnoPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [student, setStudent] = useState<AlumnoInscrito | null>(null);
  const [historial, setHistorial] = useState<{
    antropometrico: RegistroAntropometrico[];
    atletismo: RegistroAtletismo[];
    cualitativo: RegistroCualitativo[];
  }>({ antropometrico: [], atletismo: [], cualitativo: [] });

  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          const parsed: UserSession = JSON.parse(stored);
          setUser(parsed);
          // If student logged in, automatically search by their email
          if (parsed.correo) {
            setSearchQuery(parsed.correo);
            fetchHistorial(parsed.correo);
          }
        } catch (e) {
          console.error(e);
        }
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistorial(searchQuery);
  };

  const latestAntro = historial.antropometrico.length > 0 ? historial.antropometrico[0] : null;
  const latestImcInfo = latestAntro ? calculateIMC(latestAntro.Peso_kg, latestAntro.Estatura_cm) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Consulta de Historial del Estudiante
              </h1>
              <p className="text-xs text-slate-400">Ingresa tu ID de Alumno o Correo Institucional</p>
            </div>

            {/* Search Input Form & Export PDF */}
            <div className="flex flex-col sm:flex-row items-center gap-2 max-w-lg w-full">
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="ID (ej. ALU-2026-001) o Correo..."
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

          {/* Student Profile Header Banner */}
          {student && (
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
          )}
        </div>

        {/* Progression Charts Section */}
        {student && (
          <PerformanceCharts
            antropometricos={historial.antropometrico}
            atletismo={historial.atletismo}
          />
        )}

        {/* Detail Records Tables */}
        {student && (
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
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
