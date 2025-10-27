import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pktiwlfxgfkkqxzhtaxe.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdGl3bGZ4Z2Zra3F4emh0YXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTEwMTEsImV4cCI6MjA3Njk2NzAxMX0.5AV3OaWeLiLliq5GTpbrzWav4Gd_KNaceAyK14BRi4I';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
