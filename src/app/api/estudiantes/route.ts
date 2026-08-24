import { NextResponse } from 'next/server';
import { getAlumnosInscritos, getUsuarios } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [alumnos, usuarios] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
    ]);

    // Extract unique filter dropdown values
    const ciclos = Array.from(new Set(alumnos.map((a) => a.Ciclo_Escolar))).filter(Boolean);
    const niveles = Array.from(new Set(alumnos.map((a) => a.Nivel))).filter(Boolean);
    const grados = Array.from(new Set(alumnos.map((a) => a.Grado))).filter(Boolean);
    const grupos = Array.from(new Set(alumnos.map((a) => a.Grupo))).filter(Boolean);

    // Map teacher emails to all their assigned levels
    const userLevelsByEmail: Record<string, string[]> = {};
    usuarios.forEach((u) => {
      if (u.Correo && u.Nivel_Asignado) {
        const key = u.Correo.trim().toLowerCase();
        if (!userLevelsByEmail[key]) {
          userLevelsByEmail[key] = [];
        }
        u.Nivel_Asignado.split(/[,/;]+/).forEach((lvl) => {
          const cleanLvl = lvl.trim();
          if (cleanLvl && !userLevelsByEmail[key].includes(cleanLvl)) {
            userLevelsByEmail[key].push(cleanLvl);
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      alumnos,
      userLevelsByEmail,
      filters: {
        ciclos: ciclos.length ? ciclos : ['2026-2027'],
        niveles: niveles.length ? niveles : ['Primaria', 'Secundaria', 'Preparatoria'],
        grados: grados.length ? grados : ['1', '2', '3', '4', '5', '6'],
        grupos: grupos.length ? grupos : ['A', 'B', 'C'],
      },
    });
  } catch (error) {
    console.error('Error fetching estudiantes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la lista de estudiantes' },
      { status: 500 }
    );
  }
}
