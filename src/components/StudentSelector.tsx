'use client';

import React, { useState, useEffect } from 'react';
import { AlumnoInscrito } from '@/lib/types';
import { Filter, User, Layers, GraduationCap, Calendar, CheckCircle2 } from 'lucide-react';

interface StudentSelectorProps {
  onSelectStudent: (student: AlumnoInscrito | null, ciclo: string) => void;
  selectedStudentId?: string;
}

export default function StudentSelector({ onSelectStudent, selectedStudentId }: StudentSelectorProps) {
  const [alumnos, setAlumnos] = useState<AlumnoInscrito[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selector state
  const [selectedCiclo, setSelectedCiclo] = useState<string>('2026-2027');
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedGrado, setSelectedGrado] = useState<string>('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>('');

  // Available options
  const [ciclos, setCiclos] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<string[]>([]);
  const [grados, setGrados] = useState<string[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState<AlumnoInscrito[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/estudiantes');
        const data = await res.json();
        if (data.success) {
          setAlumnos(data.alumnos || []);
          setCiclos(data.filters?.ciclos || ['2026-2027']);
          
          if (data.filters?.ciclos?.length > 0) {
            setSelectedCiclo(data.filters.ciclos[0]);
          }
        }
      } catch (err) {
        console.error('Error loading students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update levels available for chosen Ciclo
  useEffect(() => {
    const list = alumnos.filter((a) => a.Ciclo_Escolar === selectedCiclo);
    const availableNiveles = Array.from(new Set(list.map((a) => a.Nivel))).filter(Boolean);
    setNiveles(availableNiveles);
    
    if (availableNiveles.length > 0 && (!selectedNivel || !availableNiveles.includes(selectedNivel))) {
      setSelectedNivel(availableNiveles[0]);
    }
  }, [selectedCiclo, alumnos]);

  // Update grades available for chosen Ciclo + Nivel
  useEffect(() => {
    const list = alumnos.filter(
      (a) => a.Ciclo_Escolar === selectedCiclo && a.Nivel === selectedNivel
    );
    const availableGrados = Array.from(new Set(list.map((a) => a.Grado))).filter(Boolean);
    setGrados(availableGrados);

    if (availableGrados.length > 0 && (!selectedGrado || !availableGrados.includes(selectedGrado))) {
      setSelectedGrado(availableGrados[0]);
    }
  }, [selectedCiclo, selectedNivel, alumnos]);

  // Update groups available for chosen Ciclo + Nivel + Grado
  useEffect(() => {
    const list = alumnos.filter(
      (a) =>
        a.Ciclo_Escolar === selectedCiclo &&
        a.Nivel === selectedNivel &&
        a.Grado === selectedGrado
    );
    const availableGrupos = Array.from(new Set(list.map((a) => a.Grupo))).filter(Boolean);
    setGrupos(availableGrupos);

    if (availableGrupos.length > 0 && (!selectedGrupo || !availableGrupos.includes(selectedGrupo))) {
      setSelectedGrupo(availableGrupos[0]);
    }
  }, [selectedCiclo, selectedNivel, selectedGrado, alumnos]);

  // Update filtered final list of students
  useEffect(() => {
    const list = alumnos.filter(
      (a) =>
        a.Ciclo_Escolar === selectedCiclo &&
        a.Nivel === selectedNivel &&
        a.Grado === selectedGrado &&
        a.Grupo === selectedGrupo
    );
    setFilteredAlumnos(list);

    if (list.length > 0) {
      // Auto pick first student or maintain selection
      const exists = list.find((a) => a.ID_Alumno === selectedAlumnoId);
      const chosen = exists ? exists : list[0];
      setSelectedAlumnoId(chosen.ID_Alumno);
      onSelectStudent(chosen, selectedCiclo);
    } else {
      setSelectedAlumnoId('');
      onSelectStudent(null, selectedCiclo);
    }
  }, [selectedCiclo, selectedNivel, selectedGrado, selectedGrupo, alumnos]);

  const handleStudentChange = (id: string) => {
    setSelectedAlumnoId(id);
    const st = alumnos.find((a) => a.ID_Alumno === id) || null;
    onSelectStudent(st, selectedCiclo);
  };

  const selectedStudentObj = alumnos.find((a) => a.ID_Alumno === selectedAlumnoId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Selectores de Alumnos (Filtro en Cascada)
          </h2>
        </div>
        {loading && (
          <span className="text-xs text-emerald-400 animate-pulse">Cargando datos...</span>
        )}
      </div>

      {/* Cascading dropdown grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ciclo Escolar */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ciclo Escolar
          </label>
          <select
            value={selectedCiclo}
            onChange={(e) => setSelectedCiclo(e.target.value)}
            className="w-full bg-slate-800/80 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {ciclos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Nivel */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Nivel
          </label>
          <select
            value={selectedNivel}
            onChange={(e) => setSelectedNivel(e.target.value)}
            className="w-full bg-slate-800/80 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {niveles.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Grado */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Grado
          </label>
          <select
            value={selectedGrado}
            onChange={(e) => setSelectedGrado(e.target.value)}
            className="w-full bg-slate-800/80 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {grados.map((g) => (
              <option key={g} value={g}>
                Grado {g}°
              </option>
            ))}
          </select>
        </div>

        {/* Grupo */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> Grupo
          </label>
          <select
            value={selectedGrupo}
            onChange={(e) => setSelectedGrupo(e.target.value)}
            className="w-full bg-slate-800/80 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {grupos.map((grp) => (
              <option key={grp} value={grp}>
                Grupo "{grp}"
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Student Select */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Alumno Seleccionado ({filteredAlumnos.length} disponibles en este grupo)
        </label>
        <select
          value={selectedAlumnoId}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="w-full bg-slate-950 text-emerald-400 font-bold text-base rounded-xl px-4 py-3 border-2 border-emerald-500/40 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
        >
          {filteredAlumnos.length === 0 ? (
            <option value="">No hay alumnos registrados en este grupo</option>
          ) : (
            filteredAlumnos.map((a) => (
              <option key={a.ID_Alumno} value={a.ID_Alumno} className="bg-slate-900 text-white">
                {a.Nombre_Completo} — [{a.ID_Alumno}]
              </option>
            ))
          )}
        </select>
      </div>

      {/* Active Student Badge */}
      {selectedStudentObj && (
        <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {selectedStudentObj.Nombre_Completo.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                {selectedStudentObj.Nombre_Completo}
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </p>
              <p className="text-xs text-slate-400">
                {selectedStudentObj.Nivel} • {selectedStudentObj.Grado}° "{selectedStudentObj.Grupo}" | Género: {selectedStudentObj.Genero}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
            ID: {selectedStudentObj.ID_Alumno}
          </span>
        </div>
      )}
    </div>
  );
}
