'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Send, Timer, CheckCircle, Flame } from 'lucide-react';
import { formatStopwatchTime } from '@/lib/utils';
import { AlumnoInscrito, UserSession } from '@/lib/types';

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
  const [prueba, setPrueba] = useState<string>('100m Velocidad');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
        setSuccessMsg(`¡Marca guardada exitosamente! (${formattedTotal})`);
        handleReset();
        if (onRecordSaved) onRecordSaved();
      } else {
        setErrorMsg(data.error || 'Error al guardar la marca');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al conectar con el servidor');
    } fontFinally: {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-extrabold text-white">Cronómetro de Atletismo</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" /> Precisión Cancha
        </span>
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

      {/* Stopwatch Display */}
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

      {/* Controls */}
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

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

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
    </div>
  );
}
