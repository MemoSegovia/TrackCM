import { NextResponse } from 'next/server';
import { getAlumnosInscritos, getRegistrosAtletismo } from '@/lib/googleSheets';
import { parseSecondsFromFormattedTime, parseDistanceInMeters } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const grupo = searchParams.get('grupo');

    const [alumnos, registros] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
    ]);

    const alumnosMap = new Map(alumnos.map((a) => [a.ID_Alumno, a]));

    // Filter athletic records based on student level/grado/grupo if provided
    const filteredRecords = registros.filter((reg) => {
      const student = alumnosMap.get(reg.ID_Alumno);
      if (!student) return true;

      if (nivel && nivel !== 'Todos' && student.Nivel !== nivel) return false;
      if (grado && grado !== 'Todos' && student.Grado !== grado) return false;
      if (grupo && grupo !== 'Todos' && student.Grupo !== grupo) return false;

      return true;
    });

    // Group records by Prueba
    const pruebaMap = new Map<string, Array<{ record: typeof registros[0]; student: typeof alumnos[0] | null }>>();

    filteredRecords.forEach((reg) => {
      const student = alumnosMap.get(reg.ID_Alumno) || null;
      if (!pruebaMap.has(reg.Prueba)) {
        pruebaMap.set(reg.Prueba, []);
      }
      pruebaMap.get(reg.Prueba)!.push({ record: reg, student });
    });

    const leaderboards: Record<string, Array<any>> = {};

    pruebaMap.forEach((items, pruebaName) => {
      // Sort logic depends on test type (times ascending, jumps/throws descending)
      const isTimeTest = pruebaName.toLowerCase().includes('100m') ||
        pruebaName.toLowerCase().includes('400m') ||
        pruebaName.toLowerCase().includes('800m') ||
        pruebaName.toLowerCase().includes('velocidad') ||
        pruebaName.toLowerCase().includes('carrera');

      const sorted = [...items].sort((a, b) => {
        if (isTimeTest) {
          const valA = parseSecondsFromFormattedTime(a.record.Resultado_Principal);
          const valB = parseSecondsFromFormattedTime(b.record.Resultado_Principal);
          return valA - valB; // lower time is better
        } else {
          const valA = parseDistanceInMeters(a.record.Resultado_Principal);
          const valB = parseDistanceInMeters(b.record.Resultado_Principal);
          return valB - valA; // higher distance is better
        }
      });

      // Take top 3 best performances (one best per student)
      const seenStudents = new Set<string>();
      const top3: Array<any> = [];

      for (const item of sorted) {
        if (!seenStudents.has(item.record.ID_Alumno)) {
          seenStudents.add(item.record.ID_Alumno);
          top3.push({
            posicion: top3.length + 1,
            idRegistro: item.record.ID_Registro,
            idAlumno: item.record.ID_Alumno,
            nombreAlumno: item.student ? item.student.Nombre_Completo : 'Alumno ' + item.record.ID_Alumno,
            nivel: item.student?.Nivel || 'N/A',
            grado: item.student?.Grado || 'N/A',
            grupo: item.student?.Grupo || 'N/A',
            resultado: item.record.Resultado_Principal,
            fecha: item.record.Fecha,
          });
          if (top3.length === 3) break;
        }
      }

      leaderboards[pruebaName] = top3;
    });

    return NextResponse.json({
      success: true,
      leaderboards,
    });
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar tabla de posiciones' },
      { status: 500 }
    );
  }
}
