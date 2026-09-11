import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  getGroupTabsRecordsBatch,
  GroupTabMarkRecord,
} from '@/lib/googleSheets';
import { parseSecondsFromFormattedTime, parseDistanceInMeters } from '@/lib/utils';
import { getPruebasByNivel } from '@/lib/pruebasNivel';
import { AlumnoInscrito } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeNivel(n?: string): string {
  if (!n) return '';
  const clean = n.toLowerCase().trim();
  if (clean.includes('kinder')) return 'kinder';
  if (clean.includes('primaria menor')) return 'primaria menor';
  if (clean.includes('primaria mayor')) return 'primaria mayor';
  if (clean.includes('secundaria')) return 'secundaria';
  if (clean.includes('preparatoria') || clean.includes('prepa') || clean.includes('bachillerato')) return 'preparatoria';
  if (clean.includes('primaria')) return 'primaria';
  return clean;
}

function getStudentNivelNormalized(a: { Nivel?: string; Grado?: string }): string {
  const norm = normalizeNivel(a.Nivel);
  if (norm === 'primaria') {
    const cleanG = (a.Grado || '').replace(/[^0-9]/g, '');
    const numG = parseInt(cleanG, 10);
    if (numG >= 1 && numG <= 3) return 'primaria menor';
    if (numG >= 4 && numG <= 6) return 'primaria mayor';
  }
  return norm;
}

