import { NextResponse } from 'next/server';
import { isDBConfigured, getDBPool, ensureGuardsTable } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    if (!isDBConfigured()) {
      return NextResponse.json({
        connected: false,
        message: 'DATABASE_URL still contains [YOUR-PASSWORD]. Please provide your Supabase database password.',
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

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Valid password required' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const encodedPassword = encodeURIComponent(password);

    const newContent = `# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="postgresql://postgres.vhepeisokibeobnpbqht:${encodedPassword}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="postgresql://postgres.vhepeisokibeobnpbqht:${encodedPassword}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
`;

    fs.writeFileSync(envPath, newContent, 'utf-8');
    process.env.DATABASE_URL = `postgresql://postgres.vhepeisokibeobnpbqht:${encodedPassword}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    process.env.DIRECT_URL = `postgresql://postgres.vhepeisokibeobnpbqht:${encodedPassword}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

    return NextResponse.json({
      success: true,
      message: 'Database connection password updated! Testing connection...',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
