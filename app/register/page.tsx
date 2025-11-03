'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wine } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { playfair } from '@/lib/design-system';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Register user via API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.needsEmailConfirmation) {
        setSuccess('Account created! Please check your email to confirm your account before signing in.');
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccess('Account created successfully! Signing you in...');

      // Auto sign in with Supabase
      const supabase = createClient();

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError('Account created! Please sign in manually.');
        setIsLoading(false);
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // Redirect to dashboard on success
      setSuccess('Success! Redirecting to dashboard...');
      router.refresh();
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError('Google sign in failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Google sign in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="w-full max-w-md space-y-8 px-4 py-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Wine className="h-12 w-12 text-amber-400" />
          </div>
          <h2 className={`${playfair.className} text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent`}>
            Create Account
          </h2>
          <p className="mt-2 text-gray-400">Start tracking your wine collection</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-8 space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
          {error && (
            <div className="relative rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="relative rounded-lg bg-green-900/20 border border-green-500/30 p-3 text-sm text-green-400">
              {success}
            </div>
          )}
          <div className="relative space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-amber-900/30 bg-[#1A1410] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-amber-900/30 bg-[#1A1410] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-amber-900/30 bg-[#1A1410] px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Must be at least 6 characters
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 text-sm font-semibold text-black hover:from-amber-500 hover:to-yellow-600 hover:scale-105 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-900/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] px-3 text-gray-400">Or continue with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="relative w-full rounded-lg border border-amber-900/30 bg-[#2A1F1A] px-4 py-3 text-sm font-semibold text-amber-400 hover:bg-[#3A2F2A] hover:border-amber-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Google
          </button>
          <p className="relative text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-amber-400 hover:text-yellow-400 transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
