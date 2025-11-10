import { createClient } from '@/lib/supabase/server';

/**
 * Requires the current user to be an admin. Throws an error if not authenticated or not admin.
 * Use this in API routes and server components to protect admin-only functionality.
 *
 * @throws Error if user is not authenticated or not an admin
 * @returns The authenticated admin user
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error('Failed to verify admin status');
  }

  if (!userData?.is_admin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Checks if a user is an admin without throwing errors.
 * Useful for conditional UI rendering.
 *
 * @param userId - The user ID to check
 * @returns True if the user is an admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    return false;
  }

  return data?.is_admin ?? false;
}

/**
 * Checks if the current authenticated user is an admin.
 * Useful for conditional UI rendering in server components.
 *
 * @returns True if the current user is an admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return isAdmin(user.id);
}
