import { NextResponse } from 'next/server';
import { addRegistroAtletismo } from '@/lib/googleSheets';
import { generateRecordId, getCurrentDateISO } from '@/lib/utils';
import { RegistroAtletismo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idAlumno, cicloEscolar, idMaestro, prueba, resultadoPrincipal, detalleJsonVueltas, puntos } = body;

    if (!idAlumno || !prueba || !resultadoPrincipal) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios (Alumno, Prueba o Resultado)' },
        { status: 400 }
      );
    }

    const record: RegistroAtletismo = {
      ID_Registro: generateRecordId('ATL'),
      Fecha: getCurrentDateISO(),
      ID_Alumno: idAlumno,
      Ciclo_Escolar: cicloEscolar || '2026-2027',
      ID_Maestro: idMaestro || 'USR-MAESTRO',
      Prueba: prueba,
      Resultado_Principal: resultadoPrincipal,
      Detalle_JSON_Vueltas: typeof detalleJsonVueltas === 'object' ? JSON.stringify(detalleJsonVueltas) : (detalleJsonVueltas || ''),
      Puntos: parseFloat(puntos) || 90,
    };

    const saved = await addRegistroAtletismo(record);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la marca de atletismo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Marca de atletismo registrada exitosamente',
      record,
    });
  } catch (error) {
    console.error('Error adding atletismo record:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al guardar marca de atletismo' },
      { status: 500 }
    );
  }
}
