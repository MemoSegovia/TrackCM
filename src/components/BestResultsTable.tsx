'use client';

import React, { useState, useEffect } from 'react';
import { PESTANIAS_GRUPOS_OFICIALES, getNivelByGrupo, isStudentInGrupo, StudentBestMarksRow } from '@/lib/mejoresResultados';
import { AlumnoInscrito, UserSession } from '@/lib/types';
import { Table, RefreshCw, FileText, CheckCircle, Search, Layers, Download, FileSpreadsheet, Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react';
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

  // Edit / Delete states
  const [editingRow, setEditingRow] = useState<StudentBestMarksRow | null>(null);
  const [editForm, setEditForm] = useState<{
    velocidad: string;
    salto: string;
    lanzamiento: string;
    resistencia: string;
    cuerda: string;
    ordenYControl: string;
    abc: string;
  }>({
    velocidad: '',
    salto: '',
    lanzamiento: '',
    resistencia: '',
    cuerda: '',
    ordenYControl: '',
    abc: '',
  });

  const [deletingRow, setDeletingRow] = useState<StudentBestMarksRow | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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

  const handleSyncAllToSheets = async () => {
    try {
      setSyncing(true);
      setMsg(null);
      const res = await fetch('/api/mejores-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncAll: true,
          cicloEscolar,
          nombreMaestro: user?.nombre || 'Prof. Educación Física',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: data.message || '¡Se crearon y actualizaron exitosamente todas las pestañas de grupo en Google Sheets!',
        });
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al sincronizar las pestañas en Google Sheets' });
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

  const handleOpenEdit = (row: StudentBestMarksRow) => {
    setEditingRow(row);
    setEditForm({
      velocidad: row.velocidad === '-' ? '' : row.velocidad,
      salto: row.salto === '-' ? '' : row.salto,
      lanzamiento: row.lanzamiento === '-' ? '' : row.lanzamiento,
      resistencia: row.resistencia === '-' ? '' : row.resistencia,
      cuerda: row.cuerda === '-' ? '' : row.cuerda,
      ordenYControl: row.ordenYControl === '-' ? '' : row.ordenYControl,
      abc: row.abc === '-' ? '' : row.abc,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    try {
      setActionLoading(true);
      setMsg(null);
      const res = await fetch('/api/mejores-resultados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAlumno: editingRow.idAlumno,
          nombreAlumno: editingRow.nombreAlumno,
          grupo: selectedGrupo,
          cicloEscolar,
          nombreMaestro: user?.nombre || 'Prof. Educación Física',
          marks: editForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: data.message });
        if (data.rows) setRows(data.rows);
        setEditingRow(null);
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al guardar la edición' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error de red al actualizar los resultados' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRow) return;
    try {
      setActionLoading(true);
      setMsg(null);
      const res = await fetch('/api/mejores-resultados', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAlumno: deletingRow.idAlumno,
          nombreAlumno: deletingRow.nombreAlumno,
          grupo: selectedGrupo,
          cicloEscolar,
          nombreMaestro: user?.nombre || 'Prof. Educación Física',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: data.message });
        if (data.rows) setRows(data.rows);
        setDeletingRow(null);
      } else {
        setMsg({ type: 'error', text: data.error || 'Error al eliminar los resultados' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error de red al eliminar los resultados' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRows = rows.filter(
    (r) =>
      r.nombreAlumno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.idAlumno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="printable-mejores-resultados" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Tabla de Mejores Resultados Consolidados</h3>
            <p className="text-xs text-slate-400">
              Visualización y sincronización por pestaña de grupo (1A a 12D)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleSyncToSheets}
            disabled={syncing}
            className="flex-1 sm:flex-none py-3 px-4 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
            title="Sincronizar pestaña seleccionada a Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : `Sincronizar ${selectedGrupo}`}
          </button>

          <button
            onClick={handleSyncAllToSheets}
            disabled={syncing}
            className="flex-1 sm:flex-none py-3 px-4 rounded-2xl font-black text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
            title="Crear y actualizar todas las pestañas de grupos con alumnos en Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Todos los Grupos'}
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
                <th className="py-3.5 px-4 text-center">Acciones</th>
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
                  <td className="py-3 px-4 text-center font-sans">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all active:scale-95"
                        title="Editar marcas del alumno"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingRow(r)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all active:scale-95"
                        title="Borrar marcas del alumno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Editar Resultados</h4>
                  <p className="text-xs text-slate-400">{editingRow.nombreAlumno} ({editingRow.idAlumno})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-extrabold text-emerald-400 mb-1">Velocidad (ej. 00:05.10 s)</label>
                <input
                  type="text"
                  value={editForm.velocidad}
                  onChange={(e) => setEditForm({ ...editForm, velocidad: e.target.value })}
                  placeholder="ej. 00:05.10 s o -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-amber-300 mb-1">Salto (ej. 1.85 m)</label>
                <input
                  type="text"
                  value={editForm.salto}
                  onChange={(e) => setEditForm({ ...editForm, salto: e.target.value })}
                  placeholder="ej. 1.85 m o -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-amber-400 mb-1">Lanzamiento (ej. 12.5 m)</label>
                <input
                  type="text"
                  value={editForm.lanzamiento}
                  onChange={(e) => setEditForm({ ...editForm, lanzamiento: e.target.value })}
                  placeholder="ej. 12.5 m o -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-cyan-300 mb-1">Resistencia (ej. 04:30 min)</label>
                <input
                  type="text"
                  value={editForm.resistencia}
                  onChange={(e) => setEditForm({ ...editForm, resistencia: e.target.value })}
                  placeholder="ej. 04:30 min o -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-purple-300 mb-1">Cuerda (ej. 45)</label>
                <input
                  type="text"
                  value={editForm.cuerda}
                  onChange={(e) => setEditForm({ ...editForm, cuerda: e.target.value })}
                  placeholder="ej. 45 o -"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-indigo-300 mb-1">Orden y Control</label>
                <input
                  type="text"
                  value={editForm.ordenYControl}
                  onChange={(e) => setEditForm({ ...editForm, ordenYControl: e.target.value })}
                  placeholder="Excelente, Bueno, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-extrabold text-pink-300 mb-1">ABC Atletismo</label>
                <input
                  type="text"
                  value={editForm.abc}
                  onChange={(e) => setEditForm({ ...editForm, abc: e.target.value })}
                  placeholder="Excelente, Bueno, Suficiente, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingRow(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {actionLoading ? 'Guardando y Sincronizando...' : 'Guardar y Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">¿Borrar Resultados del Alumno?</h4>
                <p className="text-xs text-slate-400">Esta acción eliminará las marcas de este alumno y sincronizará Google Sheets.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div><span className="text-slate-400 font-semibold">Alumno:</span> <span className="font-extrabold text-white">{deletingRow.nombreAlumno}</span></div>
              <div><span className="text-slate-400 font-semibold">ID Alumno:</span> <span className="font-mono text-emerald-400">{deletingRow.idAlumno}</span></div>
              <div><span className="text-slate-400 font-semibold">Pestaña / Grupo:</span> <span className="font-extrabold text-amber-400">{selectedGrupo}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setDeletingRow(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-500 hover:bg-rose-600 text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading ? 'Eliminando...' : 'Sí, Borrar y Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

