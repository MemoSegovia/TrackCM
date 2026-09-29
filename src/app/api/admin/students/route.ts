import { NextResponse } from 'next/server';
import { getAlumnosInscritos, addAlumnoInscrito, updateAlumnoGradeGroup } from '@/lib/googleSheets';
import { generateRecordId } from '@/lib/utils';
import { AlumnoInscrito } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alumnos = await getAlumnosInscritos();
    return NextResponse.json({ success: true, alumnos });
  } catch (error) {
    console.error('Error fetching alumnos:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener estudiantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombreCompleto, fechaNacimiento, genero, nivel, grado, grupo, cicloEscolar } = body;

    if (!nombreCompleto || !nivel || !grado || !grupo) {
      return NextResponse.json({ success: false, error: 'Nombre, nivel, grado y grupo son obligatorios' }, { status: 400 });
    }

    const newStudent: AlumnoInscrito = {
      ID_Alumno: generateRecordId('ALU'),
      Nombre_Completo: nombreCompleto.trim(),
      Fecha_Nacimiento: fechaNacimiento || '',
      Genero: genero || 'M',
      Nivel: nivel.trim(),
      Grado: String(grado).trim(),
      Grupo: String(grupo).trim().toUpperCase(),
      Ciclo_Escolar: cicloEscolar || '2026-2027',
    };

    const saved = await addAlumnoInscrito(newStudent);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'No se pudo registrar al alumno' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `¡Alumno ${newStudent.Nombre_Completo} registrado exitosamente!`,
      student: newStudent,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/students:', error);
    return NextResponse.json({ success: false, error: 'Error al agregar estudiante' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, nombreCompleto, nivel, grado, grupo, cicloEscolar } = body;

    if (!idAlumno && !nombreCompleto) {
      return NextResponse.json({ success: false, error: 'ID de alumno o nombre completo requerido' }, { status: 400 });
    }

    const updated = await updateAlumnoGradeGroup(idAlumno || '', {
      nivel,
      grado,
      grupo,
      nombreCompleto,
      cicloEscolar,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'No se pudo actualizar el grado/grupo del alumno' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `¡Asignación de nivel/grado/grupo actualizada exitosamente!`,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/students:', error);
    return NextResponse.json({ success: false, error: 'Error al cambiar grado/grupo del estudiante' }, { status: 500 });
  }
}
