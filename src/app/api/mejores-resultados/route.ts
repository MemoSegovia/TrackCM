import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  updateGrupoMejoresResultadosSheet,
  deleteRegistrosAlumno,
  updateStudentMarksRecords,
} from '@/lib/googleSheets';
import {
  calculateBestMarksForStudent,
  getNivelByGrupo,
  isStudentInGrupo,
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

    // Filter students for the requested group
    const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, targetGrupo));

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
    const { grupo, syncAll, cicloEscolar = '2026-2027', nombreMaestro = 'Prof. Educación Física' } = body;

    const [alumnos, atletismo, cualitativo] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    if (syncAll) {
      // Find all groups that have enrolled students
      const groupsWithStudents = PESTANIAS_GRUPOS_OFICIALES.filter((grp) =>
        alumnos.some((a) => isStudentInGrupo(a, grp))
      );

      let syncedCount = 0;
      for (const grp of groupsWithStudents) {
        const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, grp));
        const rowsData = groupStudents.map((st) =>
          calculateBestMarksForStudent(st, atletismo, cualitativo)
        );
        const ok = await updateGrupoMejoresResultadosSheet(
          grp,
          cicloEscolar,
          nombreMaestro,
          rowsData
        );
        if (ok) syncedCount++;
      }

      return NextResponse.json({
        success: true,
        synced: true,
        gruposSincronizados: syncedCount,
        totalGrupos: groupsWithStudents.length,
        message: `¡Se crearon y actualizaron exitosamente ${syncedCount} pestañas de grupo en Google Sheets!`,
      });
    }

    if (!grupo) {
      return NextResponse.json({ success: false, error: 'Se requiere el parámetro grupo' }, { status: 400 });
    }

    const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, grupo));

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, nombreAlumno, grupo, cicloEscolar = '2026-2027', nombreMaestro = 'Prof. Educación Física', marks } = body;

    if (!idAlumno || !nombreAlumno) {
      return NextResponse.json({ success: false, error: 'ID de alumno y nombre son requeridos' }, { status: 400 });
    }

    const ok = await updateStudentMarksRecords(idAlumno, nombreAlumno, cicloEscolar, nombreMaestro, marks || {});
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Error al actualizar las marcas en Google Sheets' }, { status: 500 });
    }

    // Re-fetch updated data and update group tab in Google Sheets
    const [alumnos, atletismo, cualitativo] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, grupo));
    const updatedRows = groupStudents.map((st) =>
      calculateBestMarksForStudent(st, atletismo, cualitativo)
    );

    await updateGrupoMejoresResultadosSheet(
      grupo,
      cicloEscolar,
      nombreMaestro,
      updatedRows
    );

    return NextResponse.json({
      success: true,
      message: `¡Resultados de ${nombreAlumno} actualizados y sincronizados con Google Sheets!`,
      rows: updatedRows,
    });
  } catch (error) {
    console.error('Error in PUT /api/mejores-resultados:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar la actualización' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, nombreAlumno, grupo, cicloEscolar = '2026-2027', nombreMaestro = 'Prof. Educación Física' } = body;

    if (!idAlumno || !nombreAlumno) {
      return NextResponse.json({ success: false, error: 'ID de alumno y nombre son requeridos' }, { status: 400 });
    }

    const ok = await deleteRegistrosAlumno(idAlumno, nombreAlumno);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Error al borrar los registros en Google Sheets' }, { status: 500 });
    }

    // Re-fetch updated data and update group tab in Google Sheets
    const [alumnos, atletismo, cualitativo] = await Promise.all([
      getAlumnosInscritos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, grupo));
    const updatedRows = groupStudents.map((st) =>
      calculateBestMarksForStudent(st, atletismo, cualitativo)
    );

    await updateGrupoMejoresResultadosSheet(
      grupo,
      cicloEscolar,
      nombreMaestro,
      updatedRows
    );

    return NextResponse.json({
      success: true,
      message: `¡Registros de ${nombreAlumno} eliminados y sincronizados con Google Sheets!`,
      rows: updatedRows,
    });
  } catch (error) {
    console.error('Error in DELETE /api/mejores-resultados:', error);
    return NextResponse.json({ success: false, error: 'Error al procesar la eliminación' }, { status: 500 });
  }
}

