'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Send, Timer, CheckCircle, Users, UserPlus, Zap, Trash2 } from 'lucide-react';
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
      setErrorMsg('Por favor seleccione un alumno en la parte superior primero');
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
        nombreAlumno: selectedStudent.Nombre_Completo,
        cicloEscolar,
        idMaestro: user?.id || 'USR-MAESTRO',
        nombreMaestro: user?.nombre || 'Profesor',
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
        setSuccessMsg(`¡Marca guardada exitosamente en la base de datos! (${formattedTotal})`);
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

    if (selectedRunners.length >= 8) {
      setErrorMsg('Máximo 8 competidores por carrera');
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
      setErrorMsg('No hay tiempos de llegada registrados aún para guardar');
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
          nombreAlumno: r.student.Nombre_Completo,
          cicloEscolar,
          idMaestro: user?.id || 'USR-MAESTRO',
          nombreMaestro: user?.nombre || 'Profesor',
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

      setSuccessMsg(`¡Se guardaron ${savedCount} marcas de carrera individualmente en Google Sheets!`);
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-wide">Cronómetro de Atletismo</h3>
            <p className="text-xs text-slate-400">Modo Individual y Carrera de Velocidad Multi-Alumno</p>
          </div>
        </div>

        {/* Mode Toggle Switch (LARGE TOUCH TARGETS) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setMode('individual')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              mode === 'individual'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modo Individual
          </button>
          <button
            onClick={() => setMode('multi')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              mode === 'multi'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Multi-Alumno (Carrera)
          </button>
        </div>
      </div>

      {/* Select Prueba */}
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          Prueba Atletismo / Cancha
        </label>
        <select
          value={prueba}
          onChange={(e) => setPrueba(e.target.value)}
          className="w-full bg-slate-950 text-white font-bold text-base rounded-2xl px-4 py-3 border-2 border-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
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
          <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-3 right-5 text-xs font-mono tracking-widest text-slate-500 font-bold uppercase">
              {isRunning ? '⏱ CARRERA EN CURSO' : elapsedTime > 0 ? '⏸ EN PAUSA' : 'READY / LISTO'}
            </div>

            <div className="font-mono text-6xl sm:text-7xl font-black text-emerald-400 tracking-tight my-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              {formatStopwatchTime(elapsedTime)}
            </div>

            {selectedStudent ? (
              <p className="text-sm font-medium text-slate-300">
                Atleta Seleccionado: <span className="text-emerald-400 font-extrabold">{selectedStudent.Nombre_Completo}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-400 font-semibold animate-pulse">
                ⚠️ Seleccione un alumno en el menú superior para asociar el tiempo
              </p>
            )}
          </div>

          {/* Individual Controls (EXTRA LARGE TOUCH BUTTONS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={handleStartPause}
              className={`flex items-center justify-center gap-3 min-h-[60px] py-4 px-6 rounded-2xl font-black text-base transition-all shadow-xl active:scale-95 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-6 h-6 fill-slate-950" /> PAUSAR
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-slate-950" /> INICIAR
                </>
              )}
            </button>

            <button
              onClick={handleLap}
              disabled={!isRunning || elapsedTime === 0}
              className="flex items-center justify-center gap-2 min-h-[60px] py-4 px-6 rounded-2xl font-black text-base bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-700 shadow-lg active:scale-95"
            >
              <Flag className="w-5 h-5 text-cyan-400" /> VUELTA / LAP
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 min-h-[60px] py-4 px-6 rounded-2xl font-black text-base bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 shadow-lg active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> REINICIAR
            </button>

            <button
              onClick={handleSaveResult}
              disabled={elapsedTime === 0 || isSubmitting}
              className="flex items-center justify-center gap-2 min-h-[60px] py-4 px-6 rounded-2xl font-black text-base bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR MARCA'}
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vueltas Registradas ({laps.length})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {laps.map((lapMs, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-2 px-3 bg-slate-900 rounded-xl border border-slate-800 font-mono"
                  >
                    <span className="text-slate-400">Vuelta #{laps.length - idx}</span>
                    <span className="text-emerald-400 font-extrabold">{formatStopwatchTime(lapMs)} s</span>
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
        <div className="space-y-6">
          {/* Runner Selection Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <label className="block text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" /> Agregar Competidores a la Carrera (Carriles)
            </label>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddRunner(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-slate-900 text-slate-100 font-semibold text-sm rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              <option value="">-- Seleccionar Alumno para Agregar a un Carril --</option>
              {availableStudents.map((st) => (
                <option key={st.ID_Alumno} value={st.ID_Alumno}>
                  {st.Nombre_Completo} ({st.Nivel} {st.Grado}° "{st.Grupo}")
                </option>
              ))}
            </select>
          </div>

          {/* Master Race Timer Header & Large Trigger Button */}
          <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Reloj Maestro de Carrera
              </p>
              <p className="text-5xl sm:text-6xl font-black text-emerald-400 font-mono tracking-tight my-1">
                {formatStopwatchTime(multiElapsedTime)} s
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleStartMultiRace}
                disabled={isMultiRunning || selectedRunners.length === 0}
                className="flex-1 sm:flex-none min-h-[60px] px-8 py-4 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-6 h-6 fill-slate-950" /> DISPARO / INICIAR
              </button>

              <button
                onClick={handleResetMultiRace}
                className="min-h-[60px] px-5 py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md active:scale-95"
                title="Reiniciar Carrera"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lanes / Runners Cards (WITH PROMINENT EXTRA LARGE FINISH BUTTONS) */}
          {selectedRunners.length === 0 ? (
            <div className="py-10 text-center text-sm font-medium text-slate-400 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              No hay corredores agregados aún. Seleccione alumnos arriba para asignarlos a carriles de carrera.
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                Corredores en Pista ({selectedRunners.length})
              </h4>

              {selectedRunners.map((runner) => (
                <div
                  key={runner.student.ID_Alumno}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/40 shadow-inner">
                      C{runner.lane}
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-white">{runner.student.Nombre_Completo}</p>
                      <p className="text-xs text-slate-400">
                        {runner.student.Nivel} • {runner.student.Grado}° "{runner.student.Grupo}" | ID: {runner.student.ID_Alumno}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    {runner.finished ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border-2 border-emerald-500/40 px-5 py-2.5 rounded-2xl">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="font-mono font-black text-lg text-emerald-400">
                          {formatStopwatchTime(runner.finishTimeMs!)} s
                        </span>
                      </div>
                    ) : (
                      /* EXTRA LARGE FINISH BUTTON */
                      <button
                        onClick={() => handleFinishRunner(runner.student.ID_Alumno)}
                        disabled={!isMultiRunning}
                        className="flex-1 sm:flex-none min-h-[52px] px-6 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 disabled:opacity-30 shadow-lg shadow-amber-500/20 active:scale-95 transition-all border-2 border-amber-300"
                      >
                        🏁 LLEGÓ / META
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveRunner(runner.student.ID_Alumno)}
                      disabled={isMultiRunning}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors disabled:opacity-20"
                      title="Quitar de carrera"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save All Multi Results Button (PROMINENT LARGE BUTTON) */}
          <button
            onClick={handleSaveMultiResults}
            disabled={!selectedRunners.some((r) => r.finished) || isSubmitting}
            className="w-full min-h-[60px] py-4 rounded-2xl font-black text-base bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 shadow-2xl shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Send className="w-6 h-6" />
            {isSubmitting
              ? 'GUARDANDO MARCAS EN GOOGLE SHEETS...'
              : 'GUARDAR MARCAS DE TODOS LOS COMPETIDORES EN BASE DE DATOS'}
          </button>
        </div>
      )}

      {/* Notification Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-3 shadow-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl text-rose-400 text-sm font-bold shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
