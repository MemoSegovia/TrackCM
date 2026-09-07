import { NextResponse } from 'next/server';
import {
  addRegistroAtletismo,
  deleteRegistroAtletismo,
  getAlumnosInscritos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  getUsuarios,
  updateGrupoMejoresResultadosSheet,
} from '@/lib/googleSheets';
import { calculateBestMarksForStudent, isStudentInGrupo } from '@/lib/mejoresResultados';
import { generateRecordId, getCurrentDateISO } from '@/lib/utils';
import { RegistroAtletismo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, cicloEscolar, idMaestro, prueba, resultadoPrincipal, detalleJsonVueltas, puntos, nombreAlumno, nombreMaestro } = body;

    if (!idAlumno || !prueba || !resultadoPrincipal) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (Alumno, Prueba o Resultado)' },
        { status: 400 }
      );
    }

    const [alumnos, usuarios] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
    ]);

    const cleanNombre = (nombreAlumno || '').trim().toLowerCase();
    const stObj =
      (cleanNombre
        ? alumnos.find((a) => a.Nombre_Completo.trim().toLowerCase() === cleanNombre)
        : null) || alumnos.find((a) => a.ID_Alumno === idAlumno);
    const tchObj = usuarios.find((u) => u.ID_Usuario === idMaestro);

    const record: RegistroAtletismo = {
      ID_Registro: generateRecordId('ATL'),
      Fecha: getCurrentDateISO(),
      ID_Alumno: idAlumno,
      Nombre_Alumno: nombreAlumno || (stObj ? stObj.Nombre_Completo : ''),
      Ciclo_Escolar: cicloEscolar || '2026-2027',
      ID_Maestro: idMaestro || 'USR-MAESTRO',
      Nombre_Maestro: nombreMaestro || (tchObj ? tchObj.Nombre : ''),
      Prueba: prueba,
      Resultado_Principal: resultadoPrincipal,
      Detalle_JSON_Vueltas: typeof detalleJsonVueltas === 'object' ? JSON.stringify(detalleJsonVueltas) : (detalleJsonVueltas || ''),
      Puntos: parseFloat(puntos) || 90,
    };

    const saved = await addRegistroAtletismo(record);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la marca de atletismo' },
        { status: 500 }
      );
    }

    // Auto-consolidate and sync group best results to Google Sheets
    if (stObj) {
      const cleanGrado = (stObj.Grado || '').replace(/[^0-9]/g, '');
      const cleanGrupo = (stObj.Grupo || '').replace(/[^A-Z]/g, '');
      const studentGrupo = cleanGrado && cleanGrupo ? `${cleanGrado}${cleanGrupo}` : (stObj.Grupo || '').trim();
      if (studentGrupo) {
        try {
          const [allAtl, allCual] = await Promise.all([
            getRegistrosAtletismo(),
            getRegistrosCualitativos(),
          ]);
          const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, studentGrupo));
          const rowsData = groupStudents.map((st) =>
            calculateBestMarksForStudent(st, allAtl, allCual)
          );
          await updateGrupoMejoresResultadosSheet(
            studentGrupo,
            cicloEscolar || '2026-2027',
            nombreMaestro || (tchObj ? tchObj.Nombre : 'Profesor de Educación Física'),
            rowsData
          );
        } catch (syncErr) {
          console.warn('Auto-sync to Tabla de Mejores Resultados Consolidados failed:', syncErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Marca de atletismo registrada y consolidada exitosamente en la Tabla de Mejores Resultados',
      record,
    });
  } catch (error) {
    console.error('Error adding atletismo record:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al guardar marca de atletismo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idRegistro = searchParams.get('idRegistro');
    const idAlumno = searchParams.get('idAlumno');
    const cicloEscolar = searchParams.get('cicloEscolar');
    const fecha = searchParams.get('fecha');
    const prueba = searchParams.get('prueba');
    const resultadoPrincipal = searchParams.get('resultadoPrincipal');

    let bodyData: any = {};
    if (!idRegistro) {
      try {
        bodyData = await request.json();
      } catch (e) {}
    }

    const regId = idRegistro || bodyData.idRegistro;
    const almId = idAlumno || bodyData.idAlumno;
    const ciclo = cicloEscolar || bodyData.cicloEscolar || '2026-2027';

    if (!regId && !almId) {
      return NextResponse.json(
        { success: false, error: 'ID de registro o ID de alumno es requerido para eliminar' },
        { status: 400 }
      );
    }

    const deleted = await deleteRegistroAtletismo(
      regId,
      almId,
      fecha || bodyData.fecha,
      prueba || bodyData.prueba,
      resultadoPrincipal || bodyData.resultadoPrincipal
    );

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'No se pudo eliminar el registro de Registros_Atletismo' },
        { status: 500 }
      );
    }

    // Auto-reconsolidate group table if student is found
    if (almId) {
      try {
        const alumnos = await getAlumnosInscritos();
        const stObj = alumnos.find((a) => a.ID_Alumno === almId);
        if (stObj) {
          const cleanGrado = (stObj.Grado || '').replace(/[^0-9]/g, '');
          const cleanGrupo = (stObj.Grupo || '').replace(/[^A-Z]/g, '');
          const studentGrupo = cleanGrado && cleanGrupo ? `${cleanGrado}${cleanGrupo}` : (stObj.Grupo || '').trim();
          if (studentGrupo) {
            const [allAtl, allCual] = await Promise.all([
              getRegistrosAtletismo(),
              getRegistrosCualitativos(),
            ]);
            const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, studentGrupo));
            const rowsData = groupStudents.map((st) =>
              calculateBestMarksForStudent(st, allAtl, allCual)
            );
            await updateGrupoMejoresResultadosSheet(
              studentGrupo,
              ciclo,
              'Profesor de Educación Física',
              rowsData
            );
          }
        }
      } catch (syncErr) {
        console.warn('Auto-sync group table after delete failed:', syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Marca de atletismo eliminada exitosamente de Registros_Atletismo',
    });
  } catch (error) {
    console.error('Error deleting atletismo record:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al eliminar registro de atletismo' },
      { status: 500 }
    );
  }
}
