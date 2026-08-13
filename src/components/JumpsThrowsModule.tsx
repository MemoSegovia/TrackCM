'use client';

import React, { useState } from 'react';
import { Trophy, Star, Send, CheckCircle, Target } from 'lucide-react';
import { AlumnoInscrito, UserSession } from '@/lib/types';

interface JumpsThrowsModuleProps {
  selectedStudent: AlumnoInscrito | null;
  cicloEscolar: string;
  user: UserSession | null;
  onRecordSaved?: () => void;
}

export default function JumpsThrowsModule({
  selectedStudent,
  cicloEscolar,
  user,
  onRecordSaved,
}: JumpsThrowsModuleProps) {
  const [prueba, setPrueba] = useState<string>('Salto de Longitud');
  const [attempt1, setAttempt1] = useState<string>('');
  const [attempt2, setAttempt2] = useState<string>('');
  const [attempt3, setAttempt3] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Calculate best mark automatically
  const num1 = parseFloat(attempt1) || 0;
  const num2 = parseFloat(attempt2) || 0;
  const num3 = parseFloat(attempt3) || 0;
  const bestValue = Math.max(num1, num2, num3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedStudent) {
      setErrorMsg('Seleccione un alumno primero');
      return;
    }

    if (bestValue <= 0) {
      setErrorMsg('Ingrese al menos una marca válida');
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedBest = `${bestValue.toFixed(2)} m`;
      const attemptsList = [
        attempt1 ? `${parseFloat(attempt1).toFixed(2)} m` : 'N/A',
        attempt2 ? `${parseFloat(attempt2).toFixed(2)} m` : 'N/A',
        attempt3 ? `${parseFloat(attempt3).toFixed(2)} m` : 'N/A',
      ];

      const body = {
        idAlumno: selectedStudent.ID_Alumno,
        cicloEscolar,
        idMaestro: user?.id || 'USR-MAESTRO',
        prueba,
        resultadoPrincipal: formattedBest,
        detalleJsonVueltas: {
          attempts: attemptsList,
          best: formattedBest,
        },
        puntos: 92,
      };

      const res = await fetch('/api/registros/atletismo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`¡Mejor marca registrada! (${formattedBest})`);
        setAttempt1('');
        setAttempt2('');
        setAttempt3('');
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-extrabold text-white">Módulo de Saltos y Lanzamientos</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          3 Intentos
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Event */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Prueba o Disciplina</label>
          <select
            value={prueba}
            onChange={(e) => setPrueba(e.target.value)}
            className="w-full bg-slate-800 text-white font-medium text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="Salto de Longitud">Salto de Longitud</option>
            <option value="Salto Alto">Salto Alto (Altura)</option>
            <option value="Lanzamiento de Bala">Lanzamiento de Bala</option>
            <option value="Lanzamiento de Disco">Lanzamiento de Disco</option>
            <option value="Lanzamiento de Jabalina">Lanzamiento de Jabalina</option>
          </select>
        </div>

        {/* 3 Attempt Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Intento 1 (m)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={attempt1}
              onChange={(e) => setAttempt1(e.target.value)}
              className="w-full bg-slate-950 text-white font-mono font-bold text-center text-lg rounded-xl py-2.5 border border-slate-700 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Intento 2 (m)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={attempt2}
              onChange={(e) => setAttempt2(e.target.value)}
              className="w-full bg-slate-950 text-white font-mono font-bold text-center text-lg rounded-xl py-2.5 border border-slate-700 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Intento 3 (m)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={attempt3}
              onChange={(e) => setAttempt3(e.target.value)}
              className="w-full bg-slate-950 text-white font-mono font-bold text-center text-lg rounded-xl py-2.5 border border-slate-700 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Real-time Best Attempt Banner */}
        <div className="p-4 bg-slate-950 border-2 border-amber-500/30 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Mejor Marca Automática</p>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {bestValue > 0 ? `${bestValue.toFixed(2)} m` : '0.00 m'}
              </p>
            </div>
          </div>
          <Star className="w-6 h-6 text-amber-400 fill-amber-400/30 animate-pulse" />
        </div>

        <button
          type="submit"
          disabled={bestValue <= 0 || isSubmitting}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : 'Registrar Mejor Marca'}
        </button>
      </form>

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
