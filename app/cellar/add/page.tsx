import { AddBottleChoice } from '@/components/bottles/add-bottle-choice';

export default async function AddBottlePage() {
  // TODO: Implement proper Supabase session check

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add New Bottle</h1>
      <AddBottleChoice />
    </div>
  );
}
