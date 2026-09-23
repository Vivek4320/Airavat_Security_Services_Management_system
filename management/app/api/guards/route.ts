import { NextResponse } from 'next/server';
import { isDBConfigured, fetchGuardsFromDB, saveGuardToDB } from '@/lib/db';
import { Guard } from '@/lib/types';

export async function GET() {
  try {
    const configured = isDBConfigured();
    if (!configured) {
      return NextResponse.json({
        guards: [],
        source: 'local',
        message: 'DATABASE_URL contains [YOUR-PASSWORD]. Please set your password in .env.local',
      });
    }

    const guards = await fetchGuardsFromDB();
    return NextResponse.json({
      guards,
      source: 'supabase',
      message: 'Connected to Supabase PostgreSQL',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /api/guards GET error:', error);
    return NextResponse.json(
      {
        guards: [],
        source: 'local',
        error: error.message || 'Database connection error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const guard: Guard = await req.json();

    if (!guard.name || !guard.phone || !guard.site) {
      return NextResponse.json({ error: 'Missing required guard fields' }, { status: 400 });
    }

    const configured = isDBConfigured();
    if (!configured) {
      return NextResponse.json(
        {
          guard,
          source: 'local',
          message: 'Saved to browser localStorage. Set database password in .env.local to sync with Supabase.',
        },
        { status: 200 }
      );
    }

    const savedGuard = await saveGuardToDB(guard);
    return NextResponse.json({
      guard: savedGuard,
      source: 'supabase',
      message: 'Guard enrolled and saved to Supabase PostgreSQL!',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /api/guards POST error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to save guard to database',
      },
      { status: 500 }
    );
  }
}
