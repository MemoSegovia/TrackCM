import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  updateGrupoMejoresResultadosSheet,
} from '@/lib/googleSheets';
import {
  calculateBestMarksForStudent,
  getNivelByGrupo,
  PESTANIAS_GRUPOS_OFICIALES,
} from '@/lib/mejoresResultados';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetGrupo = searchParams.get('grupo') || '1A';
    const cicloEscolar = searchParams.get('ciclo') || '2026-2027';

    const [alumnos, atletismo, cualitativo] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    // Filter students for the requested group (case-insensitive)
    const groupStudents = alumnos.filter(
      (a) => (a.Grupo || '').trim().toUpperCase() === targetGrupo.trim().toUpperCase()
    );

    const rows = groupStudents.map((st) =>
      calculateBestMarksForStudent(st, atletismo, cualitativo)
    );

    const nivel = getNivelByGrupo(targetGrupo);

    return NextResponse.json({
      success: true,
      grupo: targetGrupo,
      nivel,
      cicloEscolar,
      materia: 'Educación Física',
      profesor: 'Profesor de Educación Física',
      totalAlumnos: rows.length,
      rows,
      pestañasDisponibles: PESTANIAS_GRUPOS_OFICIALES,
    });
  } catch (error) {
    console.error('Error fetching mejores resultados:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud de mejores resultados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grupo, cicloEscolar = '2026-2027', nombreMaestro = 'Prof. Educación Física' } = body;

    if (!grupo) {
      return NextResponse.json({ success: false, error: 'Se requiere el parámetro grupo' }, { status: 400 });
    }

    const [alumnos, atletismo, cualitativo] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const groupStudents = alumnos.filter(
      (a) => (a.Grupo || '').trim().toUpperCase() === grupo.trim().toUpperCase()
    );

    const rowsData = groupStudents.map((st) =>
      calculateBestMarksForStudent(st, atletismo, cualitativo)
    );

    const synced = await updateGrupoMejoresResultadosSheet(
      grupo,
      cicloEscolar,
      nombreMaestro,
      rowsData
    );

    return NextResponse.json({
      success: true,
      synced,
      grupo,
      registrosActualizados: rowsData.length,
      message: `Pestaña "${grupo}" actualizada exitosamente en Google Sheets`,
    });
  } catch (error) {
    console.error('Error syncing mejores resultados to Google Sheets:', error);
    return NextResponse.json(
      { success: false, error: 'Error de conexión con Google Sheets' },
      { status: 500 }
    );
  }
}