function normalizeTokens(nameStr?: string): Set<string> {
  if (!nameStr) return new Set();
  return new Set(
    nameStr
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/,/g, ' ')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

function matchesStudent(
  record: { ID_Alumno?: string; Nombre_Alumno?: string; nombreAlumno?: string },
  student: AlumnoInscrito
): boolean {
  if (!record || !student) return false;
  if (record.ID_Alumno && student.ID_Alumno && String(record.ID_Alumno).trim() === String(student.ID_Alumno).trim()) {
    return true;
  }
  const recName = record.Nombre_Alumno || record.nombreAlumno || '';
  const recTokens = normalizeTokens(recName);
  const stTokens = normalizeTokens(student.Nombre_Completo);

  if (recTokens.size > 0 && stTokens.size > 0) {
    let overlap = 0;
    recTokens.forEach((t) => {
      if (stTokens.has(t)) overlap++;
    });
    const minTokens = Math.min(recTokens.size, stTokens.size);
    if (overlap >= 2 && overlap >= minTokens - 1) {
      return true;
    }
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel') || 'Todos';
    const grado = searchParams.get('grado') || 'Todos';
    const grupo = searchParams.get('grupo') || 'Todos';
    const rama = searchParams.get('rama') || searchParams.get('genero') || 'Mixto';
    const pruebaParam = searchParams.get('prueba') || 'Todas';

    const [alumnos, registrosAtl, registrosCual, groupTabRecords] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
      getGroupTabsRecordsBatch(),
    ]);

    // Cache student lookup helper
    const studentMatchCache = new Map<string, AlumnoInscrito | null>();
    const getStudentForRecord = (r: { ID_Alumno?: string; Nombre_Alumno?: string; nombreAlumno?: string }): AlumnoInscrito | null => {
      const key = `${r.ID_Alumno || ''}_${r.Nombre_Alumno || r.nombreAlumno || ''}`;
      if (studentMatchCache.has(key)) return studentMatchCache.get(key)!;
      const found = alumnos.find((a) => matchesStudent(r, a));
      studentMatchCache.set(key, found || null);
      return found || null;
    };

    // 1. Filter students according to Nivel, Grado, Grupo, Rama/Genero
    const targetStudents = alumnos.filter((a) => {
      if (nivel !== 'Todos') {
        const studentNivel = getStudentNivelNormalized(a);
        const targetNivel = normalizeNivel(nivel);
        if (studentNivel !== targetNivel) return false;
      }

      if (grado !== 'Todos') {
        const cleanStudentGrado = (a.Grado || '').replace(/[^0-9]/g, '');
        const cleanTargetGrado = grado.replace(/[^0-9]/g, '');
        if (cleanStudentGrado !== cleanTargetGrado) return false;
      }

      if (grupo !== 'Todos') {
        const cleanStudentGrupo = (a.Grupo || '').trim().toUpperCase();
        if (cleanStudentGrupo !== grupo.trim().toUpperCase()) return false;
      }

      if (rama !== 'Mixto' && rama !== 'Todos') {
        const g = (a.Genero || '').trim().toUpperCase();
        const isFemale = g === 'F' || g === 'FEMENINO' || g === 'MUJER' || g === 'FEMENIL';
        if (rama === 'Varonil' && isFemale) return false;
        if (rama === 'Femenil' && !isFemale) return false;
      }

      return true;
    });

    const targetStudentsSet = new Set(targetStudents);
    const isFilteredGroup = nivel !== 'Todos' || grado !== 'Todos' || grupo !== 'Todos' || rama !== 'Mixto';

    // Determine target test list
    let targetPruebas: string[] = [];

    if (pruebaParam !== 'Todas') {
      targetPruebas = [pruebaParam];
    } else if (nivel !== 'Todos') {
      targetPruebas = getPruebasByNivel(nivel, grado !== 'Todos' ? grado : undefined).map((p) => p.value);
    } else {
      targetPruebas = [
        '50m Velocidad',
        '75m Velocidad',
        '100m Velocidad',
        '200m Resistencia',
        '400m Resistencia',
        '600m Resistencia',
        '800m Resistencia',
        'Salto',
        'Lanzamiento',
        'Salto de Cuerda',
        'Orden y Control',
        'ABC',
      ];
    }

    const leaderboards: Record<string, Array<any>> = {};

    for (const testName of targetPruebas) {
      const cleanTestName = testName.toLowerCase().trim();

      const isTimeTest =
        cleanTestName.includes('50m') ||
        cleanTestName.includes('75m') ||
        cleanTestName.includes('100m') ||
        cleanTestName.includes('200m') ||
        cleanTestName.includes('400m') ||
        cleanTestName.includes('600m') ||
        cleanTestName.includes('800m') ||
        cleanTestName.includes('velocidad') ||
        cleanTestName.includes('resistencia');

      const isDistanceTest = cleanTestName.includes('salto') || cleanTestName.includes('lanzamiento');

      const studentBestMap = new Map<string, { student: AlumnoInscrito; result: string; numericVal: number; fecha: string }>();

      const updateStudentMark = (student: AlumnoInscrito, resultStr: string, fechaStr: string = '') => {
        if (!resultStr || resultStr === '-' || resultStr === 'No Completada') return;
        if (!targetStudentsSet.has(student)) return;

        const stKey = student.Nombre_Completo.trim().toLowerCase();
        let numVal = 0;
        if (isTimeTest) {
          numVal = parseSecondsFromFormattedTime(resultStr);
        } else if (isDistanceTest) {
          numVal = parseDistanceInMeters(resultStr);
        } else {
          numVal = 1;
        }

        const current = studentBestMap.get(stKey);
        if (!current) {
          studentBestMap.set(stKey, { student, result: resultStr, numericVal: numVal, fecha: fechaStr });
        } else {
          let isBetter = false;
          if (isTimeTest) isBetter = numVal < current.numericVal;
          else if (isDistanceTest) isBetter = numVal > current.numericVal;

          if (isBetter) {
            studentBestMap.set(stKey, { student, result: resultStr, numericVal: numVal, fecha: fechaStr });
          }
        }
      };

      // 1. Evaluate Sheet 2 Group Tabs records
      groupTabRecords.forEach((gtRec) => {
        const st = getStudentForRecord(gtRec);
        if (!st) return;

        let markVal = '-';
        if (cleanTestName.includes('50m') || cleanTestName.includes('75m') || cleanTestName.includes('100m') || cleanTestName.includes('velocidad')) {
          markVal = gtRec.velocidad;
        } else if (cleanTestName.includes('200m') || cleanTestName.includes('400m') || cleanTestName.includes('600m') || cleanTestName.includes('800m') || cleanTestName.includes('resistencia')) {
          markVal = gtRec.resistencia;
        } else if (cleanTestName === 'salto') {
          markVal = gtRec.salto;
        } else if (cleanTestName === 'lanzamiento') {
          markVal = gtRec.lanzamiento;
        } else if (cleanTestName.includes('cuerda')) {
          markVal = gtRec.cuerda;
        } else if (cleanTestName.includes('orden')) {
          markVal = gtRec.ordenYControl;
        } else if (cleanTestName.includes('abc')) {
          markVal = gtRec.abc;
        }

        updateStudentMark(st, markVal, '');
      });

      // 2. Evaluate Sheet 1 Atletismo Records
      registrosAtl.forEach((r) => {
        const st = getStudentForRecord(r);
        if (!st) return;

        const pName = (r.Prueba || '').toLowerCase().trim();
        let matchesThisTest = false;

        if (cleanTestName.includes('50m') && pName.includes('50m')) matchesThisTest = true;
        else if (cleanTestName.includes('75m') && pName.includes('75m')) matchesThisTest = true;
        else if (cleanTestName.includes('100m') && pName.includes('100m')) matchesThisTest = true;
        else if (cleanTestName.includes('200m') && pName.includes('200m')) matchesThisTest = true;
        else if (cleanTestName.includes('400m') && (pName.includes('400m') || pName.includes('planos'))) matchesThisTest = true;
        else if (cleanTestName.includes('600m') && pName.includes('600m')) matchesThisTest = true;
        else if (cleanTestName.includes('800m') && (pName.includes('800m') || pName.includes('medio fondo'))) matchesThisTest = true;
        else if (cleanTestName === 'salto' && pName.includes('salto') && !pName.includes('cuerda')) matchesThisTest = true;
        else if (cleanTestName === 'lanzamiento' && pName.includes('lanzamiento')) matchesThisTest = true;
        else if (cleanTestName.includes('cuerda') && pName.includes('cuerda')) matchesThisTest = true;
        else if (cleanTestName.includes('orden') && pName.includes('orden')) matchesThisTest = true;
        else if (cleanTestName.includes('abc') && pName.includes('abc')) matchesThisTest = true;

        if (matchesThisTest) {
          updateStudentMark(st, r.Resultado_Principal, r.Fecha || '');
        }
      });

      // 3. Evaluate Sheet 1 Cualitativo Records
      if (cleanTestName.includes('cuerda') || cleanTestName.includes('orden') || cleanTestName.includes('abc')) {
        registrosCual.forEach((r) => {
          const st = getStudentForRecord(r);
          if (!st) return;

          const pName = (r.Deporte_o_Prueba || '').toLowerCase().trim();
          let matchesThisTest = false;

          if (cleanTestName.includes('cuerda') && pName.includes('cuerda')) matchesThisTest = true;
          else if (cleanTestName.includes('orden') && pName.includes('orden')) matchesThisTest = true;
          else if (cleanTestName.includes('abc') && pName.includes('abc')) matchesThisTest = true;

          if (matchesThisTest) {
            updateStudentMark(st, r.Calificacion, r.Fecha || '');
          }
        });
      }

      // Sort ranked students from best to worst
      const rankedWithMarks = Array.from(studentBestMap.values()).sort((a, b) => {
        if (isTimeTest) return a.numericVal - b.numericVal;
        if (isDistanceTest) return b.numericVal - a.numericVal;
        return 0;
      });

      if (!isFilteredGroup && nivel === 'Todos') {
        // Mode A: "Todos los Niveles" -> Return TOP 3 overall per test
        const top3 = rankedWithMarks.slice(0, 3).map((item, index) => ({
          posicion: index + 1,
          idRegistro: item.student.ID_Alumno + '_' + index,
          idAlumno: item.student.ID_Alumno,
          nombreAlumno: item.student.Nombre_Completo,
          genero: item.student.Genero,
          nivel: item.student.Nivel,
          grado: item.student.Grado,
          grupo: item.student.Grupo,
          resultado: item.result,
          fecha: item.fecha,
        }));

        if (top3.length > 0) {
          leaderboards[testName] = top3;
        }
      } else {
        // Mode B: Specific Nivel, Grado, Grupo, or Rama selected -> Return ALL students of that filtered group
        const resultList: Array<any> = [];

        rankedWithMarks.forEach((item, index) => {
          resultList.push({
            posicion: index + 1,
            idRegistro: item.student.ID_Alumno,
            idAlumno: item.student.ID_Alumno,
            nombreAlumno: item.student.Nombre_Completo,
            genero: item.student.Genero,
            nivel: item.student.Nivel,
            grado: item.student.Grado,
            grupo: item.student.Grupo,
            resultado: item.result,
            fecha: item.fecha,
          });
        });

        const studentWithMarkNames = new Set(rankedWithMarks.map((item) => item.student.Nombre_Completo.trim().toLowerCase()));
        const studentsWithoutMarks = targetStudents.filter((st) => !studentWithMarkNames.has(st.Nombre_Completo.trim().toLowerCase()));

        studentsWithoutMarks.forEach((st) => {
          resultList.push({
            posicion: null,
            idRegistro: st.ID_Alumno,
            idAlumno: st.ID_Alumno,
            nombreAlumno: st.Nombre_Completo,
            genero: st.Genero,
            nivel: st.Nivel,
            grado: st.Grado,
            grupo: st.Grupo,
            resultado: 'Sin marca',
            fecha: '',
          });
        });

        if (resultList.length > 0) {
          leaderboards[testName] = resultList;
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboards,
      totalStudentsCount: targetStudents.length,
    });
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar tabla de posiciones' },
      { status: 500 }
    );
  }
}


