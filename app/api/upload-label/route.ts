import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadLabelImage } from '@/lib/supabase';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 10MB' }, { status: 400 });
    }

    // Upload image to Supabase
    const buffer = Buffer.from(await image.arrayBuffer());
    const imageUrl = await uploadLabelImage(buffer, user.id, image.name);

    return NextResponse.json({
      success: true,
      imageUrl
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
