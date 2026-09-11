import { NextResponse } from 'next/server';
import { getAlumnosInscritos, getRegistrosAtletismo, getRegistrosCualitativos } from '@/lib/googleSheets';
import { parseSecondsFromFormattedTime, parseDistanceInMeters } from '@/lib/utils';
import { getPruebasByNivel } from '@/lib/pruebasNivel';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel') || 'Todos';
    const grado = searchParams.get('grado') || 'Todos';
    const grupo = searchParams.get('grupo') || 'Todos';
    const rama = searchParams.get('rama') || searchParams.get('genero') || 'Mixto';
    const pruebaParam = searchParams.get('prueba') || 'Todas';

    const [alumnos, registrosAtl, registrosCual] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    // Helper to resolve student by full name match first, then fallback to ID
    const getStudentForRecord = (r: { ID_Alumno?: string; Nombre_Alumno?: string }): typeof alumnos[0] | null => {
      const recName = (r.Nombre_Alumno || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (recName) {
        const foundByName = alumnos.find(
          (a) => (a.Nombre_Completo || '').trim().toLowerCase().replace(/\s+/g, ' ') === recName
        );
        if (foundByName) return foundByName;
      }
      if (r.ID_Alumno) {
        const foundById = alumnos.find((a) => a.ID_Alumno === r.ID_Alumno);
        if (foundById) return foundById;
      }
      return null;
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
    const isFilteredByGroup = nivel !== 'Todos' || grado !== 'Todos' || grupo !== 'Todos' || rama !== 'Mixto';

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

      // Find athletic records for this test
      const testAtlRecords = registrosAtl.filter((r) => {
        if (r.Resultado_Principal === 'No Completada') return false;

        const st = getStudentForRecord(r);
        if (!st) return false;

        if (isFilteredByGroup && !targetStudentsSet.has(st)) return false;

        const pName = (r.Prueba || '').toLowerCase().trim();

        if (cleanTestName.includes('50m') && pName.includes('50m')) return true;
        if (cleanTestName.includes('75m') && pName.includes('75m')) return true;
        if (cleanTestName.includes('100m') && pName.includes('100m')) return true;
        if (cleanTestName.includes('200m') && pName.includes('200m')) return true;
        if (cleanTestName.includes('400m') && pName.includes('400m')) return true;
        if (cleanTestName.includes('600m') && pName.includes('600m')) return true;
        if (cleanTestName.includes('800m') && pName.includes('800m')) return true;

        if (
          cleanTestName.includes('resistencia') &&
          pName.includes('resistencia') &&
          !pName.includes('200m') &&
          !pName.includes('400m') &&
          !pName.includes('600m') &&
          !pName.includes('800m')
        ) {
          const stNivel = getStudentNivelNormalized(st);
          const stGrado = (st.Grado || '').replace(/[^0-9]/g, '');
          if (cleanTestName.includes('200m') && (stNivel === 'kinder' || (stNivel === 'primaria menor' && (stGrado === '1' || stGrado === '2')))) return true;
          if (cleanTestName.includes('400m') && ((stNivel === 'primaria menor' && stGrado === '3') || (stNivel === 'primaria mayor' && stGrado === '4'))) return true;
          if (cleanTestName.includes('600m') && stNivel === 'primaria mayor' && (stGrado === '5' || stGrado === '6')) return true;
          if (cleanTestName.includes('800m') && (stNivel === 'secundaria' || stNivel === 'preparatoria')) return true;
        }

        if (cleanTestName === 'salto' && pName.includes('salto') && !pName.includes('cuerda')) return true;
        if (cleanTestName === 'lanzamiento' && pName.includes('lanzamiento')) return true;
        if (cleanTestName.includes('cuerda') && pName.includes('cuerda')) return true;
        if (cleanTestName.includes('orden') && pName.includes('orden')) return true;
        if (cleanTestName.includes('abc') && pName.includes('abc')) return true;

        return pName === cleanTestName;
      });

      // Find qualitative records if applicable
      const testCualRecords = (cleanTestName.includes('cuerda') || cleanTestName.includes('orden') || cleanTestName.includes('abc'))
        ? registrosCual.filter((r) => {
            const st = getStudentForRecord(r);
            if (!st) return false;
            if (isFilteredByGroup && !targetStudentsSet.has(st)) return false;

            const pName = (r.Deporte_o_Prueba || '').toLowerCase().trim();
            if (cleanTestName.includes('cuerda') && pName.includes('cuerda')) return true;
            if (cleanTestName.includes('orden') && pName.includes('orden')) return true;
            if (cleanTestName.includes('abc') && pName.includes('abc')) return true;
            return false;
          })
        : [];

      // Is time test (lower time is better)?
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

      // Best mark map per student (keyed by normalized full name for absolute uniqueness)
      const studentBestMap = new Map<string, { student: typeof alumnos[0]; result: string; numericVal: number; fecha: string }>();

      testAtlRecords.forEach((r) => {
        const st = getStudentForRecord(r);
        if (!st) return;

        const stKey = st.Nombre_Completo.trim().toLowerCase();
        const numVal = isTimeTest
          ? parseSecondsFromFormattedTime(r.Resultado_Principal)
          : parseDistanceInMeters(r.Resultado_Principal);

        const current = studentBestMap.get(stKey);
        if (!current) {
          studentBestMap.set(stKey, { student: st, result: r.Resultado_Principal, numericVal: numVal, fecha: r.Fecha || '' });
        } else {
          const isBetter = isTimeTest ? numVal < current.numericVal : numVal > current.numericVal;
          if (isBetter) {
            studentBestMap.set(stKey, { student: st, result: r.Resultado_Principal, numericVal: numVal, fecha: r.Fecha || '' });
          }
        }
      });

      testCualRecords.forEach((r) => {
        const st = getStudentForRecord(r);
        if (!st) return;
        const stKey = st.Nombre_Completo.trim().toLowerCase();
        if (!studentBestMap.has(stKey)) {
          studentBestMap.set(stKey, { student: st, result: r.Calificacion, numericVal: 1, fecha: r.Fecha || '' });
        }
      });

      // Sort students with marks from best to worst
      const rankedWithMarks = Array.from(studentBestMap.values()).sort((a, b) => {
        if (isTimeTest) return a.numericVal - b.numericVal;
        return b.numericVal - a.numericVal;
      });

      if (!isFilteredByGroup && nivel === 'Todos') {
        // Mode A: "Todos los Niveles" -> Return TOP 3 overall
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
        // Mode B: Specific Nivel, Grado, Grupo, or Rama selected -> Return ALL students of that group/grade/rama ordered best to worst
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

