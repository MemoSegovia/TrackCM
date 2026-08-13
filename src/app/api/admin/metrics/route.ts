import { NextResponse } from 'next/server';
import {
  getAlumnosInscritos,
  getUsuarios,
  getRegistrosAntropometricos,
  getRegistrosAtletismo,
  getRegistrosCualitativos,
} from '@/lib/googleSheets';

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

    const maestros = usuarios.filter((u) => u.Rol?.toLowerCase() === 'maestro');

    // Count students per level
    const alumnosPorNivel: Record<string, number> = {
      Kinder: 0,
      'Primaria Menor': 0,
      'Primaria Mayor': 0,
      Secundaria: 0,
      Preparatoria: 0,
    };

    alumnos.forEach((a) => {
      const niv = a.Nivel || 'Otros';
      if (alumnosPorNivel[niv] !== undefined) {
        alumnosPorNivel[niv]++;
      } else {
        alumnosPorNivel[niv] = 1;
      }
    });

    // Activity breakdown per teacher
    const actividadMaestros = maestros.map((m) => {
      const countAntro = antro.filter((r) => r.ID_Maestro === m.ID_Usuario).length;
      const countAtl = atl.filter((r) => r.ID_Maestro === m.ID_Usuario).length;
      const countCual = cual.filter((r) => r.ID_Maestro === m.ID_Usuario).length;

      return {
        idMaestro: m.ID_Usuario,
        nombreMaestro: m.Nombre,
        totalRegistros: countAntro + countAtl + countCual,
        totalAntropometricos: countAntro,
        totalAtletismo: countAtl,
        totalCualitativos: countCual,
      };
    });

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
