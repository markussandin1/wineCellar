import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getBottle } from '@/app/actions/bottle';
import { BottleDetail } from '@/components/bottles/bottle-detail';
import { notFound } from 'next/navigation';

export default async function BottlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
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
