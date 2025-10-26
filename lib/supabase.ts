import { createClient } from '@supabase/supabase-js';

// For client-side usage (anon key)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// For server-side usage (service role key - has admin privileges)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Upload wine label image
export async function uploadLabelImage(
  file: File | Buffer,
  userId: string,
  filename: string
): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Create a unique filename with timestamp
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  const uniqueFilename = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('wine-labels')
    .upload(uniqueFilename, file, {
      contentType: file instanceof File ? file.type : 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('wine-labels')
    .getPublicUrl(uniqueFilename);

  return urlData.publicUrl;
}

// Delete wine label image
export async function deleteLabelImage(imageUrl: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Extract the file path from the URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/wine-labels/');
  if (pathParts.length < 2) {
    throw new Error('Invalid image URL');
  }
  const filePath = pathParts[1];

  const { error } = await supabase.storage
    .from('wine-labels')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
