import { NextResponse } from 'next/server';
import { addRegistroAntropometrico } from '@/lib/googleSheets';
import { calculateIMC, generateRecordId, getCurrentDateISO } from '@/lib/utils';
import { RegistroAntropometrico } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, cicloEscolar, idMaestro, edad, pesoKg, estaturaCm } = body;

    if (!idAlumno || !pesoKg || !estaturaCm) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (Alumno, Peso o Estatura)' },
        { status: 400 }
      );
    }

    const { imc } = calculateIMC(pesoKg, estaturaCm);

    const record: RegistroAntropometrico = {
      ID_Registro: generateRecordId('ANT'),
      Fecha: getCurrentDateISO(),
      ID_Alumno: idAlumno,
      Ciclo_Escolar: cicloEscolar || '2026-2027',
      ID_Maestro: idMaestro || 'USR-MAESTRO',
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
