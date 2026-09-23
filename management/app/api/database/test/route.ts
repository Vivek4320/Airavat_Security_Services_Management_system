import { NextResponse } from 'next/server';
import { isDBConfigured, getDBPool, ensureGuardsTable } from '@/lib/db';

// GET: Test if the database is connected and working
export async function GET() {
  try {
    if (!isDBConfigured()) {
      return NextResponse.json({
        connected: false,
        message: 'DATABASE_URL is not configured. Please set it in .env.local',
      });
    }

    const pool = getDBPool();
    if (!pool) {
      return NextResponse.json({
        connected: false,
        message: 'Unable to initialize database connection pool.',
      });
    }

    // Run connection probe
    const res = await pool.query('SELECT current_database(), current_user, version()');
    await ensureGuardsTable();

    const countRes = await pool.query('SELECT COUNT(*)::int as total FROM guards');
    const totalGuards = countRes.rows[0]?.total || 0;

    return NextResponse.json({
      connected: true,
      database: res.rows[0]?.current_database,
      user: res.rows[0]?.current_user,
      totalGuards,
      message: 'Successfully connected to Supabase PostgreSQL database!',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Database connection test error:', error);
    return NextResponse.json({
      connected: false,
      message: error.message || 'Database connection error',
    });
  }
}
