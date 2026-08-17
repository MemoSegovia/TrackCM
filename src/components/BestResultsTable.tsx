'use client';

import React, { useState, useEffect } from 'react';
import { PESTANIAS_GRUPOS_OFICIALES, getNivelByGrupo, isStudentInGrupo, StudentBestMarksRow } from '@/lib/mejoresResultados';
import { AlumnoInscrito, UserSession } from '@/lib/types';
import { Table, RefreshCw, FileText, CheckCircle, Search, Layers, Download, FileSpreadsheet } from 'lucide-react';
import { exportElementToPdf } from '@/lib/exportPdf';

interface BestResultsTableProps {
  user: UserSession | null;
  cicloEscolar?: string;
}

export default function BestResultsTable({ user, cicloEscolar = '2026-2027' }: BestResultsTableProps) {
  const [selectedGrupo, setSelectedGrupo] = useState<string>('1A');
  const [nivel, setNivel] = useState<string>('Primaria Menor');
  const [rows, setRows] = useState<StudentBestMarksRow[]>([]);
  const [allStudents, setAllStudents] = useState<AlumnoInscrito[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rolLower = user?.rol?.toLowerCase() || '';
  const isAdmin = rolLower === 'administrador' || rolLower === 'admin';

  // Load all students to detect which groups have enrolled students
  useEffect(() => {
    async function loadAllStudents() {
      try {
        const res = await fetch('/api/estudiantes');
        const data = await res.json();
        if (data.success && data.alumnos) {
          setAllStudents(data.alumnos || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllStudents();
  }, []);

  // Helper to count enrolled students per group tab
  const getTabStudentCount = (tabName: string) => {
    return allStudents.filter((st) => isStudentInGrupo(st, tabName)).length;
  };

  // Auto-switch to first group tab with enrolled students if current selected tab is empty
  useEffect(() => {
    if (allStudents.length > 0) {
      const countInCurrent = getTabStudentCount(selectedGrupo);
      if (countInCurrent === 0) {
        const tabWithStudents = PESTANIAS_GRUPOS_OFICIALES.find((g) => getTabStudentCount(g) > 0);
        if (tabWithStudents) {
          setSelectedGrupo(tabWithStudents);
        }
      }
    }
  }, [allStudents]);

  useEffect(() => {
    setNivel(getNivelByGrupo(selectedGrupo));
    fetchBestResults(selectedGrupo);
  }, [selectedGrupo]);

  const fetchBestResults = async (grupo: string) => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch(`/api/mejores-resultados?grupo=${grupo}&ciclo=${cicloEscolar}`);
      const data = await res.json();
      if (data.success && data.rows) {
        setRows(data.rows);
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error al cargar los datos del grupo' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToSheets = async () => {
    try {
      setSyncing(true);
      setMsg(null);
      const res = await fetch('/api/mejores-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo: selectedGrupo,
          cicloEscolar,
          nombreMaestro: user?.nombre || 'Prof. Educación Física',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: `¡Pestaña "${selectedGrupo}" sincronizada exitosamente en Google Sheets!`,
        });
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al sincronizar con Google Sheets' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error de red al conectar con Google Sheets' });
    } finally {
      setSyncing(false);
    }
  };

  const exportToPdf = async () => {
    await exportElementToPdf(
      'printable-mejores-resultados',
      `Mejores_Resultados_Grupo_${selectedGrupo}.pdf`,
      `Mejores Resultados — Grupo ${selectedGrupo}`
    );
  };

  const filteredRows = rows.filter(
    (r) =>
      r.nombreAlumno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.idAlumno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="printable-mejores-resultados" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Tabla de Mejores Resultados Consolidados</h3>
            <p className="text-xs text-slate-400">
              Visualización y sincronización por pestaña de grupo (K1 a 12D)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSyncToSheets}
            disabled={syncing}
            className="flex-1 sm:flex-none py-3 px-5 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar a Google Sheets'}
          </button>

          <button
            onClick={exportToPdf}
            className="py-3 px-4 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Download className="w-4 h-4 text-cyan-400" /> Exportar PDF
          </button>

          {isAdmin && (
            <a
              href="/Pasos_Inicio_Ciclo_Escolar_TrackCM.xlsx"
              download
              className="py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 shadow-md active:scale-95"
              title="Descargar guía de pasos en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Guía Excel Ciclos
            </a>
          )}
        </div>
      </div>

      {/* Group Tabs Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" /> Pestaña de Grupo ({PESTANIAS_GRUPOS_OFICIALES.length} pestañas):
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
          {PESTANIAS_GRUPOS_OFICIALES.map((g) => {
            const count = getTabStudentCount(g);
            const isSelected = selectedGrupo === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGrupo(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                    : count > 0
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{g}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Info Block */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block font-semibold">Profesor:</span>
          <span className="font-extrabold text-white">{user?.nombre || 'Profesor de Ed. Física'}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold">Ciclo Escolar:</span>
          <span className="font-extrabold text-emerald-400 font-mono">{cicloEscolar}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold">Materia:</span>
          <span className="font-extrabold text-white">Educación Física</span>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold">Nivel Escolar / Grupo:</span>
          <span className="font-extrabold text-amber-400">
            {nivel} • Pestaña "{selectedGrupo}"
          </span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar alumno en la pestaña..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Total de Alumnos en {selectedGrupo}: <span className="text-emerald-400 font-black">{filteredRows.length}</span>
        </span>
      </div>

      {/* Notification Message */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {msg.text}
        </div>
      )}

      {/* Matrix Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Cargando mejores resultados del grupo {selectedGrupo}...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-500">
            No hay alumnos o registros guardados aún para la pestaña "{selectedGrupo}".
          </div>
        ) : (
          <table className="w-full text-left text-xs font-medium text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] tracking-wider font-extrabold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ID_Alumno</th>
                <th className="py-3.5 px-4">Nombre del alumno</th>
                <th className="py-3.5 px-4 text-center">M / F</th>
                <th className="py-3.5 px-4 text-emerald-400">Velocidad</th>
                <th className="py-3.5 px-4 text-amber-400">Salto</th>
                <th className="py-3.5 px-4 text-amber-400">Lanzamiento</th>
                <th className="py-3.5 px-4 text-cyan-400">Resistencia</th>
                <th className="py-3.5 px-4 text-purple-400">Cuerda</th>
                <th className="py-3.5 px-4 text-indigo-400">Orden y Control</th>
                <th className="py-3.5 px-4 text-pink-400">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredRows.map((r) => (
                <tr key={r.idAlumno} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-400">{r.idAlumno}</td>
                  <td className="py-3 px-4 font-sans font-extrabold text-white">{r.nombreAlumno}</td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        r.generoMF === 'F'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {r.generoMF}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{r.velocidad}</td>
                  <td className="py-3 px-4 font-bold text-amber-300">{r.salto}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">{r.lanzamiento}</td>
                  <td className="py-3 px-4 font-bold text-cyan-300">{r.resistencia}</td>
                  <td className="py-3 px-4 font-bold text-purple-300">{r.cuerda}</td>
                  <td className="py-3 px-4 font-bold text-indigo-300">{r.ordenYControl}</td>
                  <td className="py-3 px-4 font-bold text-pink-300">{r.abc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
