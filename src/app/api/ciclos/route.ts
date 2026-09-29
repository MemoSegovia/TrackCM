import { NextResponse } from 'next/server';
import { getAlumnosInscritos } from '@/lib/googleSheets';

// Server-side cache for dynamically added school cycles
let serverCustomCiclos: string[] = [];

export async function GET() {
  try {
    const alumnos = await getAlumnosInscritos();
    const sheetCiclos = Array.from(new Set(alumnos.map((a) => a.Ciclo_Escolar))).filter(Boolean);

    const defaultCiclos = ['2026-2027', '2025-2026'];
    const merged = Array.from(new Set([...defaultCiclos, ...sheetCiclos, ...serverCustomCiclos]));
    merged.sort((a, b) => b.localeCompare(a));

    return NextResponse.json({
      success: true,
      ciclosDisponibles: merged,
    });
  } catch (error) {
    console.error('Error in GET /api/ciclos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar ciclos escolares' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cicloEscolar } = body;

    if (!cicloEscolar || typeof cicloEscolar !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nombre de ciclo escolar es requerido' },
        { status: 400 }
      );
    }

    const clean = cicloEscolar.trim();
    if (!serverCustomCiclos.includes(clean)) {
      serverCustomCiclos.push(clean);
    }

    return NextResponse.json({
      success: true,
      message: `¡Ciclo Escolar "${clean}" agregado exitosamente!`,
      ciclosDisponibles: serverCustomCiclos,
    });
  } catch (error) {
    console.error('Error in POST /api/ciclos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar el ciclo escolar' },
      { status: 500 }
    );
  }
}
