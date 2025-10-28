import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const userId = process.argv[2];
const search = process.argv[3];

const { data, error } = await supabase
  .from('bottles')
  .select(`*, wine:wines(*)`)
  .eq('user_id', userId)
  .or(`wine.name.ilike.%${search}%,wine.producer_name.ilike.%${search}%`)
  .order('created_at', { ascending: false });

console.log({ data, error });
