/**
 * User Profile API Route
 *
 * GET /api/user/profile - Get user profile
 * PATCH /api/user/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile - Get user profile
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    // Get user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, preferences, settings')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }

    // Get bottle count
    const { count: bottleCount } = await supabase
      .from('bottles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: userData.created_at,
      preferences: userData.preferences || {},
      settings: userData.settings || {},
      bottleCount: bottleCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile - Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.preferences !== undefined) updateData.preferences = body.preferences;
    if (body.settings !== undefined) updateData.settings = body.settings;

    const { error } = await supabase.from('users').update(updateData).eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/user/profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
