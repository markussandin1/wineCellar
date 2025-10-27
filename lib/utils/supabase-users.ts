interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
}

function extractName(user: AuthUser): string | null {
  const metadata = user.user_metadata || {};
  return (
    metadata.name ||
    metadata.full_name ||
    user.email ||
    null
  );
}

export async function ensureUserRecord(supabase: any, authUser: AuthUser) {
  if (!authUser?.id) return;

  const { data: existing, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .limit(1);

  if (error) {
    // If the select fails for unexpected reasons, bubble up to the caller.
    throw error;
  }

  if (existing && existing.length > 0) {
    return;
  }

  const payload = {
    id: authUser.id,
    email: authUser.email ?? '',
    name: extractName(authUser),
  };

  const { error: upsertError } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    throw upsertError;
  }
}
