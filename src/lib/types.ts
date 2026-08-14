export type RolUsuario = 'Maestro' | 'Alumno' | 'Administrador';

export const NIVELES_ESCOLARES_OFICIALES = [
  'Kinder',
  'Primaria Menor',
  'Primaria Mayor',
  'Secundaria',
  'Preparatoria',
] as const;

export type NivelEscolar = typeof NIVELES_ESCOLARES_OFICIALES[number];

export interface Usuario {
  ID_Usuario: string;
  Nombre: string;
  Correo: string;
  Password?: string;
  Rol: RolUsuario;
  Nivel_Asignado: string; // 'Kinder', 'Primaria Menor', 'Primaria Mayor', 'Secundaria', 'Preparatoria', 'Todos'
}

export interface AlumnoInscrito {
  ID_Alumno: string;
  Nombre_Completo: string;
  Fecha_Nacimiento: string;
  Genero: 'M' | 'F' | string;
  Nivel: string; // Kinder, Primaria Menor, Primaria Mayor, Secundaria, Preparatoria
  Grado: string; // 1, 2, 3...
  Grupo: string; // A, B, C...
  Ciclo_Escolar: string; // ej. 2026-2027
}

export interface RegistroAntropometrico {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Nombre_Alumno?: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Nombre_Maestro?: string;
  Edad: number;
  Peso_kg: number;
  Estatura_cm: number;
  IMC: number;
}

export interface RegistroAtletismo {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Nombre_Alumno?: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Nombre_Maestro?: string;
  Prueba: string; // 100m Velocidad, Salto de Longitud, etc.
  Resultado_Principal: string; // ej. "12.45 s", "4.85 m"
  Detalle_JSON_Vueltas?: string;
  Puntos?: number;
}

export interface RegistroCualitativo {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Nombre_Alumno?: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Nombre_Maestro?: string;
  Deporte_o_Prueba: string;
  Calificacion: string;
}

export interface UserSession {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  nivelAsignado?: string;
}

export interface MultiStudentRunner {
  student: AlumnoInscrito;
  lane: number;
  finishTimeMs?: number;
  finished: boolean;
  isUncompleted?: boolean;
}

export interface AdminTeacherActivity {
  idMaestro: string;
  nombreMaestro: string;
  totalRegistros: number;
  totalAntropometricos: number;
  totalAtletismo: number;
  totalCualitativos: number;
}

export interface AdminMetrics {
  totalAlumnos: number;
  totalMaestros: number;
  totalRegistrosAntro: number;
  totalRegistrosAtl: number;
  totalRegistrosCual: number;
  actividadMaestros: AdminTeacherActivity[];
  alumnosPorNivel: Record<string, number>;
}
