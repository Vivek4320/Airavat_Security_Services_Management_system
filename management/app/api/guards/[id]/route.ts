import { NextResponse } from 'next/server';
import { isDBConfigured, updateGuardStatusInDB, deleteGuardFromDB } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing guard ID or status' }, { status: 400 });
    }

    if (isDBConfigured()) {
      await updateGuardStatusInDB(id, status);
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing guard ID' }, { status: 400 });
    }

    if (isDBConfigured()) {
      await deleteGuardFromDB(id);
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
