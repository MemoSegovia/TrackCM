'use client';

import React, { useState, useEffect } from 'react';
import { AlumnoInscrito, UserSession, NIVELES_ESCOLARES_OFICIALES } from '@/lib/types';
import { Filter, User, Layers, GraduationCap, Calendar, CheckCircle2, Lock, WifiOff } from 'lucide-react';
import { saveStudentsCache, getStudentsCache } from '@/lib/offlineManager';

interface StudentSelectorProps {
  onSelectStudent: (student: AlumnoInscrito | null, ciclo: string, groupStudents?: AlumnoInscrito[]) => void;
  user?: UserSession | null;
  selectedStudentId?: string;
}

export default function StudentSelector({ onSelectStudent, user, selectedStudentId }: StudentSelectorProps) {
  const [alumnos, setAlumnos] = useState<AlumnoInscrito[]>([]);
  const [userLevelsByEmail, setUserLevelsByEmail] = useState<Record<string, string[]>>({});
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

  // Calculate teacher assigned levels
  const userRoleLower = user?.rol?.toLowerCase() || '';
  const userEmailLower = user?.correo?.trim().toLowerCase() || '';

  const sessionAssigned = user?.nivelAsignado || '';
  const mappedAssigned = userEmailLower && userLevelsByEmail[userEmailLower]
    ? userLevelsByEmail[userEmailLower]
    : [];

  const rawAssignedList: string[] = [];
  if (sessionAssigned) {
    sessionAssigned.split(/[,/;]+/).forEach((s) => {
      const clean = s.replace(/\s*\([^)]*\)/g, '').trim();
      if (clean && !rawAssignedList.some((r) => r.toLowerCase() === clean.toLowerCase())) {
        rawAssignedList.push(clean);
      }
    });
  }

  mappedAssigned.forEach((lvl) => {
    const clean = lvl.replace(/\s*\([^)]*\)/g, '').trim();
    if (clean && !rawAssignedList.some((r) => r.toLowerCase() === clean.toLowerCase())) {
      rawAssignedList.push(clean);
    }
  });

  const isUnlimitedTeacher =
    !user ||
    userRoleLower === 'administrador' ||
    userRoleLower === 'admin' ||
    rawAssignedList.some((l) => l.toLowerCase() === 'todos');

  const isRestrictedTeacher = userRoleLower === 'maestro' && !isUnlimitedTeacher;

  const isDiegoArmando =
    (user?.nombre?.toLowerCase().includes('diego armando') ||
     user?.correo?.toLowerCase().includes('diego.ibarra')) ?? false;

  const isOrlandoCampos =
    (user?.nombre?.toLowerCase().includes('orlando campos') ||
     user?.correo?.toLowerCase().includes('orlando.campos')) ?? false;

  const isGroupDisabledForUser = (grado: string, grupo: string): boolean => {
    const cleanGrado = (grado || '').replace(/[^0-9]/g, '');
    const cleanGrupo = (grupo || '').trim().toUpperCase();

    if (isDiegoArmando) {
      if (cleanGrado === '1' && ['A', 'B', 'C', 'D'].includes(cleanGrupo)) {
        return true;
      }
      if (cleanGrado === '2' && ['A', 'B', 'C'].includes(cleanGrupo)) {
        return true;
      }
    }

    if (isOrlandoCampos) {
      if (cleanGrado === '3' && ['A', 'B', 'C', 'D'].includes(cleanGrupo)) {
        return true;
      }
    }

    return false;
  };

  const isGradeDisabledForUser = (grado: string): boolean => {
    if (!selectedNivel.toLowerCase().includes('primaria')) return false;
    const cleanG = (grado || '').replace(/[^0-9]/g, '');
    if (isDiegoArmando) {
      return cleanG === '1' || cleanG === '2';
    }
    if (isOrlandoCampos) {
      return cleanG === '3';
    }
    return false;
  };

  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/estudiantes');
        const data = await res.json();
        if (data.success) {
          const loadedAlumnos = data.alumnos || [];
          setAlumnos(loadedAlumnos);
          if (data.userLevelsByEmail) {
            setUserLevelsByEmail(data.userLevelsByEmail);
          }
          saveStudentsCache(loadedAlumnos, data.userLevelsByEmail);
          setCiclos(data.filters?.ciclos || ['2026-2027']);

          if (data.filters?.ciclos?.length > 0) {
            setSelectedCiclo(data.filters.ciclos[0]);
          }
          setIsOfflineData(false);
        } else {
          throw new Error('API request returned failure');
        }
      } catch (err) {
        console.warn('Network error or offline mode. Loading cached student data:', err);
        const cached = getStudentsCache();
        if (cached.alumnos && cached.alumnos.length > 0) {
          setAlumnos(cached.alumnos);
          if (cached.userLevelsByEmail) {
            setUserLevelsByEmail(cached.userLevelsByEmail);
          }
          const uniqueCiclos = Array.from(new Set(cached.alumnos.map((a) => a.Ciclo_Escolar))).filter(Boolean);
          if (uniqueCiclos.length > 0) {
            setCiclos(uniqueCiclos);
            setSelectedCiclo(uniqueCiclos[0]);
          }
          setIsOfflineData(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update levels available for chosen Ciclo (and scoped to teacher if restricted)
  useEffect(() => {
    const list = alumnos.filter((a) => a.Ciclo_Escolar === selectedCiclo);
    let availableNiveles = Array.from(new Set(list.map((a) => a.Nivel))).filter(Boolean);

    if (availableNiveles.length === 0) {
      availableNiveles = [...NIVELES_ESCOLARES_OFICIALES];
    }

    if (isRestrictedTeacher && rawAssignedList.length > 0) {
      const matchedLevels: string[] = [];

      rawAssignedList.forEach((assigned) => {
        const cleanAssigned = assigned.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        if (!cleanAssigned) return;

        const officialMatch =
          NIVELES_ESCOLARES_OFICIALES.find((n) => n.toLowerCase() === cleanAssigned) ||
          availableNiveles.find((n) => n.toLowerCase() === cleanAssigned);

        if (officialMatch && !matchedLevels.some((m) => m.toLowerCase() === officialMatch.toLowerCase())) {
          matchedLevels.push(officialMatch);
        }
      });

      const finalNiveles = matchedLevels.length > 0 ? matchedLevels : availableNiveles;
      setNiveles(finalNiveles);

      if (finalNiveles.length > 0 && (!selectedNivel || !finalNiveles.some((m) => m.toLowerCase() === selectedNivel.toLowerCase()))) {
        setSelectedNivel(finalNiveles[0]);
      }
    } else {
      setNiveles(availableNiveles);
      if (availableNiveles.length > 0 && (!selectedNivel || !availableNiveles.includes(selectedNivel))) {
        setSelectedNivel(availableNiveles[0]);
      }
    }
  }, [selectedCiclo, alumnos, isRestrictedTeacher, rawAssignedList.join(',')]);

  // Update grades available for chosen Ciclo + Nivel
  useEffect(() => {
    const list = alumnos.filter(
      (a) => a.Ciclo_Escolar === selectedCiclo && a.Nivel.toLowerCase() === selectedNivel.toLowerCase()
    );
    const availableGrados = Array.from(new Set(list.map((a) => a.Grado))).filter(Boolean);
    const sortedGrados = availableGrados.length > 0 ? availableGrados : ['1', '2', '3', '4', '5', '6'];
    setGrados(sortedGrados);

    if ((isDiegoArmando || isOrlandoCampos) && selectedNivel.toLowerCase().includes('primaria')) {
      const validGrade = sortedGrados.find((g) => !isGradeDisabledForUser(g)) || sortedGrados[0];

      if (!selectedGrado || isGradeDisabledForUser(selectedGrado)) {
        setSelectedGrado(validGrade);
        return;
      }
    }

    if (sortedGrados.length > 0 && (!selectedGrado || !sortedGrados.includes(selectedGrado))) {
      setSelectedGrado(sortedGrados[0]);
    } else if (sortedGrados.length === 0) {
      setSelectedGrado('1');
    }
  }, [selectedCiclo, selectedNivel, alumnos, isDiegoArmando, isOrlandoCampos]);

  // Update groups available for chosen Ciclo + Nivel + Grado
  useEffect(() => {
    const list = alumnos.filter(
      (a) =>
        a.Ciclo_Escolar === selectedCiclo &&
        a.Nivel.toLowerCase() === selectedNivel.toLowerCase() &&
        a.Grado === selectedGrado
    );
    const availableGrupos = Array.from(new Set(list.map((a) => a.Grupo))).filter(Boolean);
    const sortedGrupos = availableGrupos.length > 0 ? availableGrupos : ['A', 'B', 'C'];
    setGrupos(sortedGrupos);

    const validGroup = sortedGrupos.find((grp) => !isGroupDisabledForUser(selectedGrado, grp));

    if (validGroup && (!selectedGrupo || !sortedGrupos.includes(selectedGrupo) || isGroupDisabledForUser(selectedGrado, selectedGrupo))) {
      setSelectedGrupo(validGroup);
    } else if (!validGroup && sortedGrupos.length > 0) {
      setSelectedGrupo(sortedGrupos[0]);
    } else if (sortedGrupos.length === 0) {
      setSelectedGrupo('A');
    }
  }, [selectedCiclo, selectedNivel, selectedGrado, alumnos, isDiegoArmando, isOrlandoCampos]);

  // Update filtered final list of students
  useEffect(() => {
    const list = alumnos.filter(
      (a) =>
        a.Ciclo_Escolar === selectedCiclo &&
        a.Nivel.toLowerCase() === selectedNivel.toLowerCase() &&
        a.Grado === selectedGrado &&
        a.Grupo === selectedGrupo &&
        !isGroupDisabledForUser(a.Grado, a.Grupo)
    );
    setFilteredAlumnos(list);

    const exists = selectedAlumnoId
      ? list.find((a) => a.ID_Alumno && a.ID_Alumno === selectedAlumnoId)
      : null;

    if (exists) {
      onSelectStudent(exists, selectedCiclo, list);
    } else {
      setSelectedAlumnoId('');
      onSelectStudent(null, selectedCiclo, list);
    }
  }, [selectedCiclo, selectedNivel, selectedGrado, selectedGrupo, alumnos, isDiegoArmando, isOrlandoCampos]);

  const handleStudentChange = (id: string) => {
    setSelectedAlumnoId(id);
    if (!id) {
      onSelectStudent(null, selectedCiclo, filteredAlumnos);
      return;
    }
    const st = filteredAlumnos.find((a) => a.ID_Alumno === id) || alumnos.find((a) => a.ID_Alumno === id) || null;
    onSelectStudent(st, selectedCiclo, filteredAlumnos);
  };

  const selectedStudentObj = selectedAlumnoId
    ? filteredAlumnos.find((a) => a.ID_Alumno && a.ID_Alumno === selectedAlumnoId) || alumnos.find((a) => a.ID_Alumno && a.ID_Alumno === selectedAlumnoId) || null
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Selectores de Alumnos (Filtro en Cascada)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-emerald-400 animate-pulse">Cargando lista...</span>}
          {isOfflineData && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              <WifiOff className="w-3.5 h-3.5" /> Alumnos (Caché Local Offline)
            </span>
          )}
        </div>
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

        {/* Nivel Escolar */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Nivel Escolar
          </label>
          <select
            value={selectedNivel}
            onChange={(e) => setSelectedNivel(e.target.value)}
            className="w-full bg-slate-800/80 text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors font-medium text-amber-300 sm:text-slate-100"
          >
            {niveles.map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-white">
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
            {grados.map((g) => {
              const isGradeDisabled = isGradeDisabledForUser(g);
              return (
                <option
                  key={g}
                  value={g}
                  disabled={isGradeDisabled}
                  className={isGradeDisabled ? 'bg-slate-900 text-slate-600 font-normal' : 'bg-slate-900 text-white'}
                >
                  Grado {g}° {isGradeDisabled ? '(Inhabilitado)' : ''}
                </option>
              );
            })}
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
            {grupos.map((grp) => {
              const isDisabled = isGroupDisabledForUser(selectedGrado, grp);
              return (
                <option
                  key={grp}
                  value={grp}
                  disabled={isDisabled}
                  className={isDisabled ? 'bg-slate-900 text-slate-600 font-normal' : 'bg-slate-900 text-white'}
                >
                  Grupo "{grp}" {isDisabled ? '(Inhabilitado)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Student Select */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Alumno Seleccionado ({filteredAlumnos.length} en este grupo)
        </label>
        <select
          value={selectedAlumnoId}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="w-full bg-slate-950 text-emerald-400 font-bold text-base rounded-xl px-4 py-3 border-2 border-emerald-500/40 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
        >
          <option value="" className="bg-slate-900 text-slate-400 font-normal">
            -- Seleccionar Alumno --
          </option>
          {filteredAlumnos.map((a) => (
            <option key={a.ID_Alumno} value={a.ID_Alumno} className="bg-slate-900 text-white">
              {a.Nombre_Completo} — [{a.ID_Alumno}]
            </option>
          ))}
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
