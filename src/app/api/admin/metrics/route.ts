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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetCiclo = searchParams.get('ciclo') || '';

    const [allAlumnos, usuarios, allAntro, allAtl, allCual] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
      getRegistrosAntropometricos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    // Filter by cicloEscolar if specified
    const alumnos = targetCiclo
      ? allAlumnos.filter((a) => a.Ciclo_Escolar === targetCiclo)
      : allAlumnos;
    const antro = targetCiclo
      ? allAntro.filter((r) => r.Ciclo_Escolar === targetCiclo)
      : allAntro;
    const atl = targetCiclo
      ? allAtl.filter((r) => r.Ciclo_Escolar === targetCiclo)
      : allAtl;
    const cual = targetCiclo
      ? allCual.filter((r) => r.Ciclo_Escolar === targetCiclo)
      : allCual;

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

    // Activity breakdown per teacher with Expected Counts
    const actividadMaestros = maestros.map((m) => {
      const assignedLvlStr = getLevelForTeacher(m.Nombre, m.Nivel_Asignado);
      
      // Filter students in teacher's assigned level
      const alumnosMaestro = alumnos.filter((st) => {
        const stNivel = (st.Nivel || '').toLowerCase();
        const cleanGrado = (st.Grado || '').replace(/[^0-9]/g, '');
        const numGrado = parseInt(cleanGrado, 10);
        const assignedLower = assignedLvlStr.toLowerCase();

        if (assignedLower.includes('todos')) return true;
        if (assignedLower.includes('kinder') && stNivel.includes('kinder')) return true;
        if (assignedLower.includes('secundaria') && stNivel.includes('secundaria')) return true;
        if (assignedLower.includes('preparatoria') && stNivel.includes('preparatoria')) return true;
        if (assignedLower.includes('primaria menor') && (stNivel.includes('primaria menor') || (stNivel.includes('primaria') && numGrado <= 3))) return true;
        if (assignedLower.includes('primaria mayor') && (stNivel.includes('primaria mayor') || (stNivel.includes('primaria') && numGrado >= 4))) return true;
        if (assignedLower.includes('primaria') && stNivel.includes('primaria')) return true;
        return false;
      });

      const numAlumnos = alumnosMaestro.length > 0
        ? alumnosMaestro.length
        : Math.max(1, Math.round(alumnos.length / Math.max(1, maestros.length)));

      // Expected tests per student in assigned level:
      // Atletismo: 5 main tests (Velocidad, Salto, Lanzamiento, Resistencia, Cuerda)
      // Antropométrico: 1 Ficha IMC per student
      // Cualitativo: 2 evaluations (Orden y Control, ABC)
      const esperadosAtl = numAlumnos * 5;
      const esperadosAntro = numAlumnos * 1;
      const esperadosCual = numAlumnos * 2;
      const esperadosTotal = esperadosAtl + esperadosAntro + esperadosCual;

      const firstToken = m.Nombre.toLowerCase().split(' ')[0];
      const countAntro = antro.filter((r) => r.ID_Maestro === m.ID_Usuario || (r.Nombre_Maestro && r.Nombre_Maestro.toLowerCase().includes(firstToken))).length;
      const countAtl = atl.filter((r) => r.ID_Maestro === m.ID_Usuario || (r.Nombre_Maestro && r.Nombre_Maestro.toLowerCase().includes(firstToken))).length;
      const countCual = cual.filter((r) => r.ID_Maestro === m.ID_Usuario || (r.Nombre_Maestro && r.Nombre_Maestro.toLowerCase().includes(firstToken))).length;

      const totalRegistros = countAntro + countAtl + countCual;
      const porcentajeAvance = esperadosTotal > 0 ? Math.min(100, Math.round((totalRegistros / esperadosTotal) * 100)) : 0;

      return {
        idMaestro: m.ID_Usuario,
        nombreMaestro: m.Nombre,
        nivelAsignado: assignedLvlStr,
        totalAlumnosNivel: numAlumnos,
        totalRegistros,
        esperadosTotal,
        totalAntropometricos: countAntro,
        esperadosAntropometricos: esperadosAntro,
        totalAtletismo: countAtl,
        esperadosAtletismo: esperadosAtl,
        totalCualitativos: countCual,
        esperadosCualitativos: esperadosCual,
        porcentajeAvance,
      };
    });

    // Users and Teachers with an active logged-in session
    const usuariosConectados = getActiveSessions();

    const ciclosUnicos = Array.from(new Set(allAlumnos.map((a) => a.Ciclo_Escolar))).filter(Boolean);

    return NextResponse.json({
      success: true,
      metrics: {
        cicloEscolar: targetCiclo || '2026-2027',
        ciclosDisponibles: ciclosUnicos.length > 0 ? ciclosUnicos : ['2026-2027', '2025-2026'],
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


