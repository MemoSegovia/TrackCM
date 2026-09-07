import { NextResponse } from 'next/server';
import { getAlumnosInscritos, getRegistrosAtletismo, getRegistrosCualitativos } from '@/lib/googleSheets';
import { parseSecondsFromFormattedTime, parseDistanceInMeters } from '@/lib/utils';
import { getPruebasByNivel } from '@/lib/pruebasNivel';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel') || 'Todos';
    const grado = searchParams.get('grado') || 'Todos';
    const grupo = searchParams.get('grupo') || 'Todos';
    const pruebaParam = searchParams.get('prueba') || 'Todas';

    const [alumnos, registrosAtl, registrosCual] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    // 1. Filter students according to Nivel, Grado, Grupo
    const targetStudents = alumnos.filter((a) => {
      if (nivel !== 'Todos') {
        const rawN = (a.Nivel || '').toLowerCase().trim();
        const targetN = nivel.toLowerCase().trim();
        if (!rawN.includes(targetN) && !targetN.includes(rawN)) return false;
      }

      if (grado !== 'Todos') {
        const cleanStudentGrado = (a.Grado || '').replace(/[^0-9]/g, '');
        if (cleanStudentGrado !== grado) return false;
      }

      if (grupo !== 'Todos') {
        const cleanStudentGrupo = (a.Grupo || '').trim().toUpperCase();
        if (cleanStudentGrupo !== grupo.trim().toUpperCase()) return false;
      }

      return true;
    });

    const targetStudentIds = new Set(targetStudents.map((s) => s.ID_Alumno));
    const targetStudentNames = new Set(targetStudents.map((s) => s.Nombre_Completo.trim().toLowerCase()));

    const isStudentMatch = (r: { ID_Alumno?: string; Nombre_Alumno?: string }) => {
      if (r.ID_Alumno && targetStudentIds.has(r.ID_Alumno)) return true;
      if (r.Nombre_Alumno && targetStudentNames.has(r.Nombre_Alumno.trim().toLowerCase())) return true;
      return false;
    };

    const isFilteredByGroup = nivel !== 'Todos' || grado !== 'Todos' || grupo !== 'Todos';

    // Determine target test list
    let targetPruebas: string[] = [];

    if (pruebaParam !== 'Todas') {
      targetPruebas = [pruebaParam];
    } else if (nivel !== 'Todos') {
      targetPruebas = getPruebasByNivel(nivel).map((p) => p.value);
    } else {
      targetPruebas = [
        '50m Velocidad',
        '75m Velocidad',
        '100m Velocidad',
        '200m Resistencia',
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
        if (isFilteredByGroup && !isStudentMatch(r)) return false;

        const pName = (r.Prueba || '').toLowerCase().trim();

        if (cleanTestName.includes('50m') && pName.includes('50m')) return true;
        if (cleanTestName.includes('75m') && pName.includes('75m')) return true;
        if (cleanTestName.includes('100m') && pName.includes('100m')) return true;
        if (cleanTestName.includes('200m') && (pName.includes('200m') || pName.includes('resistencia'))) return true;
        if (cleanTestName.includes('600m') && pName.includes('600m')) return true;
        if (cleanTestName.includes('800m') && pName.includes('800m')) return true;
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
            if (isFilteredByGroup && !isStudentMatch(r)) return false;
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
        cleanTestName.includes('600m') ||
        cleanTestName.includes('800m') ||
        cleanTestName.includes('velocidad') ||
        cleanTestName.includes('resistencia');

      // Best mark map per student
      const studentBestMap = new Map<string, { student: typeof alumnos[0]; result: string; numericVal: number; fecha: string }>();

      testAtlRecords.forEach((r) => {
        const st = alumnos.find((a) => a.ID_Alumno === r.ID_Alumno || a.Nombre_Completo.trim().toLowerCase() === (r.Nombre_Alumno || '').trim().toLowerCase());
        if (!st) return;

        const numVal = isTimeTest
          ? parseSecondsFromFormattedTime(r.Resultado_Principal)
          : parseDistanceInMeters(r.Resultado_Principal);

        const current = studentBestMap.get(st.ID_Alumno);
        if (!current) {
          studentBestMap.set(st.ID_Alumno, { student: st, result: r.Resultado_Principal, numericVal: numVal, fecha: r.Fecha || '' });
        } else {
          const isBetter = isTimeTest ? numVal < current.numericVal : numVal > current.numericVal;
          if (isBetter) {
            studentBestMap.set(st.ID_Alumno, { student: st, result: r.Resultado_Principal, numericVal: numVal, fecha: r.Fecha || '' });
          }
        }
      });

      testCualRecords.forEach((r) => {
        const st = alumnos.find((a) => a.ID_Alumno === r.ID_Alumno || a.Nombre_Completo.trim().toLowerCase() === (r.Nombre_Alumno || '').trim().toLowerCase());
        if (!st) return;
        if (!studentBestMap.has(st.ID_Alumno)) {
          studentBestMap.set(st.ID_Alumno, { student: st, result: r.Calificacion, numericVal: 1, fecha: r.Fecha || '' });
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
        // Mode B: Specific Nivel, Grado, or Grupo selected -> Return ALL students of that group/grade ordered best to worst
        const resultList: Array<any> = [];

        rankedWithMarks.forEach((item, index) => {
          resultList.push({
            posicion: index + 1,
            idRegistro: item.student.ID_Alumno,
            idAlumno: item.student.ID_Alumno,
            nombreAlumno: item.student.Nombre_Completo,
            nivel: item.student.Nivel,
            grado: item.student.Grado,
            grupo: item.student.Grupo,
            resultado: item.result,
            fecha: item.fecha,
          });
        });

        const studentWithMarkIds = new Set(rankedWithMarks.map((item) => item.student.ID_Alumno));
        const studentsWithoutMarks = targetStudents.filter((st) => !studentWithMarkIds.has(st.ID_Alumno));

        studentsWithoutMarks.forEach((st) => {
          resultList.push({
            posicion: null,
            idRegistro: st.ID_Alumno,
            idAlumno: st.ID_Alumno,
            nombreAlumno: st.Nombre_Completo,
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
