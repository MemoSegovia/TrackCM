import { NextResponse } from 'next/server';
import { registerActiveSession, removeActiveSession, getActiveSessions } from '@/lib/activeSessions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeUsers = getActiveSessions();
  return NextResponse.json({
    success: true,
    users: activeUsers,
    total: activeUsers.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user } = body;
    if (user && user.id) {
      registerActiveSession(user);
    }
    const activeUsers = getActiveSessions();
    return NextResponse.json({ success: true, users: activeUsers, total: activeUsers.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al actualizar sesión activa' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (userId) {
      removeActiveSession(userId);
    }
    const activeUsers = getActiveSessions();
    return NextResponse.json({ success: true, users: activeUsers, total: activeUsers.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al remover sesión activa' }, { status: 400 });
  }
}
