import { AlumnoInscrito, RegistroAtletismo, RegistroCualitativo } from './types';
import { parseSecondsFromFormattedTime, parseDistanceInMeters } from './utils';

export const PESTANIAS_GRUPOS_OFICIALES = [
  // Kinder
  'K1', 'K2', 'K3',
  // Primaria Menor
  '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C',
  // Primaria Mayor
  '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C',
  // Secundaria
  '7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C',
  // Preparatoria
  '10A', '10B', '10C', '10D', '10E', '11A', '11B', '12A', '12B', '12C', '12D',
] as const;

export function getNivelByGrupo(grupoName: string): string {
  const g = (grupoName || '').trim().toUpperCase();
  if (['K1', 'K2', 'K3'].includes(g)) return 'Kinder';
  if (['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'].includes(g)) return 'Primaria Menor';
  if (['4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C'].includes(g)) return 'Primaria Mayor';
  if (['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'].includes(g)) return 'Secundaria';
  if (['10A', '10B', '10C', '10D', '10E', '11A', '11B', '12A', '12B', '12C', '12D'].includes(g)) return 'Preparatoria';
  return 'General';
}

export function formatGender(genero: string): 'M' | 'F' {
  if (!genero) return 'M';
  const clean = genero.trim().toUpperCase();
  if (clean === 'F' || clean === 'FEMENINO' || clean === 'MUJER') return 'F';
  return 'M';
}

export interface StudentBestMarksRow {
  idAlumno: string;
  nombreAlumno: string;
  generoMF: 'M' | 'F';
  velocidad: string;
  salto: string;
  lanzamiento: string;
  resistencia: string;
  cuerda: string;
  ordenYControl: string;
  abc: string;
}

export function calculateBestMarksForStudent(
  student: AlumnoInscrito,
  atletismoRecords: RegistroAtletismo[],
  cualitativoRecords: RegistroCualitativo[]
): StudentBestMarksRow {
  const studentAtl = atletismoRecords.filter((r) => r.ID_Alumno === student.ID_Alumno);
  const studentCual = cualitativoRecords.filter((r) => r.ID_Alumno === student.ID_Alumno);

  // 1. Velocidad (50m, 75m, 100m, 200m, 400m, Velocidad)
  const velRecs = studentAtl.filter(
    (r) =>
      r.Resultado_Principal !== 'No Completada' &&
      (r.Prueba.toLowerCase().includes('velocidad') ||
        r.Prueba.toLowerCase().includes('50m') ||
        r.Prueba.toLowerCase().includes('75m') ||
        r.Prueba.toLowerCase().includes('100m') ||
        r.Prueba.toLowerCase().includes('200m') ||
        r.Prueba.toLowerCase().includes('400m'))
  );
  let bestVel = '-';
  if (velRecs.length > 0) {
    let minTime = Infinity;
    velRecs.forEach((r) => {
      const s = parseSecondsFromFormattedTime(r.Resultado_Principal);
      if (s < minTime) {
        minTime = s;
        bestVel = r.Resultado_Principal;
      }
    });
  }

  // 2. Salto (Longitud, Alto)
  const saltoRecs = studentAtl.filter(
    (r) => r.Resultado_Principal !== 'No Completada' && r.Prueba.toLowerCase().includes('salto')
  );
  let bestSalto = '-';
  if (saltoRecs.length > 0) {
    let maxDist = -1;
    saltoRecs.forEach((r) => {
      const d = parseDistanceInMeters(r.Resultado_Principal);
      if (d > maxDist) {
        maxDist = d;
        bestSalto = r.Resultado_Principal;
      }
    });
  }

  // 3. Lanzamiento (Bala, Disco, Jabalina)
  const lanzRecs = studentAtl.filter(
    (r) => r.Resultado_Principal !== 'No Completada' && r.Prueba.toLowerCase().includes('lanzamiento')
  );
  let bestLanz = '-';
  if (lanzRecs.length > 0) {
    let maxDist = -1;
    lanzRecs.forEach((r) => {
      const d = parseDistanceInMeters(r.Resultado_Principal);
      if (d > maxDist) {
        maxDist = d;
        bestLanz = r.Resultado_Principal;
      }
    });
  }

  // 4. Resistencia (800m, 1500m, Pruebas de Resistencia, Fondo, Vueltas)
  const resRecs = studentAtl.filter(
    (r) =>
      r.Resultado_Principal !== 'No Completada' &&
      (r.Prueba.toLowerCase().includes('resistencia') ||
        r.Prueba.toLowerCase().includes('800m') ||
        r.Prueba.toLowerCase().includes('1500m') ||
        r.Prueba.toLowerCase().includes('fondo') ||
        r.Prueba.toLowerCase().includes('vueltas'))
  );
  let bestRes = '-';
  if (resRecs.length > 0) {
    let minTime = Infinity;
    resRecs.forEach((r) => {
      const s = parseSecondsFromFormattedTime(r.Resultado_Principal);
      if (s < minTime) {
        minTime = s;
        bestRes = r.Resultado_Principal;
      }
    });
  }

  // 5. Cuerda (Salto de Cuerda)
  const cuerdaAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('cuerda'));
  const cuerdaCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('cuerda'));
  let bestCuerda = '-';
  if (cuerdaAtl.length > 0) {
    bestCuerda = cuerdaAtl[0].Resultado_Principal;
  } else if (cuerdaCual.length > 0) {
    bestCuerda = cuerdaCual[0].Calificacion;
  }

  // 6. Orden y Control
  const ordenAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('orden'));
  const ordenCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('orden'));
  let bestOrden = '-';
  if (ordenAtl.length > 0) {
    bestOrden = ordenAtl[0].Resultado_Principal;
  } else if (ordenCual.length > 0) {
    bestOrden = ordenCual[0].Calificacion;
  }

  // 7. ABC (ABC Atletismo)
  const abcAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('abc'));
  const abcCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('abc'));
  let bestABC = '-';
  if (abcAtl.length > 0) {
    bestABC = abcAtl[0].Resultado_Principal;
  } else if (abcCual.length > 0) {
    bestABC = abcCual[0].Calificacion;
  }

  return {
    idAlumno: student.ID_Alumno,
    nombreAlumno: student.Nombre_Completo,
    generoMF: formatGender(student.Genero),
    velocidad: bestVel,
    salto: bestSalto,
    lanzamiento: bestLanz,
    resistencia: bestRes,
    cuerda: bestCuerda,
    ordenYControl: bestOrden,
    abc: bestABC,
  };
}
