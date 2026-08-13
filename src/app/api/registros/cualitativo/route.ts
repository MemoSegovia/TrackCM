import { NextResponse } from 'next/server';
import { addRegistroCualitativo, getAlumnosInscritos, getUsuarios } from '@/lib/googleSheets';
import { generateRecordId, getCurrentDateISO } from '@/lib/utils';
import { RegistroCualitativo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, cicloEscolar, idMaestro, deporteOPrueba, calificacion, nombreAlumno, nombreMaestro } = body;

    if (!idAlumno || !deporteOPrueba || !calificacion) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const [alumnos, usuarios] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
    ]);

    const stObj = alumnos.find((a) => a.ID_Alumno === idAlumno);
    const tchObj = usuarios.find((u) => u.ID_Usuario === idMaestro);

    const record: RegistroCualitativo = {
      ID_Registro: generateRecordId('CUA'),
      Fecha: getCurrentDateISO(),
      ID_Alumno: idAlumno,
      Nombre_Alumno: nombreAlumno || (stObj ? stObj.Nombre_Completo : ''),
      Ciclo_Escolar: cicloEscolar || '2026-2027',
      ID_Maestro: idMaestro || 'USR-MAESTRO',
      Nombre_Maestro: nombreMaestro || (tchObj ? tchObj.Nombre : ''),
      Deporte_o_Prueba: deporteOPrueba,
      Calificacion: calificacion,
    };

    const saved = await addRegistroCualitativo(record);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la evaluación cualitativa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evaluación cualitativa guardada exitosamente',
      record,
    });
  } catch (error) {
    console.error('Error adding cualitativo record:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al guardar registro' },
      { status: 500 }
    );
  }
}
