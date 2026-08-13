export type RolUsuario = 'Maestro' | 'Alumno';

export interface Usuario {
  ID_Usuario: string;
  Nombre: string;
  Correo: string;
  Password?: string;
  Rol: RolUsuario;
  Nivel_Asignado: string;
}

export interface AlumnoInscrito {
  ID_Alumno: string;
  Nombre_Completo: string;
  Fecha_Nacimiento: string;
  Genero: 'M' | 'F' | string;
  Nivel: string; // Primaria, Secundaria, Preparatoria
  Grado: string; // 1, 2, 3...
  Grupo: string; // A, B, C...
  Ciclo_Escolar: string; // ej. 2026-2027
}

export interface RegistroAntropometrico {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Edad: number;
  Peso_kg: number;
  Estatura_cm: number;
  IMC: number;
}

export interface RegistroAtletismo {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Prueba: string; // 100m, 400m, 800m, Salto de Longitud, Lanzamiento de Bala, etc.
  Resultado_Principal: string; // ej. "12.45 s", "4.85 m", "9.20 m"
  Detalle_JSON_Vueltas?: string; // JSON string for laps or attempts breakdown
  Puntos?: number;
}

export interface RegistroCualitativo {
  ID_Registro: string;
  Fecha: string;
  ID_Alumno: string;
  Ciclo_Escolar: string;
  ID_Maestro: string;
  Deporte_o_Prueba: string; // Básquetbol, Fútbol, Voleibol, Trabajo en equipo
  Calificacion: string; // Excelente, Muy Bueno, En Proceso, 9.5, etc.
}

export interface UserSession {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  nivelAsignado?: string;
}

export interface MetricSummary {
  totalAlumnos: number;
  totalRegistros: number;
  promedioIMC: number;
  mejorTiempo100m?: string;
}
