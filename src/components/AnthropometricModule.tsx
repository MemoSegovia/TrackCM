'use client';

import React, { useState } from 'react';
import { Scale, HeartPulse, Send, CheckCircle, Info } from 'lucide-react';
import { calculateIMC } from '@/lib/utils';
import { AlumnoInscrito, UserSession } from '@/lib/types';

interface AnthropometricModuleProps {
  selectedStudent: AlumnoInscrito | null;
  cicloEscolar: string;
  user: UserSession | null;
  onRecordSaved?: () => void;
}

export default function AnthropometricModule({
  selectedStudent,
  cicloEscolar,
  user,
  onRecordSaved,
}: AnthropometricModuleProps) {
  const [edad, setEdad] = useState<string>('12');
  const [peso, setPeso] = useState<string>('');
  const [estatura, setEstatura] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const pesoNum = parseFloat(peso) || 0;
  const estaturaNum = parseFloat(estatura) || 0;
  const imcInfo = calculateIMC(pesoNum, estaturaNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedStudent) {
      setErrorMsg('Seleccione un alumno primero');
      return;
    }

    if (pesoNum <= 0 || estaturaNum <= 0) {
      setErrorMsg('Ingrese peso y estatura válidos');
      return;
    }

    try {
      setIsSubmitting(true);
      const body = {
        idAlumno: selectedStudent.ID_Alumno,
        cicloEscolar,
        idMaestro: user?.id || 'USR-MAESTRO',
        edad,
        pesoKg: pesoNum,
        estaturaCm: estaturaNum,
      };

      const res = await fetch('/api/registros/antropometrico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Ficha registrada. IMC: ${imcInfo.imc} (${imcInfo.categoria})`);
        setPeso('');
        setEstatura('');
        if (onRecordSaved) onRecordSaved();
      } else {
        setErrorMsg(data.error || 'Error al guardar registro antropométrico');
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
          <HeartPulse className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-extrabold text-white">Ficha Antropométrica (IMC)</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          En Tiempo Real
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Edad */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Edad (Años)</label>
            <input
              type="number"
              placeholder="12"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="w-full bg-slate-800 text-white font-medium text-base rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Peso */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej. 45.5"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full bg-slate-800 text-white font-medium text-base rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Estatura */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Estatura (cm)</label>
            <input
              type="number"
              step="1"
              placeholder="Ej. 155"
              value={estatura}
              onChange={(e) => setEstatura(e.target.value)}
              className="w-full bg-slate-800 text-white font-medium text-base rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Real-time Calculated IMC Card */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">IMC Calculado</p>
              <p className="text-2xl font-black text-white font-mono">
                {imcInfo.imc > 0 ? imcInfo.imc : '--.--'}
              </p>
            </div>
          </div>

          {imcInfo.imc > 0 ? (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${imcInfo.badgeClass}`}>
              {imcInfo.categoria}
            </span>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Ingrese datos
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={imcInfo.imc <= 0 || isSubmitting}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Ficha Antropométrica'}
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
