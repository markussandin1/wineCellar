/**
 * User Account API Route
 *
 * DELETE /api/user/account - Delete user account
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/user/account - Delete user account
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user data (cascade will handle bottles, logs, etc.)
    const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id);

    if (deleteError) {
      console.error('Error deleting user data:', deleteError);
      throw new Error('Failed to delete account');
    }

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user/account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    );
  }
}
