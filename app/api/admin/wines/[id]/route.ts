import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();
    const { id } = await params;

    // Get wine data
    const { data: wine, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !wine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    // Get user stats for this wine
    const { data: userStats } = await supabase.rpc('get_wine_user_stats', {
      wine_id_param: id,
    });

    const stats = {
      userCount: userStats?.[0]?.user_count || 0,
      bottleCount: userStats?.[0]?.bottle_count || 0,
      users: (userStats || []).map((stat: any) => ({
        userId: stat.user_id,
        userName: stat.user_name,
        quantity: stat.quantity,
        totalValue: stat.total_value,
      })),
    };

    // Get edit history
    const { data: editHistory } = await supabase
      .from('wine_edit_logs')
      .select('id, action, changes, created_at, user_id, users(name)')
      .eq('wine_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    const history = (editHistory || []).map((log: any) => ({
      id: log.id,
      action: log.action,
      userName: log.users?.name || 'Unknown',
      changes: log.changes,
      createdAt: log.created_at,
    }));

    return NextResponse.json({
      wine,
      stats,
      editHistory: history,
    });
  } catch (error) {
    console.error('Admin wine detail error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch wine details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const user = await requireAdmin();

    const supabase = await createClient();
    const { id } = await params;
    const updates = await request.json();

    // Get old values for audit log
    const { data: oldWine } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldWine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    // Update wine
    const { data: updatedWine, error } = await supabase
      .from('wines')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create audit log
    await supabase.from('wine_edit_logs').insert({
      wine_id: id,
      user_id: user.id,
      action: 'update',
      changes: {
        old: oldWine,
        new: updates,
      },
    });

    return NextResponse.json({ wine: updatedWine });
  } catch (error) {
    console.error('Admin wine update error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update wine' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const user = await requireAdmin();

    const supabase = await createClient();
    const { id } = await params;

    // Check if any bottles exist for this wine
    const { data: bottles } = await supabase
      .from('bottles')
      .select('id, user_id')
      .eq('wine_id', id);

    const bottleCount = bottles?.length || 0;
    const userCount = new Set(bottles?.map(b => b.user_id)).size;

    // If bottles exist, verify deletion intent through request body
    if (bottleCount > 0) {
      const body = await request.json();
      if (!body.confirmDeletion) {
        return NextResponse.json(
          {
            error: 'Confirmation required',
            message: `This wine has ${bottleCount} bottles owned by ${userCount} user(s). Include confirmDeletion: true to proceed.`,
            impact: { bottleCount, userCount },
          },
          { status: 400 }
        );
      }
    }

    // Get wine data for audit log
    const { data: wine } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .single();

    // Delete wine (bottles will be cascade deleted)
    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Create audit log
    await supabase.from('wine_edit_logs').insert({
      wine_id: id,
      user_id: user.id,
      action: 'delete',
      changes: {
        deletedWine: wine,
        impact: { bottleCount, userCount },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Wine deleted successfully. ${bottleCount} bottle(s) were also removed.`,
    });
  } catch (error) {
    console.error('Admin wine delete error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete wine' },
      { status: 500 }
    );
  }
}
