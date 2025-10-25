import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BottleForm } from '@/components/bottles/bottle-form';

export default async function AddBottlePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add New Bottle</h1>
      <BottleForm />
    </div>
  );
}
