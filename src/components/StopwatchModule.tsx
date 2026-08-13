'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Send, Timer, CheckCircle, Flame, Users, UserPlus, Zap, Trophy } from 'lucide-react';
import { formatStopwatchTime } from '@/lib/utils';
import { AlumnoInscrito, UserSession, MultiStudentRunner } from '@/lib/types';

interface StopwatchModuleProps {
  selectedStudent: AlumnoInscrito | null;
  cicloEscolar: string;
  user: UserSession | null;
  onRecordSaved?: () => void;
}

export default function StopwatchModule({
  selectedStudent,
  cicloEscolar,
  user,
  onRecordSaved,
}: StopwatchModuleProps) {
  const [mode, setMode] = useState<'individual' | 'multi'>('individual');
  const [prueba, setPrueba] = useState<string>('100m Velocidad');

  // Single mode stopwatch state
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Multi-student race state
  const [availableStudents, setAvailableStudents] = useState<AlumnoInscrito[]>([]);
  const [selectedRunners, setSelectedRunners] = useState<MultiStudentRunner[]>([]);
  const [isMultiRunning, setIsMultiRunning] = useState<boolean>(false);
  const [multiElapsedTime, setMultiElapsedTime] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const multiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const multiStartTimeRef = useRef<number>(0);

  // Single mode timer effect
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Multi mode timer effect
  useEffect(() => {
    if (isMultiRunning) {
      multiStartTimeRef.current = Date.now() - multiElapsedTime;
      multiTimerRef.current = setInterval(() => {
        setMultiElapsedTime(Date.now() - multiStartTimeRef.current);
      }, 10);
    } else if (multiTimerRef.current) {
      clearInterval(multiTimerRef.current);
    }
    return () => {
      if (multiTimerRef.current) clearInterval(multiTimerRef.current);
    };
  }, [isMultiRunning]);

  // Fetch group students list for multi-runner selection
  useEffect(() => {
    async function loadGroupStudents() {
      try {
        const res = await fetch('/api/estudiantes');
        const data = await res.json();
        if (data.success && data.alumnos) {
          setAvailableStudents(data.alumnos);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadGroupStudents();
  }, []);

  // Single Mode Handlers
  const handleStartPause = () => {
    setIsRunning(!isRunning);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleLap = () => {
    if (elapsedTime > 0) {
      setLaps((prev) => [elapsedTime, ...prev]);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSaveResult = async () => {
    if (!selectedStudent) {
      setErrorMsg('Por favor seleccione un alumno primero');
      return;
    }

    if (elapsedTime === 0) {
      setErrorMsg('El cronómetro está en cero. Registre un tiempo antes de guardar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const formattedTotal = formatStopwatchTime(elapsedTime) + ' s';
      const formattedLaps = laps.map((l) => formatStopwatchTime(l) + ' s');

      const body = {
        idAlumno: selectedStudent.ID_Alumno,
        cicloEscolar,
        idMaestro: user?.id || 'USR-MAESTRO',
        prueba,
        resultadoPrincipal: formattedTotal,
        detalleJsonVueltas: {
          tiempoTotalMs: elapsedTime,
          laps: formattedLaps.length > 0 ? formattedLaps : [formattedTotal],
        },
        puntos: 95,
      };

      const res = await fetch('/api/registros/atletismo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`¡Marca guardada! (${formattedTotal})`);
        handleReset();
        if (onRecordSaved) onRecordSaved();
      } else {
        setErrorMsg(data.error || 'Error al guardar la marca');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-Runner Mode Handlers
  const handleAddRunner = (studentId: string) => {
    const studentObj = availableStudents.find((s) => s.ID_Alumno === studentId);
    if (!studentObj) return;

    if (selectedRunners.some((r) => r.student.ID_Alumno === studentId)) {
      return;
    }

    if (selectedRunners.length >= 6) {
      setErrorMsg('Máximo 6 competidores por carrera');
      return;
    }

    setSelectedRunners((prev) => [
      ...prev,
      {
        student: studentObj,
        lane: prev.length + 1,
        finished: false,
      },
    ]);
  };

  const handleRemoveRunner = (studentId: string) => {
    setSelectedRunners((prev) =>
      prev
        .filter((r) => r.student.ID_Alumno !== studentId)
        .map((r, idx) => ({ ...r, lane: idx + 1 }))
    );
  };

  const handleStartMultiRace = () => {
    if (selectedRunners.length === 0) {
      setErrorMsg('Agregue al menos 1 corredor para iniciar la carrera');
      return;
    }
    setMultiElapsedTime(0);
    setSelectedRunners((prev) => prev.map((r) => ({ ...r, finished: false, finishTimeMs: undefined })));
    setIsMultiRunning(true);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleFinishRunner = (studentId: string) => {
    if (!isMultiRunning) return;
    const currentMs = multiElapsedTime;

    setSelectedRunners((prev) =>
      prev.map((r) =>
        r.student.ID_Alumno === studentId
          ? { ...r, finished: true, finishTimeMs: currentMs }
          : r
      )
    );
  };

  const handleResetMultiRace = () => {
    setIsMultiRunning(false);
    setMultiElapsedTime(0);
    setSelectedRunners((prev) => prev.map((r) => ({ ...r, finished: false, finishTimeMs: undefined })));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSaveMultiResults = async () => {
    const finishedRunners = selectedRunners.filter((r) => r.finished && r.finishTimeMs);
    if (finishedRunners.length === 0) {
      setErrorMsg('No hay tiempos de llegada registrados aún');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      let savedCount = 0;
      for (const r of finishedRunners) {
        const formattedTotal = formatStopwatchTime(r.finishTimeMs!) + ' s';
        const body = {
          idAlumno: r.student.ID_Alumno,
          cicloEscolar,
          idMaestro: user?.id || 'USR-MAESTRO',
          prueba,
          resultadoPrincipal: formattedTotal,
          detalleJsonVueltas: {
            carreraMultiAlumno: true,
            carril: r.lane,
            tiempoTotalMs: r.finishTimeMs,
          },
          puntos: 95,
        };

        const res = await fetch('/api/registros/atletismo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) savedCount++;
      }

      setSuccessMsg(`¡Se guardaron ${savedCount} marcas de carrera en Google Sheets!`);
      handleResetMultiRace();
      if (onRecordSaved) onRecordSaved();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar marcas múltiples');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-extrabold text-white">Cronómetro de Atletismo</h3>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('individual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'individual'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modo Individual
          </button>
          <button
            onClick={() => setMode('multi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'multi'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Multi-Alumno (Carrera)
          </button>
        </div>
      </div>

      {/* Select Prueba */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Prueba Deportiva</label>
        <select
          value={prueba}
          onChange={(e) => setPrueba(e.target.value)}
          className="w-full bg-slate-800 text-white font-medium text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="100m Velocidad">100m Velocidad</option>
          <option value="200m Velocidad">200m Velocidad</option>
          <option value="400m Planos">400m Planos</option>
          <option value="800m Medio Fondo">800m Medio Fondo</option>
          <option value="1500m Fondo">1500m Fondo</option>
          <option value="Prueba de Vueltas Cancha">Prueba de Vueltas Cancha</option>
        </select>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: INDIVIDUAL STOPWATCH                              */}
      {/* ======================================================== */}
      {mode === 'individual' && (
        <>
          <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              {isRunning ? 'RUNNING' : elapsedTime > 0 ? 'PAUSED' : 'READY'}
            </div>

            <div className="font-mono text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight my-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {formatStopwatchTime(elapsedTime)}
            </div>

            {selectedStudent && (
              <p className="text-xs font-medium text-slate-400 mt-1">
                Atleta: <span className="text-white font-bold">{selectedStudent.Nombre_Completo}</span>
              </p>
            )}
          </div>

          {/* Individual Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleStartPause}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" /> Iniciar
                </>
              )}
            </button>

            <button
              onClick={handleLap}
              disabled={!isRunning || elapsedTime === 0}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-700"
            >
              <Flag className="w-4 h-4 text-cyan-400" /> Vuelta / Lap
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </button>

            <button
              onClick={handleSaveResult}
              disabled={elapsedTime === 0 || isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vueltas Registradas ({laps.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {laps.map((lapMs, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-900/80 rounded-lg border border-slate-800 font-mono"
                  >
                    <span className="text-slate-400">Vuelta #{laps.length - idx}</span>
                    <span className="text-emerald-400 font-bold">{formatStopwatchTime(lapMs)} s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODE 2: MULTI-STUDENT RACE SIMULTANEOUS TIMING            */}
      {/* ======================================================== */}
      {mode === 'multi' && (
        <div className="space-y-4">
          {/* Runner Selection Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Agregar Competidores a la Carrera (Carriles 1 a 6)
            </label>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddRunner(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-slate-900 text-slate-100 text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Seleccionar Alumno para Agregar a la Carrera --</option>
              {availableStudents.map((st) => (
                <option key={st.ID_Alumno} value={st.ID_Alumno}>
                  {st.Nombre_Completo} ({st.Nivel} {st.Grado}° "{st.Grupo}")
                </option>
              ))}
            </select>
          </div>

          {/* Master Race Timer Header */}
          <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tiempo Global de Carrera
              </p>
              <p className="text-4xl font-black text-emerald-400 font-mono">
                {formatStopwatchTime(multiElapsedTime)} s
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleStartMultiRace}
                disabled={isMultiRunning || selectedRunners.length === 0}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" /> DISPARO / INICIAR
              </button>

              <button
                onClick={handleResetMultiRace}
                className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lanes / Runners List */}
          {selectedRunners.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No se han agregado corredores a la carrera. Seleccione alumnos arriba.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedRunners.map((runner) => (
                <div
                  key={runner.student.ID_Alumno}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                      C{runner.lane}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{runner.student.Nombre_Completo}</p>
                      <p className="text-[10px] text-slate-400">
                        {runner.student.Nivel} {runner.student.Grado}° "{runner.student.Grupo}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {runner.finished ? (
                      <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        {formatStopwatchTime(runner.finishTimeMs!)} s
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFinishRunner(runner.student.ID_Alumno)}
                        disabled={!isMultiRunning}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-40 shadow transition-all"
                      >
                        🏁 LLEGÓ
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveRunner(runner.student.ID_Alumno)}
                      disabled={isMultiRunning}
                      className="text-slate-500 hover:text-rose-400 text-xs px-2"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save All Multi Results Button */}
          <button
            onClick={handleSaveMultiResults}
            disabled={!selectedRunners.some((r) => r.finished) || isSubmitting}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Guardando Marcas...' : 'Guardar Marcas de Todos los Competidores'}
          </button>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
