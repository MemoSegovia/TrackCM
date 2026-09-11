import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getUsuarios,
  getRegistrosAntropometricos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
  getTeacherNameForLevel,
} from '@/lib/googleSheets';
import { getActiveSessions } from '@/lib/activeSessions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [alumnos, usuarios, antro, atl, cual] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
      getRegistrosAntropometricos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const maestros = usuarios.filter(
      (u) => u.Rol?.toLowerCase() === 'maestro' || u.Rol?.toLowerCase() === 'profesor'
    );

    // Count students per level (handling 'Primaria' + Grade 1-3 vs 4-6)
    const alumnosPorNivel: Record<string, number> = {
      Kinder: 0,
      'Primaria Menor': 0,
      'Primaria Mayor': 0,
      Secundaria: 0,
      Preparatoria: 0,
    };

    alumnos.forEach((a) => {
      const rawNivel = (a.Nivel || '').trim().toLowerCase();
      const cleanGrado = (a.Grado || '').replace(/[^0-9]/g, '');
      const numGrado = parseInt(cleanGrado, 10);

      let key = 'Otros';
      if (rawNivel.includes('kinder')) {
        key = 'Kinder';
      } else if (
        rawNivel.includes('primaria menor') ||
        (rawNivel.includes('primaria') && numGrado >= 1 && numGrado <= 3)
      ) {
        key = 'Primaria Menor';
      } else if (
        rawNivel.includes('primaria mayor') ||
        (rawNivel.includes('primaria') && numGrado >= 4 && numGrado <= 6)
      ) {
        key = 'Primaria Mayor';
      } else if (rawNivel.includes('secundaria')) {
        key = 'Secundaria';
      } else if (
        rawNivel.includes('preparatoria') ||
        rawNivel.includes('prepa') ||
        rawNivel.includes('bachillerato')
      ) {
        key = 'Preparatoria';
      }

      if (alumnosPorNivel[key] !== undefined) {
        alumnosPorNivel[key]++;
      } else {
        alumnosPorNivel[key] = 1;
      }
    });

    // Helper to resolve level assigned for teacher
    const getLevelForTeacher = (nombre: string, nivelAsignado?: string): string => {
      if (nivelAsignado && nivelAsignado.trim() !== '') return nivelAsignado;
      const n = (nombre || '').toLowerCase();
      if (n.includes('hinojosa') || n.includes('jaqueline')) return 'Kinder';
      if (n.includes('campos') || n.includes('orlando')) return 'Primaria Menor';
      if (n.includes('ibarra') || n.includes('diego')) return 'Primaria Mayor';
      if (n.includes('armenta') || n.includes('eduardo')) return 'Secundaria / Preparatoria';
      return 'Educación Física';
    };

    // Activity breakdown per teacher
    const actividadMaestros = maestros.map((m) => {
      const countAntro = antro.filter((r) => r.ID_Maestro === m.ID_Usuario).length;
      const countAtl = atl.filter((r) => r.ID_Maestro === m.ID_Usuario).length;
      const countCual = cual.filter((r) => r.ID_Maestro === m.ID_Usuario).length;

      return {
        idMaestro: m.ID_Usuario,
        nombreMaestro: m.Nombre,
        nivelAsignado: getLevelForTeacher(m.Nombre, m.Nivel_Asignado),
        totalRegistros: countAntro + countAtl + countCual,
        totalAntropometricos: countAntro,
        totalAtletismo: countAtl,
        totalCualitativos: countCual,
      };
    });

    // Users and Teachers with an active logged-in session
    const usuariosConectados = getActiveSessions();

    return NextResponse.json({
      success: true,
      metrics: {
        totalAlumnos: alumnos.length,
        totalMaestros: maestros.length,
        totalRegistrosAntro: antro.length,
        totalRegistrosAtl: atl.length,
        totalRegistrosCual: cual.length,
        actividadMaestros,
        alumnosPorNivel,
        usuariosConectados,
      },
    });
  } catch (error) {
    console.error('Error in admin metrics API:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener métricas del administrador' },
      { status: 500 }
    );
  }
}


