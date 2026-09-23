import { NextResponse } from 'next/server';
import { isDBConfigured, getSupabaseClient } from '@/lib/db';

// GET: Test if the Supabase database is connected and working
export async function GET() {
  try {
    if (!isDBConfigured()) {
      return NextResponse.json({
        connected: false,
        message: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local',
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: 'Unable to initialize Supabase client.',
      });
    }

    // Test connection by counting guards
    const { count, error } = await supabase
      .from('guards')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        connected: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      connected: true,
      totalGuards: count ?? 0,
      message: 'Successfully connected to Supabase!',
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
