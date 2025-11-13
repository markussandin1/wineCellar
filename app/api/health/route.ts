import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test Supabase connection by checking auth health
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      method: 'Supabase Auth API',
      userCount: users?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error && typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);

    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
