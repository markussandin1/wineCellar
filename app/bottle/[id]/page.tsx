import { notFound } from 'next/navigation';
import { BottleDetail } from '@/components/bottles/bottle-detail';

export default async function BottlePage({ params }: { params: Promise<{ id: string }> }) {
  // TODO: Implement proper Supabase session check

  const { id } = await params;

  // TODO: Re-enable getBottle once we have proper Supabase auth
  const bottle = null;

  if (!bottle) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BottleDetail bottle={bottle} />
    </div>
  );
}
