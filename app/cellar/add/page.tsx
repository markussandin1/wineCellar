import { redirect } from 'next/navigation';
import { AddBottleChoice } from '@/components/bottles/add-bottle-choice';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRecord } from '@/lib/utils/supabase-users';
import { PageHeader } from '@/lib/design-system';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <PageHeader
          title="Add New Bottle"
          subtitle="Choose how you want to add your wine"
        />
        <AddBottleChoice userCurrency={userCurrency} />
      </div>
    </div>
  );
}
