import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
      const producers = await prisma.wine.findMany({
        where: {
          producerName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          producerName: true,
        },
        distinct: ['producerName'],
        take: 10,
      });

      const uniqueProducers = producers.map((p) => p.producerName);
      return NextResponse.json({ results: uniqueProducers });
    }

    // Autocomplete for wines
    if (type === 'wine') {
      const where: any = {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      };

      // Filter by producer if provided
      if (producer) {
        where.producerName = {
          contains: producer,
          mode: 'insensitive',
        };
      }

      const wines = await prisma.wine.findMany({
        where,
        select: {
          id: true,
          name: true,
          producerName: true,
          vintage: true,
          wineType: true,
          country: true,
          region: true,
          subRegion: true,
          primaryGrape: true,
          primaryLabelImageUrl: true,
        },
        take: 10,
        orderBy: [
          { name: 'asc' },
          { vintage: 'desc' },
        ],
      });

      return NextResponse.json({ results: wines });
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
