'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BottleDetail } from '@/components/bottles/bottle-detail';
import { getBottle } from '@/lib/api/client';

export default function BottlePage() {
  const params = useParams();
  const id = params.id as string;
  const [bottle, setBottle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    getBottle(id)
      .then(data => {
        setBottle(data.bottle);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load bottle:', error);
        setError('Bottle not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] flex items-center justify-center">
      <div className="text-amber-400">Loading...</div>
    </div>;
  }

  if (error || !bottle) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] flex items-center justify-center">
      <div className="text-red-400">{error || 'Bottle not found'}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BottleDetail bottle={bottle} />
      </div>
    </div>
  );
}
