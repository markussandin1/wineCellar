import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wine } from 'lucide-react';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <Wine className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Wine Cellar</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-Powered Wine Collection Manager
        </p>
        <p className="text-muted-foreground mb-8">
          Track your wine collection effortlessly with AI label scanning and smart insights.
          Never forget what you own, when to drink it, or what you loved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border bg-background px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">AI Label Scanning</h3>
            <p className="text-sm text-muted-foreground">
              Snap a photo of any wine label and let AI extract all the details automatically
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Smart Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get drinking window alerts, value tracking, and personalized recommendations
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Zero Friction</h3>
            <p className="text-sm text-muted-foreground">
              Mobile-first design with one-tap photo capture and minimal manual entry
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
