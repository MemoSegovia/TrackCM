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

    const matchedUsers = usuarios.filter(
      (u) => u.Correo.trim().toLowerCase() === emailClean && u.Password === password
    );

    if (matchedUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const matchedUser = matchedUsers[0];

    // Combine all assigned levels across matching user rows or comma/slash separated strings
    const assignedLevelsSet = new Set<string>();
    matchedUsers.forEach((u) => {
      if (u.Nivel_Asignado) {
        u.Nivel_Asignado.split(/[,/;]+/).forEach((lvl) => {
          const trimmed = lvl.trim();
          if (trimmed) assignedLevelsSet.add(trimmed);
        });
      }
    });

    const nivelAsignadoCombined = Array.from(assignedLevelsSet).join(', ');

    return NextResponse.json({
      success: true,
      user: {
        id: matchedUser.ID_Usuario,
        nombre: matchedUser.Nombre,
        correo: matchedUser.Correo,
        rol: matchedUser.Rol,
        nivelAsignado: nivelAsignadoCombined || matchedUser.Nivel_Asignado,
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
