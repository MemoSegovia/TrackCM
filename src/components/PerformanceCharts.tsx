'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { RegistroAntropometrico, RegistroAtletismo } from '@/lib/types';
import { TrendingUp, Activity } from 'lucide-react';

interface PerformanceChartsProps {
  antropometricos: RegistroAntropometrico[];
  atletismo: RegistroAtletismo[];
}

export default function PerformanceCharts({ antropometricos, atletismo }: PerformanceChartsProps) {
  // Sort antropometric data by date
  const sortedAntro = [...antropometricos].sort(
    (a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
  );

  const antroData = sortedAntro.map((item) => ({
    fecha: item.Fecha,
    imc: item.IMC,
    peso: item.Peso_kg,
    estatura: item.Estatura_cm,
  }));

  // Group atletismo data by date
  const sortedAtl = [...atletismo].sort(
    (a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
  );

  const atlData = sortedAtl.map((item) => ({
    fecha: item.Fecha,
    prueba: item.Prueba,
    resultado: item.Resultado_Principal,
    puntos: item.Puntos || 90,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* IMC & Peso Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Evolución de IMC y Peso</h3>
        </div>

        {antroData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-semibold">
            No hay suficientes registros antropométricos aún
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={antroData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="imc"
                  name="IMC"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  name="Peso (kg)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Athletic Performance Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Rendimiento en Puntos Atletismo</h3>
        </div>

        {atlData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-semibold">
            No hay marcas de atletismo registradas aún
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="puntos" name="Puntos" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
