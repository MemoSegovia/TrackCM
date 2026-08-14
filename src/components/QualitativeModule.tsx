'use client';

import React, { useState } from 'react';
import { Award, Star, Send, CheckCircle } from 'lucide-react';
import { AlumnoInscrito, UserSession } from '@/lib/types';

interface QualitativeModuleProps {
  selectedStudent: AlumnoInscrito | null;
  cicloEscolar: string;
  user: UserSession | null;
  onRecordSaved?: () => void;
}

export default function QualitativeModule({
  selectedStudent,
  cicloEscolar,
  user,
  onRecordSaved,
}: QualitativeModuleProps) {
  const [deporte, setDeporte] = useState<string>('Básquetbol');
  const [calificacion, setCalificacion] = useState<string>('Excelente');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedStudent) {
      setErrorMsg('Seleccione un alumno primero');
      return;
    }

    try {
      setIsSubmitting(true);
      const body = {
        idAlumno: selectedStudent.ID_Alumno,
        cicloEscolar,
        idMaestro: user?.id || 'USR-MAESTRO',
        deporteOPrueba: deporte,
        calificacion,
      };

      const res = await fetch('/api/registros/cualitativo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Evaluación registrada: ${deporte} (${calificacion})`);
        if (onRecordSaved) onRecordSaved();
      } else {
        setErrorMsg(data.error || 'Error al guardar evaluación cualitativa');
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
          <Award className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-extrabold text-white">Evaluación Cualitativa</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Deportes y Desempeño
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Deporte o Actividad</label>
          <select
            value={deporte}
            onChange={(e) => setDeporte(e.target.value)}
            className="w-full bg-slate-800 text-white font-medium text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="Básquetbol">Básquetbol</option>
            <option value="Fútbol">Fútbol</option>
            <option value="Voleibol">Voleibol</option>
            <option value="Gimnasia y Coordinación">Gimnasia y Coordinación</option>
            <option value="Trabajo en Equipo y Actitud">Trabajo en Equipo y Actitud</option>
            <option value="Resistencia Física General">Resistencia Física General</option>
            <option value="Salto de Cuerda">Salto de Cuerda (Cuerda)</option>
            <option value="Orden y Control">Orden y Control</option>
            <option value="ABC Atletismo">ABC Atletismo (ABC)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Calificación / Nivel</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['Excelente', 'Muy Bueno', 'En Proceso', 'Necesita Apoyo'].map((calif) => (
              <button
                key={calif}
                type="button"
                onClick={() => setCalificacion(calif)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  calificacion === calif
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                {calif}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Evaluación Cualitativa'}
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
