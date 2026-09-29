'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ExportPdfButton from '@/components/ExportPdfButton';
import BestResultsTable from '@/components/BestResultsTable';
import { UserSession, AdminMetrics, Usuario, AlumnoInscrito } from '@/lib/types';
import {
  getCustomGroupTabs,
  addCustomGroupTab,
  deleteCustomGroupTab,
  updateCustomGroupTab,
  getAllGroupTabs,
  PESTANIAS_GRUPOS_OFICIALES,
} from '@/lib/mejoresResultados';
import {
  getAllCiclosEscolares,
  getActiveCicloEscolar,
  setActiveCicloEscolar,
  addCustomCicloEscolar,
  deleteCustomCicloEscolar,
} from '@/lib/ciclosEscolares';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Trophy,
  HeartPulse,
  Award,
  BarChart2,
  PieChart,
  RefreshCw,
  Calendar,
  Layers,
  UserPlus,
  UserCog,
  Lock,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Key,
  GraduationCap,
  Save,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Ciclo Escolar selector & management
  const [cicloEscolar, setCicloEscolarState] = useState<string>('2026-2027');
  const [availableCiclos, setAvailableCiclos] = useState<string[]>(getAllCiclosEscolares());
  const [showAddCicloModal, setShowAddCicloModal] = useState<boolean>(false);
  const [newCicloInput, setNewCicloInput] = useState<string>('');
  const [cicloMsg, setCicloMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper: change active ciclo and broadcast to all roles
  const setCicloEscolar = (ciclo: string) => {
    setCicloEscolarState(ciclo);
    setActiveCicloEscolar(ciclo);
  };

  useEffect(() => {
    const handleCiclosUpdate = () => {
      setAvailableCiclos(getAllCiclosEscolares());
    };
    if (typeof window !== 'undefined') {
      // Initialize with persisted active ciclo
      setCicloEscolarState(getActiveCicloEscolar());
      window.addEventListener('trackcm_ciclos_updated', handleCiclosUpdate);
      return () => window.removeEventListener('trackcm_ciclos_updated', handleCiclosUpdate);
    }
  }, []);

  const handleCreateCicloEscolar = async () => {
    const clean = (newCicloInput || '').trim();
    if (!clean) {
      setCicloMsg({ type: 'error', text: 'Por favor ingrese el nombre del ciclo escolar (ej. 2027-2028)' });
      return;
    }

    const ok = addCustomCicloEscolar(clean);
    if (ok) {
      try {
        await fetch('/api/ciclos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cicloEscolar: clean }),
        });
      } catch (e) {
        console.error(e);
      }

      const updatedList = getAllCiclosEscolares();
      setAvailableCiclos(updatedList);
      setCicloEscolar(clean);
      setCicloMsg({
        type: 'success',
        text: `¡Ciclo Escolar "${clean}" agregado exitosamente! Disponible para Maestros, Alumnos y Login.`,
      });
      setShowAddCicloModal(false);
      setNewCicloInput('');
      loadMetrics(clean);
    } else {
      setCicloMsg({ type: 'error', text: 'Ciclo escolar duplicado o no válido' });
    }
    setTimeout(() => setCicloMsg(null), 4000);
  };

  // Admin View Section Navigation
  const [activeSection, setActiveSection] = useState<'monitoring' | 'group-tabs' | 'users' | 'students'>('monitoring');

  // Group Tabs Management State
  const [customTabs, setCustomTabs] = useState<string[]>(getCustomGroupTabs());
  const [newTabName, setNewTabName] = useState<string>('');
  const [tabMsg, setTabMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Users Management State
  const [usersList, setUsersList] = useState<Usuario[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userForm, setUserForm] = useState<{
    nombre: string;
    correo: string;
    password: string;
    rol: 'Maestro' | 'Alumno' | 'Administrador';
    nivelAsignado: string;
  }>({
    nombre: '',
    correo: '',
    password: '',
    rol: 'Maestro',
    nivelAsignado: 'Primaria Menor',
  });
  const [userActionLoading, setUserActionLoading] = useState<boolean>(false);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Students Management & Grade/Group Change State
  const [studentsList, setStudentsList] = useState<AlumnoInscrito[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [showCreateStudentModal, setShowCreateStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<AlumnoInscrito | null>(null);
  const [studentForm, setStudentForm] = useState<{
    idAlumno: string;
    nombreCompleto: string;
    genero: string;
    nivel: string;
    grado: string;
    grupo: string;
    cicloEscolar: string;
  }>({
    idAlumno: '',
    nombreCompleto: '',
    genero: 'M',
    nivel: 'Primaria Menor',
    grado: '1',
    grupo: 'A',
    cicloEscolar: '2026-2027',
  });
  const [studentActionLoading, setStudentActionLoading] = useState<boolean>(false);
  const [studentMsg, setStudentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackcm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const rolLower = parsed.rol?.toLowerCase() || '';
          if (rolLower !== 'administrador' && rolLower !== 'admin') {
            router.push('/maestro');
          } else {
            setUser(parsed);
          }
        } catch (e) {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  const loadMetrics = async (ciclo?: string) => {
    try {
      setLoading(true);
      const targetCiclo = ciclo || cicloEscolar;
      const res = await fetch(`/api/admin/metrics?ciclo=${encodeURIComponent(targetCiclo)}`);
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
        if (data.metrics.ciclosDisponibles && data.metrics.ciclosDisponibles.length > 0) {
          setAvailableCiclos(data.metrics.ciclosDisponibles);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.usuarios) {
        setUsersList(data.usuarios);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      if (data.success && data.alumnos) {
        setStudentsList(data.alumnos);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMetrics(cicloEscolar);
  }, [cicloEscolar]);

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  // Handle Group Tabs Addition / Deletion
  const handleAddCustomGroupTab = () => {
    if (!newTabName.trim()) return;
    const ok = addCustomGroupTab(newTabName);
    if (ok) {
      setCustomTabs(getCustomGroupTabs());
      setTabMsg({ type: 'success', text: `¡Pestaña "${newTabName.trim().toUpperCase()}" agregada exitosamente!` });
      setNewTabName('');
    } else {
      setTabMsg({ type: 'error', text: 'Pestaña duplicada o nombre no válido' });
    }
    setTimeout(() => setTabMsg(null), 3000);
  };

  const handleDeleteCustomGroupTab = (tab: string) => {
    deleteCustomGroupTab(tab);
    setCustomTabs(getCustomGroupTabs());
    setTabMsg({ type: 'success', text: `Pestaña "${tab}" eliminada.` });
    setTimeout(() => setTabMsg(null), 3000);
  };

  // Handle Group Tab Renaming / Editing
  const [editingGroupTab, setEditingGroupTab] = useState<string | null>(null);
  const [editTabNameInput, setEditTabNameInput] = useState<string>('');

  const handleOpenEditTab = (tab: string) => {
    setEditingGroupTab(tab);
    setEditTabNameInput(tab);
  };

  const handleSaveEditedTab = () => {
    if (!editingGroupTab || !editTabNameInput.trim()) return;
    const ok = updateCustomGroupTab(editingGroupTab, editTabNameInput);
    if (ok) {
      setCustomTabs(getCustomGroupTabs());
      setTabMsg({
        type: 'success',
        text: `¡Nombre de pestaña "${editingGroupTab}" actualizado exitosamente a "${editTabNameInput.trim().toUpperCase()}"!`,
      });
      setEditingGroupTab(null);
    } else {
      setTabMsg({ type: 'error', text: 'Error al actualizar nombre de la pestaña' });
    }
    setTimeout(() => setTabMsg(null), 3500);
  };

  // Handle User Create / Edit Password & Role
  const handleCreateUser = async () => {
    if (!userForm.nombre || !userForm.correo || !userForm.password) {
      setUserMsg({ type: 'error', text: 'Por favor llene todos los campos requeridos' });
      return;
    }
    try {
      setUserActionLoading(true);
      setUserMsg(null);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        setUserMsg({ type: 'success', text: data.message });
        setShowCreateUserModal(false);
        setUserForm({ nombre: '', correo: '', password: '', rol: 'Maestro', nivelAsignado: 'Primaria Menor' });
        await loadUsers();
        await loadMetrics(cicloEscolar);
      } else {
        setUserMsg({ type: 'error', text: data.error || 'Error al crear usuario' });
      }
    } catch (e) {
      setUserMsg({ type: 'error', text: 'Error de red al crear usuario' });
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setUserActionLoading(true);
      setUserMsg(null);
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: editingUser.ID_Usuario,
          correo: editingUser.Correo,
          password: userForm.password,
          rol: userForm.rol,
          nivelAsignado: userForm.nivelAsignado,
          nombre: userForm.nombre,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUserMsg({ type: 'success', text: data.message });
        setEditingUser(null);
        await loadUsers();
        await loadMetrics(cicloEscolar);
      } else {
        setUserMsg({ type: 'error', text: data.error || 'Error al actualizar usuario' });
      }
    } catch (e) {
      setUserMsg({ type: 'error', text: 'Error de red al actualizar usuario' });
    } finally {
      setUserActionLoading(false);
    }
  };

  // Handle Student Create & Grade/Group Change
  const handleCreateStudent = async () => {
    if (!studentForm.nombreCompleto || !studentForm.nivel || !studentForm.grado || !studentForm.grupo) {
      setStudentMsg({ type: 'error', text: 'Por favor complete el nombre, nivel, grado y grupo' });
      return;
    }
    try {
      setStudentActionLoading(true);
      setStudentMsg(null);
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...studentForm, cicloEscolar }),
      });
      const data = await res.json();
      if (data.success) {
        setStudentMsg({ type: 'success', text: data.message });
        setShowCreateStudentModal(false);
        setStudentForm({ idAlumno: '', nombreCompleto: '', genero: 'M', nivel: 'Primaria Menor', grado: '1', grupo: 'A', cicloEscolar: '2026-2027' });
        await loadStudents();
        await loadMetrics(cicloEscolar);
      } else {
        setStudentMsg({ type: 'error', text: data.error || 'Error al registrar alumno' });
      }
    } catch (e) {
      setStudentMsg({ type: 'error', text: 'Error de red al registrar alumno' });
    } finally {
      setStudentActionLoading(false);
    }
  };

  const handleUpdateStudentGradeGroup = async () => {
    if (!editingStudent) return;
    try {
      setStudentActionLoading(true);
      setStudentMsg(null);
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAlumno: editingStudent.ID_Alumno,
          nombreCompleto: studentForm.nombreCompleto,
          nivel: studentForm.nivel,
          grado: studentForm.grado,
          grupo: studentForm.grupo,
          cicloEscolar: studentForm.cicloEscolar || cicloEscolar,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudentMsg({ type: 'success', text: data.message });
        setEditingStudent(null);
        await loadStudents();
        await loadMetrics(cicloEscolar);
      } else {
        setStudentMsg({ type: 'error', text: data.error || 'Error al actualizar grado/grupo' });
      }
    } catch (e) {
      setStudentMsg({ type: 'error', text: 'Error de red al actualizar estudiante' });
    } finally {
      setStudentActionLoading(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.Nombre.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.Correo.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.Rol.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredStudents = studentsList.filter(
    (s) =>
      s.Nombre_Completo.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      s.ID_Alumno.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      s.Grupo.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Ciclo Escolar Selector */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white">Dashboard de Administrador</h1>
            </div>
            <p className="text-xs text-slate-400">
              Colegio Mexicano • Gestión Integral de Usuarios, Grupos, Alumnos y Ciclos Escolares
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Ciclo Escolar Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">Ciclo:</span>
              <select
                value={cicloEscolar}
                onChange={(e) => setCicloEscolar(e.target.value)}
                className="bg-slate-900 text-emerald-400 font-mono font-bold text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-emerald-400"
              >
                {availableCiclos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddCicloModal(true)}
                className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1 shadow-md active:scale-95"
                title="Agregar manualmente otro ciclo escolar para Maestros, Alumnos y Login"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ciclo
              </button>
            </div>

            <ExportPdfButton
              elementId="admin-dashboard-report"
              fileName={`Reporte_Administrador_TrackCM_${cicloEscolar}.pdf`}
              title={`Reporte Global de Administrador — ${cicloEscolar}`}
            />
            <button
              onClick={() => loadMetrics(cicloEscolar)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all active:scale-95"
              title="Actualizar Datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveSection('monitoring')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all ${
              activeSection === 'monitoring'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Monitoreo y Avance
          </button>

          <button
            onClick={() => setActiveSection('group-tabs')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all ${
              activeSection === 'group-tabs'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Pestañas de Grupos
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all ${
              activeSection === 'users'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Usuarios y Contraseñas
          </button>

          <button
            onClick={() => setActiveSection('students')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all ${
              activeSection === 'students'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Alumnos y Grado/Grupo
          </button>
        </div>

        {/* Section 1: Monitoring & Teacher Progress Metrics */}
        {activeSection === 'monitoring' && (
          <div id="admin-dashboard-report" className="space-y-6">
            {/* Top Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Alumnos ({cicloEscolar})</p>
                  <p className="text-3xl font-black text-white font-mono mt-1">{metrics?.totalAlumnos || 0}</p>
                  <p className="text-[10px] text-slate-500">Inscritos Activos</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Profesores Activos</p>
                  <p className="text-3xl font-black text-indigo-400 font-mono mt-1">{metrics?.totalMaestros || 0}</p>
                  <p className="text-[10px] text-slate-500">Educación Física</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Pruebas de Atletismo</p>
                  <p className="text-3xl font-black text-amber-400 font-mono mt-1">{metrics?.totalRegistrosAtl || 0}</p>
                  <p className="text-[10px] text-slate-500">Marcas Registradas</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Fichas IMC / Antro</p>
                  <p className="text-3xl font-black text-cyan-400 font-mono mt-1">{metrics?.totalRegistrosAntro || 0}</p>
                  <p className="text-[10px] text-slate-500">Mediciones Nutricionales</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <HeartPulse className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* School Level Breakdown & Teacher Activity Report */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alumnos por Nivel Escolar */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Alumnos por Nivel Escolar</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'Kinder', label: 'Kinder', color: 'bg-pink-500' },
                    { key: 'Primaria Menor', label: 'Primaria Menor', color: 'bg-emerald-500' },
                    { key: 'Primaria Mayor', label: 'Primaria Mayor', color: 'bg-cyan-500' },
                    { key: 'Secundaria', label: 'Secundaria', color: 'bg-indigo-500' },
                    { key: 'Preparatoria', label: 'Preparatoria', color: 'bg-amber-500' },
                  ].map((item) => {
                    const count = metrics?.alumnosPorNivel[item.key] || 0;
                    const total = metrics?.totalAlumnos || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="text-white font-mono font-bold">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reporte de Registros por Profesor con Conteo Llenado vs Esperado */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Reporte de Registros por Profesor (Llenados vs Esperados)</h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Ciclo {cicloEscolar}
                  </span>
                </div>

                {!metrics?.actividadMaestros || metrics.actividadMaestros.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay actividad de profesores registrada aún.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Profesor</th>
                          <th className="py-2.5 px-3">Nivel Escolar</th>
                          <th className="py-2.5 px-3 text-center">🏃 Atletismo (Pruebas)</th>
                          <th className="py-2.5 px-3 text-center">🩺 IMC / Antro</th>
                          <th className="py-2.5 px-3 text-center">📋 Cualitativo</th>
                          <th className="py-2.5 px-3 text-right">Avance Global</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {metrics.actividadMaestros.map((m) => (
                          <tr key={m.idMaestro} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                                {m.nombreMaestro.charAt(0)}
                              </div>
                              <div>
                                <span>{m.nombreMaestro}</span>
                                <span className="block text-[10px] text-slate-500 font-mono font-normal">
                                  {m.totalAlumnosNivel || 0} alumnos a su cargo
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-emerald-400">{m.nivelAsignado || 'Educación Física'}</td>
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="text-amber-400 font-bold">{m.totalAtletismo}</span>
                              <span className="text-slate-500 text-[11px]"> / {m.esperadosAtletismo || (m.totalAlumnosNivel ? m.totalAlumnosNivel * 5 : 50)}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="text-cyan-400 font-bold">{m.totalAntropometricos}</span>
                              <span className="text-slate-500 text-[11px]"> / {m.esperadosAntropometricos || m.totalAlumnosNivel || 10}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="text-purple-400 font-bold">{m.totalCualitativos}</span>
                              <span className="text-slate-500 text-[11px]"> / {m.esperadosCualitativos || (m.totalAlumnosNivel ? m.totalAlumnosNivel * 2 : 20)}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <span className="font-extrabold text-white">{m.totalRegistros}</span>
                              <span className="text-slate-500 text-[11px]"> / {m.esperadosTotal || 80}</span>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${m.porcentajeAvance || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-emerald-400 font-bold">{m.porcentajeAvance || 0}% completado</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Consolidated Best Results Table */}
            <BestResultsTable user={user} cicloEscolar={cicloEscolar} />
          </div>
        )}

        {/* Section 2: Group Tabs Management (Agregar & Editar Pestañas) */}
        {activeSection === 'group-tabs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Gestión de Pestañas de Grupos</h3>
                  <p className="text-xs text-slate-400">
                    Agrega, edita o remueve pestañas de grupo para las tablas consolidadas de profesores
                  </p>
                </div>
              </div>
            </div>

            {tabMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  tabMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {tabMsg.text}
              </div>
            )}

            {/* Add New Group Tab Form */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Agregar Nueva Pestaña de Grupo
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ej. 1E, Kinder 2, 7E, 10F..."
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleAddCustomGroupTab}
                  className="px-5 py-2.5 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Agregar Pestaña
                </button>
              </div>
            </div>

            {/* Group Tabs List Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Pestañas de Grupo Activas ({PESTANIAS_GRUPOS_OFICIALES.length + customTabs.length} pestañas):
              </h4>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto">
                {/* Official tabs */}
                {PESTANIAS_GRUPOS_OFICIALES.map((g) => (
                  <div
                    key={g}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1.5"
                  >
                    <span>{g}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Oficial</span>
                    <button
                      onClick={() => handleOpenEditTab(g)}
                      className="text-slate-400 hover:text-amber-400 transition-colors p-0.5"
                      title="Editar nombre de esta pestaña"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {/* Custom admin added tabs */}
                {customTabs.map((ct) => (
                  <div
                    key={ct}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-sm"
                  >
                    <span>{ct}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Admin</span>
                    <button
                      onClick={() => handleOpenEditTab(ct)}
                      className="text-emerald-400 hover:text-amber-400 transition-colors p-0.5"
                      title="Editar nombre de esta pestaña"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomGroupTab(ct)}
                      className="text-emerald-400 hover:text-rose-400 transition-colors p-0.5"
                      title="Eliminar pestaña de grupo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Users & Password Management */}
        {activeSection === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Gestión de Usuarios y Contraseñas</h3>
                  <p className="text-xs text-slate-400">
                    Crea profesores/usuarios, modifica sus roles y actualiza contraseñas de acceso
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setUserForm({ nombre: '', correo: '', password: '', rol: 'Maestro', nivelAsignado: 'Primaria Menor' });
                  setShowCreateUserModal(true);
                }}
                className="py-2.5 px-4 rounded-xl font-extrabold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Crear Nuevo Usuario
              </button>
            </div>

            {userMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  userMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {userMsg.text}
              </div>
            )}

            {/* Users Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar usuario o correo..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID / Nombre</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Nivel Asignado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.ID_Usuario || u.Correo} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-xs">
                          {u.Nombre.charAt(0)}
                        </div>
                        <div>
                          <p>{u.Nombre}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{u.ID_Usuario}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{u.Correo}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.Rol?.toLowerCase() === 'administrador'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.Rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-amber-300 font-semibold">{u.Nivel_Asignado || 'General'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({
                              nombre: u.Nombre,
                              correo: u.Correo,
                              password: u.Password || '',
                              rol: u.Rol,
                              nivelAsignado: u.Nivel_Asignado || 'General',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                        >
                          <Key className="w-3.5 h-3.5" /> Editar Contraseña / Rol
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Students Management & Grade/Group Change */}
        {activeSection === 'students' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Gestión de Alumnos y Cambios de Grado/Grupo</h3>
                  <p className="text-xs text-slate-400">
                    Agrega nuevos estudiantes o modifica el nivel, grado y grupo asignado a cualquier alumno
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStudentForm({ idAlumno: '', nombreCompleto: '', genero: 'M', nivel: 'Primaria Menor', grado: '1', grupo: 'A', cicloEscolar: '2026-2027' });
                  setShowCreateStudentModal(true);
                }}
                className="py-2.5 px-4 rounded-xl font-extrabold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" /> Agregar Nuevo Alumno
              </button>
            </div>

            {studentMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  studentMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {studentMsg.text}
              </div>
            )}

            {/* Students Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, ID o grupo..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID Alumno</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Nivel Escolar</th>
                    <th className="py-3 px-4 text-center">Grado °</th>
                    <th className="py-3 px-4 text-center">Grupo</th>
                    <th className="py-3 px-4 text-center">Ciclo</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredStudents.slice(0, 100).map((st) => (
                    <tr key={st.ID_Alumno} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">{st.ID_Alumno}</td>
                      <td className="py-3 px-4 font-bold text-white">{st.Nombre_Completo}</td>
                      <td className="py-3 px-4 text-amber-300 font-semibold">{st.Nivel}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{st.Grado}°</td>
                      <td className="py-3 px-4 text-center font-bold text-cyan-400">{st.Grupo}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{st.Ciclo_Escolar || cicloEscolar}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              idAlumno: st.ID_Alumno,
                              nombreCompleto: st.Nombre_Completo,
                              genero: st.Genero || 'M',
                              nivel: st.Nivel || 'Primaria Menor',
                              grado: st.Grado || '1',
                              grupo: st.Grupo || 'A',
                              cicloEscolar: st.Ciclo_Escolar || cicloEscolar,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                        >
                          <UserCog className="w-3.5 h-3.5" /> Cambiar Grado / Grupo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create User */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" /> Crear Nuevo Usuario / Maestro
                </h4>
                <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={userForm.nombre}
                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                    placeholder="Ej. Prof. Carlos Mendoza"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={userForm.correo}
                    onChange={(e) => setUserForm({ ...userForm, correo: e.target.value })}
                    placeholder="ej. carlos.mendoza@colmexi.edu.mx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contraseña Inicial</label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Ej. 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Rol</label>
                    <select
                      value={userForm.rol}
                      onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Maestro">Maestro</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Alumno">Alumno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nivel Asignado</label>
                    <input
                      type="text"
                      value={userForm.nivelAsignado}
                      onChange={(e) => setUserForm({ ...userForm, nivelAsignado: e.target.value })}
                      placeholder="Ej. Primaria Menor"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={userActionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {userActionLoading ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit User / Password */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" /> Editar Contraseña / Rol de {editingUser.Nombre}
                </h4>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nueva Contraseña (dejar en blanco para conservar)</label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Escriba nueva contraseña..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Rol</label>
                    <select
                      value={userForm.rol}
                      onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Maestro">Maestro</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Alumno">Alumno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nivel Asignado</label>
                    <input
                      type="text"
                      value={userForm.nivelAsignado}
                      onChange={(e) => setUserForm({ ...userForm, nivelAsignado: e.target.value })}
                      placeholder="Ej. Primaria Menor"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={userActionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {userActionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Student */}
        {showCreateStudentModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" /> Registrar Nuevo Alumno
                </h4>
                <button onClick={() => setShowCreateStudentModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Completo del Alumno</label>
                  <input
                    type="text"
                    value={studentForm.nombreCompleto}
                    onChange={(e) => setStudentForm({ ...studentForm, nombreCompleto: e.target.value })}
                    placeholder="Ej. Juan Pérez García"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Género</label>
                    <select
                      value={studentForm.genero}
                      onChange={(e) => setStudentForm({ ...studentForm, genero: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="M">M (Masculino)</option>
                      <option value="F">F (Femenino)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nivel Escolar</label>
                    <select
                      value={studentForm.nivel}
                      onChange={(e) => setStudentForm({ ...studentForm, nivel: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Kinder">Kinder</option>
                      <option value="Primaria Menor">Primaria Menor</option>
                      <option value="Primaria Mayor">Primaria Mayor</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Preparatoria">Preparatoria</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Grado °</label>
                    <input
                      type="text"
                      value={studentForm.grado}
                      onChange={(e) => setStudentForm({ ...studentForm, grado: e.target.value })}
                      placeholder="Ej. 1, 2, 3..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Grupo</label>
                    <input
                      type="text"
                      value={studentForm.grupo}
                      onChange={(e) => setStudentForm({ ...studentForm, grupo: e.target.value.toUpperCase() })}
                      placeholder="Ej. A, B, C..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateStudent}
                  disabled={studentActionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {studentActionLoading ? 'Guardando...' : 'Registrar Alumno'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Change Grade & Group of Student */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-cyan-400" /> Cambiar Grado y Grupo de {editingStudent.Nombre_Completo}
                </h4>
                <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={studentForm.nombreCompleto}
                    onChange={(e) => setStudentForm({ ...studentForm, nombreCompleto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nivel Escolar</label>
                  <select
                    value={studentForm.nivel}
                    onChange={(e) => setStudentForm({ ...studentForm, nivel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Kinder">Kinder</option>
                    <option value="Primaria Menor">Primaria Menor</option>
                    <option value="Primaria Mayor">Primaria Mayor</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Preparatoria">Preparatoria</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nuevo Grado °</label>
                    <input
                      type="text"
                      value={studentForm.grado}
                      onChange={(e) => setStudentForm({ ...studentForm, grado: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nuevo Grupo</label>
                    <input
                      type="text"
                      value={studentForm.grupo}
                      onChange={(e) => setStudentForm({ ...studentForm, grupo: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateStudentGradeGroup}
                  disabled={studentActionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {studentActionLoading ? 'Guardando...' : 'Guardar Grado/Grupo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Group Tab Name */}
        {editingGroupTab && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-400" /> Editar Nombre de Pestaña de Grupo
                </h4>
                <button onClick={() => setEditingGroupTab(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Actual de Pestaña</label>
                  <p className="font-mono text-sm font-bold text-amber-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    {editingGroupTab}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nuevo Nombre de la Pestaña</label>
                  <input
                    type="text"
                    value={editTabNameInput}
                    onChange={(e) => setEditTabNameInput(e.target.value)}
                    placeholder="Ej. 1E, Kinder 2, 7E..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setEditingGroupTab(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditedTab}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" /> Guardar Nombre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Ciclo Escolar Modal */}
        {showAddCicloModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Agregar Nuevo Ciclo Escolar</h4>
                    <p className="text-xs text-slate-400">Disponible para Maestros, Alumnos y Pantalla de Login</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddCicloModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cicloMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    cicloMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {cicloMsg.text}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-extrabold mb-1">
                    Nombre del Ciclo Escolar (ej. 2027-2028)
                  </label>
                  <input
                    type="text"
                    value={newCicloInput}
                    onChange={(e) => setNewCicloInput(e.target.value)}
                    placeholder="ej. 2027-2028 o 2028-2029"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Al crearlo, aparecerá inmediatamente en los selectores de ciclo para Maestros, Alumnos, Administradores y Login.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowAddCicloModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCicloEscolar}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 active:scale-95 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Guardar Ciclo Escolar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
