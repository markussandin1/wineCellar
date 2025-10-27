import { redirect } from 'next/navigation';
import { AddBottleChoice } from '@/components/bottles/add-bottle-choice';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

export default async function AddBottlePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user record exists and get their settings
  await ensureUserRecord(supabase, user);

  const { data: userData } = await supabase
    .from('users')
    .select('settings')
    .eq('id', user.id)
    .single();

  const userCurrency = userData?.settings?.defaultCurrency || 'SEK';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add New Bottle</h1>
      <AddBottleChoice userCurrency={userCurrency} />
    </div>
  );
}
