'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUserProfile } from '@/lib/api/client';
import SettingsContent from './SettingsContent';

export const dynamic = 'force-static';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    getUserProfile()
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load user profile:', error);
        setLoading(false);
      });
  }, [mounted]);

  if (!mounted || loading) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div>Loading...</div>
    </div>;
  }

  if (!profile) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div>Failed to load profile</div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsContent profile={profile} />
    </div>
  );
}
