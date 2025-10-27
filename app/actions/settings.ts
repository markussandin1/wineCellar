'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
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

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    createdAt: userData.created_at,
    preferences: userData.preferences || {},
    settings: userData.settings || {},
    bottleCount: bottleCount || 0,
  };
}

export async function updateUserProfile(data: {
  name?: string;
  preferences?: any;
  settings?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.preferences !== undefined) updateData.preferences = data.preferences;
  if (data.settings !== undefined) updateData.settings = data.settings;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath('/settings');

  return { success: true };
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: data.currentPassword,
  });

  if (signInError) {
    throw new Error('Current password is incorrect');
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    console.error('Error updating password:', updateError);
    throw new Error('Failed to update password');
  }

  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  // Delete user data (cascade will handle bottles, logs, etc.)
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id);

  if (deleteError) {
    console.error('Error deleting user data:', deleteError);
    throw new Error('Failed to delete account');
  }

  // Sign out
  await supabase.auth.signOut();

  return { success: true };
}
