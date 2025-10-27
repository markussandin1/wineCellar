import { Suspense } from 'react';
import { getUserProfile } from '@/app/actions/settings';
import SettingsContent from './SettingsContent';

export const metadata = {
  title: 'Settings - Wine Cellar',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SettingsContent profile={profile} />
      </Suspense>
    </div>
  );
}
