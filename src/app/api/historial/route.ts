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
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');

    const alumnos = await getAlumnosInscritos();
    const usuarios = await getUsuarios();

    let targetStudent = null;

    if (nameParam) {
      const cleanName = nameParam.trim().toLowerCase();
      targetStudent = alumnos.find((a) => a.Nombre_Completo.trim().toLowerCase() === cleanName) || null;
    }

    if (!targetStudent && studentIdParam) {
      const q = studentIdParam.trim().toLowerCase();
      targetStudent =
        alumnos.find(
          (a) =>
            a.ID_Alumno.toLowerCase() === q ||
            a.Nombre_Completo.toLowerCase().includes(q)
        ) || null;
    } else if (!targetStudent && emailParam) {
      const emailClean = emailParam.trim().toLowerCase();
      const userMatch = usuarios.find((u) => u.Correo.toLowerCase() === emailClean);
      if (userMatch) {
        targetStudent =
          alumnos.find(
            (a) => a.Nombre_Completo.toLowerCase() === userMatch.Nombre.toLowerCase()
          ) || null;
      }
      if (!targetStudent) {
        targetStudent =
          alumnos.find(
            (a) =>
              a.ID_Alumno.toLowerCase() === emailClean ||
              a.Nombre_Completo.toLowerCase() === emailClean
          ) || null;
      }
    }

    if (!targetStudent) {
      return NextResponse.json({
        success: true,
        alumno: null,
        historial: {
          antropometrico: [],
          atletismo: [],
          cualitativo: [],
        },
      });
    }

    const [antropometricos, atletismo, cualitativos] = await Promise.all([
      getRegistrosAntropometricos(),
      getRegistrosAtletismo(),
      getRegistrosCualitativos(),
    ]);

    const studentId = targetStudent?.ID_Alumno;
    const studentNameClean = targetStudent?.Nombre_Completo?.trim().toLowerCase();

    const matchesRecord = (r: { ID_Alumno?: string; Nombre_Alumno?: string }) => {
      // 1. Direct ID match (case-insensitive, trimmed)
      if (r.ID_Alumno && studentId && String(r.ID_Alumno).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
        return true;
      }

      // 2. Exact name match (normalized)
      const recName = (r.Nombre_Alumno || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (recName && studentNameClean && recName === studentNameClean.replace(/\s+/g, ' ')) {
        return true;
      }

      // 3. Token-based fuzzy match
      const cleanRec = (r.Nombre_Alumno || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/,/g, ' ').toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
      const cleanTgt = (targetStudent?.Nombre_Completo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/,/g, ' ').toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
      if (cleanRec.length > 0 && cleanTgt.length > 0) {
        const setRec = new Set(cleanRec);
        const setTgt = new Set(cleanTgt);
        let overlap = 0;
        setRec.forEach(t => { if (setTgt.has(t)) overlap++; });
        const minTokens = Math.min(setRec.size, setTgt.size);
        if (minTokens <= 1 && overlap >= 1) return true;
        if (overlap >= 2 && overlap >= minTokens - 1) return true;
      }

      return false;
    };

    const studentAntro = antropometricos.filter(matchesRecord);
    const studentAtl = atletismo.filter(matchesRecord);
    const studentCua = cualitativos.filter(matchesRecord);

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
