'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StudentSelector from '@/components/StudentSelector';
import StopwatchModule from '@/components/StopwatchModule';
import JumpsThrowsModule from '@/components/JumpsThrowsModule';
import AnthropometricModule from '@/components/AnthropometricModule';
import QualitativeModule from '@/components/QualitativeModule';
import { AlumnoInscrito, UserSession, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from '@/lib/types';
import { Timer, Target, HeartPulse, Award, Dumbbell, History, RefreshCw } from 'lucide-react';

export default function MaestroPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AlumnoInscrito | null>(null);
  const [cicloEscolar, setCicloEscolar] = useState<string>('2026-2027');
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'jumps' | 'antro' | 'qualitative'>('stopwatch');

  // Student history state for preview
  const [recentHistory, setRecentHistory] = useState<{
    antropometrico: RegistroAntropometrico[];
    atletismo: RegistroAtletismo[];
    cualitativo: RegistroCualitativo[];
  }>({ antropometrico: [], atletismo: [], cualitativo: [] });
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

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

  const loadStudentHistory = async (studentId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/historial?studentId=${studentId}`);
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

  const handleSelectStudent = (student: AlumnoInscrito | null, ciclo: string) => {
    setSelectedStudent(student);
    setCicloEscolar(ciclo);
    if (student) {
      loadStudentHistory(student.ID_Alumno);
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
              Profesor: <span className="text-emerald-400 font-bold">{user?.nombre || 'Prof. Carlos Mendoza'}</span> | Asignado: {user?.nivelAsignado || 'Todos'}
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Ciclo: {cicloEscolar}
          </div>
        </div>

        {/* Cascading Selectors */}
        <StudentSelector onSelectStudent={handleSelectStudent} user={user} />

        {/* Module Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
        </div>

        {/* Active Module Content */}
        <div>
          {activeTab === 'stopwatch' && (
            <StopwatchModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno)}
            />
          )}

          {activeTab === 'jumps' && (
            <JumpsThrowsModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno)}
            />
          )}

          {activeTab === 'antro' && (
            <AnthropometricModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno)}
            />
          )}

          {activeTab === 'qualitative' && (
            <QualitativeModule
              selectedStudent={selectedStudent}
              cicloEscolar={cicloEscolar}
              user={user}
              onRecordSaved={() => selectedStudent && loadStudentHistory(selectedStudent.ID_Alumno)}
            />
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
                onClick={() => loadStudentHistory(selectedStudent.ID_Alumno)}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Atletismo summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400">Atletismo & Marcas ({recentHistory.atletismo.length})</h4>
                {recentHistory.atletismo.length === 0 ? (
                  <p className="text-slate-500">Sin marcas registradas</p>
                ) : (
                  recentHistory.atletismo.slice(0, 3).map((r, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{r.Prueba}:</span>
                      <span className="font-mono font-bold text-white">{r.Resultado_Principal}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Antropométrico summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-400">Medidas & IMC ({recentHistory.antropometrico.length})</h4>
                {recentHistory.antropometrico.length === 0 ? (
                  <p className="text-slate-500">Sin fichas IMC registadas</p>
                ) : (
                  recentHistory.antropometrico.slice(0, 3).map((r, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{r.Fecha}:</span>
                      <span className="font-mono font-bold text-white">IMC: {r.IMC} ({r.Peso_kg} kg)</span>
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
                  recentHistory.cualitativo.slice(0, 3).map((r, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">{r.Deporte_o_Prueba}:</span>
                      <span className="font-bold text-white">{r.Calificacion}</span>
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
