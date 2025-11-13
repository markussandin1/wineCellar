'use client';

import { useEffect, useState } from 'react';
import { AddBottleChoice } from '@/components/bottles/add-bottle-choice';
import { PageHeader } from '@/lib/design-system';

export const dynamic = 'force-static';

export default function AddBottlePage() {
  const [mounted, setMounted] = useState(false);
  const [userCurrency, setUserCurrency] = useState('SEK');

  useEffect(() => {
    setMounted(true);
    // TODO: Fetch user currency from API if needed
    // For now, defaulting to SEK for Capacitor builds
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] flex items-center justify-center">
      <div className="text-amber-400">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <PageHeader
          title="Add New Bottle"
          subtitle="Choose how you want to add your wine"
        />
        <AddBottleChoice userCurrency={userCurrency} />
      </div>
    </div>
  );
}
