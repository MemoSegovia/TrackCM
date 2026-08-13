import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getRegistrosAntropometricos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  getUsuarios,
} from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const emailParam = searchParams.get('email');

    const alumnos = await getAlumnosInscritos();
    const usuarios = await getUsuarios();

    let targetStudent = null;

    if (studentIdParam) {
      targetStudent = alumnos.find((a) => a.ID_Alumno === studentIdParam);
    } else if (emailParam) {
      const emailClean = emailParam.trim().toLowerCase();
      const userMatch = usuarios.find((u) => u.Correo.toLowerCase() === emailClean);
      if (userMatch) {
        // Try matching by name or email
        targetStudent = alumnos.find(
          (a) => a.Nombre_Completo.toLowerCase() === userMatch.Nombre.toLowerCase()
        ) || alumnos[0];
      }
    }

    if (!targetStudent && alumnos.length > 0) {
      targetStudent = alumnos[0]; // fallback
    }

    const [antropometricos, atletismo, cualitativos] = await Promise.all([
      getRegistrosAntropometricos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const studentId = targetStudent?.ID_Alumno;

    const studentAntro = antropometricos.filter((r) => r.ID_Alumno === studentId);
    const studentAtl = atletismo.filter((r) => r.ID_Alumno === studentId);
    const studentCua = cualitativos.filter((r) => r.ID_Alumno === studentId);

    return NextResponse.json({
      success: true,
      alumno: targetStudent,
      historial: {
        antropometrico: studentAntro,
        atletismo: studentAtl,
        cualitativo: studentCua,
      },
    });
  } catch (error) {
    console.error('Error fetching historial:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar historial del estudiante' },
      { status: 500 }
    );
  }
}
