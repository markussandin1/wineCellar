import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const producer = searchParams.get('producer');
    const type = searchParams.get('type'); // 'producer' or 'wine'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Autocomplete for producers
    if (type === 'producer') {
      const { data: wines, error } = await supabase
        .from('wines')
        .select('producerName')
        .ilike('producerName', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching producers:', error);
        return NextResponse.json({ error: 'Failed to fetch producers' }, { status: 500 });
      }

      // Extract unique producer names
      const uniqueProducers = [...new Set(wines?.map((w) => w.producerName) || [])];
      return NextResponse.json({ results: uniqueProducers });
    }

    // Autocomplete for wines
    if (type === 'wine') {
      let queryBuilder = supabase
        .from('wines')
        .select('id, name, producerName, vintage, wineType, country, region, subRegion, primaryGrape, primaryLabelImageUrl')
        .ilike('name', `%${query}%`);

      // Filter by producer if provided
      if (producer) {
        queryBuilder = queryBuilder.ilike('producerName', `%${producer}%`);
      }

      const { data: wines, error } = await queryBuilder
        .order('name', { ascending: true })
        .order('vintage', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching wines:', error);
        return NextResponse.json({ error: 'Failed to fetch wines' }, { status: 500 });
      }

      return NextResponse.json({ results: wines || [] });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch autocomplete results' },
      { status: 500 }
    );
  }
}
