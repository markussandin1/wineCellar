/**
 * Logout API Route
 *
 * POST /api/auth/logout - Sign out current user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout - Sign out current user
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to logout' },
      { status: 500 }
    );
  }
}
