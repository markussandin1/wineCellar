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
  const bottle = await getBottle(id);

  if (!bottle) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BottleDetail bottle={bottle} />
    </div>
  );
}
