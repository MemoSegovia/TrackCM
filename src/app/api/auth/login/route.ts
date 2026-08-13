import { NextResponse } from 'next/server';
import { getUsuarios } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingrese correo y contraseña' },
        { status: 400 }
      );
    }

    const usuarios = await getUsuarios();
    const emailClean = email.trim().toLowerCase();

    const matchedUser = usuarios.find(
      (u) => u.Correo.toLowerCase() === emailClean && u.Password === password
    );

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: matchedUser.ID_Usuario,
        nombre: matchedUser.Nombre,
        correo: matchedUser.Correo,
        rol: matchedUser.Rol,
        nivelAsignado: matchedUser.Nivel_Asignado,
      },
    });
  } catch (error: any) {
    console.error('Error in auth route:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
