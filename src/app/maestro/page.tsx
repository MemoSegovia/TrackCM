'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StudentSelector from '@/components/StudentSelector';
import StopwatchModule from '@/components/StopwatchModule';
import JumpsThrowsModule from '@/components/JumpsThrowsModule';
import AnthropometricModule from '@/components/AnthropometricModule';
import QualitativeModule from '@/components/QualitativeModule';
import BestResultsTable from '@/components/BestResultsTable';
import ExportPdfButton from '@/components/ExportPdfButton';
import { AlumnoInscrito, UserSession, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from '@/lib/types';
import { calculateBestMarksForStudent } from '@/lib/mejoresResultados';
import { Timer, Target, HeartPulse, Award, Dumbbell, History, RefreshCw, Table, Zap, Trash2, Loader2 } from 'lucide-react';

export default function MaestroPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AlumnoInscrito | null>(null);
  const [groupStudents, setGroupStudents] = useState<AlumnoInscrito[]>([]);
  const [cicloEscolar, setCicloEscolar] = useState<string>('2026-2027');
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'jumps' | 'antro' | 'qualitative' | 'best-results'>('stopwatch');

  // Student history state for preview
  const [recentHistory, setRecentHistory] = useState<{
    antropometrico: RegistroAntropometrico[];
    atletismo: RegistroAtletismo[];
    cualitativo: RegistroCualitativo[];
  }>({ antropometrico: [], atletismo: [], cualitativo: [] });
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const rolLower = parsed.rol?.toLowerCase() || '';
          if (rolLower !== 'maestro' && rolLower !== 'profesor') {
            router.push('/alumno');
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

  const loadStudentHistory = async (studentId: string, name?: string) => {
    try {
      setLoadingHistory(true);
      const nameParam = name ? `&name=${encodeURIComponent(name)}` : '';
      const res = await fetch(`/api/historial?studentId=${encodeURIComponent(studentId)}${nameParam}`);
      const data = await res.json();
      if (data.success && data.historial) {
        setRecentHistory(data.historial);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteAtletismoRecord = async (record: RegistroAtletismo) => {
    if (!selectedStudent) return;

    const targetKey = record.ID_Registro || `${record.Prueba}-${record.Fecha}`;
    const confirmText = `¿Estás seguro de borrar la prueba de "${record.Prueba}" (${record.Resultado_Principal}) realizada por ${selectedStudent.Nombre_Completo}? Esta marca se eliminará permanentemente de Registros_Atletismo.`;

    if (!window.confirm(confirmText)) return;

    try {
      setDeletingId(targetKey);
      setDeleteMsg(null);

      const params = new URLSearchParams({
        idRegistro: record.ID_Registro || '',
        idAlumno: record.ID_Alumno || selectedStudent.ID_Alumno,
        cicloEscolar: cicloEscolar,
        fecha: record.Fecha || '',
        prueba: record.Prueba || '',
        resultadoPrincipal: record.Resultado_Principal || '',
      });

      const res = await fetch(`/api/registros/atletismo?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setDeleteMsg({ text: 'Prueba eliminada exitosamente de Registros_Atletismo', type: 'success' });
        await loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo);
        setTimeout(() => setDeleteMsg(null), 4000);
      } else {
        setDeleteMsg({ text: data.error || 'Error al borrar la prueba', type: 'error' });
      }
    } catch (err) {
      console.error('Error al borrar la prueba:', err);
      setDeleteMsg({ text: 'Error de red o servidor al borrar la prueba', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectStudent = (
    student: AlumnoInscrito | null,
    ciclo: string,
    groupStudentsList?: AlumnoInscrito[]
  ) => {
    setSelectedStudent(student);
    setCicloEscolar(ciclo);
    if (groupStudentsList) {
      setGroupStudents(groupStudentsList);
    }
    if (student) {
      loadStudentHistory(student.ID_Alumno, student.Nombre_Completo);
    } else {
      setRecentHistory({ antropometrico: [], atletismo: [], cualitativo: [] });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white">Portal de Registro en Cancha</h1>
            </div>
            <p className="text-xs text-slate-400">
              Profesor: <span className="text-emerald-400 font-bold">{user?.nombre || 'Prof. Carlos Mendoza'}</span>
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Ciclo: {cicloEscolar}
          </div>
        </div>

        {/* Cascading Selectors */}
        <StudentSelector onSelectStudent={handleSelectStudent} user={user} />

        {/* Module Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'stopwatch'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Timer className="w-4 h-4" /> Cronómetro Velocidad
          </button>

          <button
            onClick={() => setActiveTab('jumps')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'jumps'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4" /> Saltos y Lanzamientos
          </button>

          <button
            onClick={() => setActiveTab('antro')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'antro'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="w-4 h-4" /> Ficha IMC / Antro
          </button>

          <button
            onClick={() => setActiveTab('qualitative')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'qualitative'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Evaluación Cualitativa
          </button>

          <button
            onClick={() => setActiveTab('best-results')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'best-results'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" /> Tabla Mejores Resultados
          </button>
        </div>

        {/* Active Module Content */}
        <div>
          {activeTab === 'stopwatch' && (
            <StopwatchModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              groupStudents={groupStudents}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo)}
            />
          )}

          {activeTab === 'jumps' && (
            <JumpsThrowsModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo)}
            />
          )}

          {activeTab === 'antro' && (
            <AnthropometricModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo)}
            />
          )}

          {activeTab === 'qualitative' && (
            <QualitativeModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo)}
            />
          )}

          {activeTab === 'best-results' && (
            <BestResultsTable user={user} cicloEscolar={cicloEscolar} />
          )}
        </div>

        {/* Selected Student Recent History Preview */}
        {selectedStudent && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Historial Reciente de {selectedStudent.Nombre_Completo}
                </h3>
              </div>
              <button
                onClick={() => loadStudentHistory(selectedStudent.ID_Alumno, selectedStudent.Nombre_Completo)}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>

            {/* Quick Pillars Summary (Velocidad, Salto, Lanzamiento, Resistencia) */}
            {(() => {
              const bestMarks = calculateBestMarksForStudent(selectedStudent, recentHistory.atletismo, recentHistory.cualitativo);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">🏃 Velocidad</span>
                    <span className="text-sm font-black text-white font-mono">{bestMarks.velocidad}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">🦘 Salto</span>
                    <span className="text-sm font-black text-white font-mono">{bestMarks.salto}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">🥎 Lanzamiento</span>
                    <span className="text-sm font-black text-white font-mono">{bestMarks.lanzamiento}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">⏱️ Resistencia</span>
                    <span className="text-sm font-black text-white font-mono">{bestMarks.resistencia}</span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Atletismo, Saltos & Lanzamientos summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400">Pruebas de Campo & Atletismo ({recentHistory.atletismo.length})</h4>
                </div>

                {deleteMsg && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-bold ${
                      deleteMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {deleteMsg.text}
                  </div>
                )}

                {recentHistory.atletismo.length === 0 ? (
                  <p className="text-slate-500">Sin marcas registradas</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {recentHistory.atletismo.map((r, idx) => {
                      const itemKey = r.ID_Registro || `${r.Prueba}-${r.Fecha}-${idx}`;
                      const isDeleting = deletingId === itemKey || deletingId === (r.ID_Registro || `${r.Prueba}-${r.Fecha}`);
                      return (
                        <div key={itemKey} className="flex justify-between items-center py-1.5 border-b border-slate-800/60 group">
                          <div>
                            <span className="text-slate-200 font-bold block">{r.Prueba}</span>
                            {r.Fecha && <span className="text-[10px] text-slate-500">{r.Fecha}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-400 text-sm">{r.Resultado_Principal}</span>
                            <button
                              onClick={() => handleDeleteAtletismoRecord(r)}
                              disabled={isDeleting}
                              title="Borrar esta prueba realizada"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Antropométrico summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-400">Medidas & IMC ({recentHistory.antropometrico.length})</h4>
                {recentHistory.antropometrico.length === 0 ? (
                  <p className="text-slate-500">Sin fichas IMC registradas</p>
                ) : (
                  recentHistory.antropometrico.slice(0, 6).map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                      <div>
                        <span className="text-slate-200 font-bold block">Ficha IMC</span>
                        {r.Fecha && <span className="text-[10px] text-slate-500">{r.Fecha}</span>}
                      </div>
                      <span className="font-mono font-black text-cyan-400 text-sm">IMC: {r.IMC} ({r.Peso_kg} kg)</span>
                    </div>
                  ))
                )}
              </div>

              {/* Cualitativo summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-purple-400">Evaluación Cualitativa ({recentHistory.cualitativo.length})</h4>
                {recentHistory.cualitativo.length === 0 ? (
                  <p className="text-slate-500">Sin evaluaciones registradas</p>
                ) : (
                  recentHistory.cualitativo.slice(0, 6).map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                      <div>
                        <span className="text-slate-200 font-bold block">{r.Deporte_o_Prueba}</span>
                        {r.Fecha && <span className="text-[10px] text-slate-500">{r.Fecha}</span>}
                      </div>
                      <span className="font-bold text-purple-300 text-sm">{r.Calificacion}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
