import { redirect, notFound } from 'next/navigation';
import { BottleDetail } from '@/components/bottles/bottle-detail';
import { createClient } from '@/lib/supabase/server';
import { getBottle } from '@/app/actions/bottle';

export default async function BottlePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  try {
    const bottle = await getBottle(id);

    if (!bottle) {
      console.error(`Bottle not found: ${id}, user: ${user.id}`);
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <BottleDetail bottle={bottle} />
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Error fetching bottle ${id}:`, error);
    throw error;
  }
}
