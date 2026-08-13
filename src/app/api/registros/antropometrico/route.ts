import { NextResponse } from 'next/server';
import { addRegistroAntropometrico, getAlumnosInscritos, getUsuarios } from '@/lib/googleSheets';
import { calculateIMC, generateRecordId, getCurrentDateISO } from '@/lib/utils';
import { RegistroAntropometrico } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, cicloEscolar, idMaestro, edad, pesoKg, estaturaCm, nombreAlumno, nombreMaestro } = body;

    if (!idAlumno || !pesoKg || !estaturaCm) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (Alumno, Peso o Estatura)' },
        { status: 400 }
      );
    }

    const [alumnos, usuarios] = await Promise.all([
      getAlumnosInscritos(),
      getUsuarios(),
    ]);

    const stObj = alumnos.find((a) => a.ID_Alumno === idAlumno);
    const tchObj = usuarios.find((u) => u.ID_Usuario === idMaestro);

    const { imc } = calculateIMC(pesoKg, estaturaCm);

    const record: RegistroAntropometrico = {
      ID_Registro: generateRecordId('ANT'),
      Fecha: getCurrentDateISO(),
      ID_Alumno: idAlumno,
      Nombre_Alumno: nombreAlumno || (stObj ? stObj.Nombre_Completo : ''),
      Ciclo_Escolar: cicloEscolar || '2026-2027',
      ID_Maestro: idMaestro || 'USR-MAESTRO',
      Nombre_Maestro: nombreMaestro || (tchObj ? tchObj.Nombre : ''),
      Edad: parseFloat(edad) || 12,
      Peso_kg: parseFloat(pesoKg),
      Estatura_cm: parseFloat(estaturaCm),
      IMC: imc,
    };

    const saved = await addRegistroAntropometrico(record);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar en Google Sheets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ficha Antropométrica registrada exitosamente',
      record,
    });
  } catch (error) {
    console.error('Error adding antropometric record:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al guardar registro' },
      { status: 500 }
    );
  }
}
