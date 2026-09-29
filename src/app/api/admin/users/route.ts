import { NextResponse } from 'next/server';
import { getUsuarios, addUsuario, updateUsuario } from '@/lib/googleSheets';
import { generateRecordId } from '@/lib/utils';
import { Usuario } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usuarios = await getUsuarios();
    return NextResponse.json({ success: true, usuarios });
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener lista de usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, correo, password, rol, nivelAsignado } = body;

    if (!nombre || !correo || !password) {
      return NextResponse.json({ success: false, error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }

    const newUser: Usuario = {
      ID_Usuario: generateRecordId('USR'),
      Nombre: nombre.trim(),
      Correo: correo.trim().toLowerCase(),
      Password: password.trim(),
      Rol: rol || 'Maestro',
      Nivel_Asignado: nivelAsignado || 'General',
    };

    const saved = await addUsuario(newUser);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'No se pudo crear el usuario' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `¡Usuario ${newUser.Nombre} creado exitosamente!`,
      user: newUser,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json({ success: false, error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { idUsuario, correo, password, rol, nivelAsignado, nombre } = body;

    if (!idUsuario && !correo) {
      return NextResponse.json({ success: false, error: 'ID de usuario o correo requerido' }, { status: 400 });
    }

    const updated = await updateUsuario(idUsuario || '', {
      password,
      rol,
      nivelAsignado,
      nombre,
      correo,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'No se pudo actualizar el usuario' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '¡Datos de usuario actualizados correctamente!',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 500 });
  }
}
