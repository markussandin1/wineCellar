import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';
import type { WineEnrichmentInput } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      producerName,
      wineType,
      vintage,
      country,
      region,
      subRegion,
      primaryGrape,
      primaryLabelImageUrl,
      enrichmentData, // Pre-generated enrichment data from user (edited in preview)
      runEnrichment = false, // DEPRECATED: enrichment should be provided, not generated here
      tastingProfileHints, // DEPRECATED: only used if runEnrichment=true
    } = body;

    // Validate required fields
    if (!name || !producerName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, producerName' },
        { status: 400 }
      );
    }

    // Use enrichment agent's inferred country/region if available
    // The enrichment agent uses wine knowledge to determine country/region with high confidence
    let finalCountry = country;
    let finalRegion = region;

    if (enrichmentData) {
      // Use inferred country from enrichment agent if provided country is missing
      if (!finalCountry && enrichmentData.inferredCountry) {
        finalCountry = enrichmentData.inferredCountry;
        console.log(`Using enrichment agent's inferred country: "${finalCountry}"`);
      }

      // Use inferred region from enrichment agent if provided region is missing
      if (!finalRegion && enrichmentData.inferredRegion) {
        finalRegion = enrichmentData.inferredRegion;
        console.log(`Using enrichment agent's inferred region: "${finalRegion}"`);
      }
    }

    // Check if wine already exists (prevent duplicates)
    const { data: existingWine } = await supabase
      .from('wines')
      .select('id')
      .eq('name', name)
      .eq('producer_name', producerName)
      .eq('vintage', vintage || null)
      .maybeSingle();

    if (existingWine) {
      return NextResponse.json(
        { error: 'Wine already exists', wineId: existingWine.id },
        { status: 409 }
      );
    }

    let finalEnrichmentData = enrichmentData || null;
    let enrichmentGeneratedAt = null;
    let enrichmentVersion = null;

    // BACKWARD COMPATIBILITY: Run wine enrichment if requested (deprecated flow)
    // New flow: enrichmentData should be provided from user preview/edit
    if (runEnrichment && !enrichmentData) {
      console.warn('[DEPRECATED] Running enrichment during wine creation. Use /api/scan-label/enrich instead.');
      console.log('Running wine enrichment for:', name);

      const enrichmentInput: WineEnrichmentInput = {
        name,
        producerName,
        wineType,
        vintage,
        country,
        region,
        subRegion,
        primaryGrape,
        tastingProfileHints: tastingProfileHints || null,
      };

      try {
        const enrichmentResult = await wineEnrichmentAgent.execute(enrichmentInput);

        if (enrichmentResult.success && enrichmentResult.data) {
          finalEnrichmentData = enrichmentResult.data;
          enrichmentGeneratedAt = new Date().toISOString();
          enrichmentVersion = '2.0.0'; // Wine Enrichment Agent V2
          console.log('Wine enrichment successful');
        } else {
          console.error('Wine enrichment failed:', enrichmentResult.error);
          // Continue without enrichment rather than failing completely
        }
      } catch (enrichmentError) {
        console.error('Wine enrichment error:', enrichmentError);
        // Continue without enrichment
      }
    } else if (enrichmentData) {
      // User provided pre-generated enrichment (new flow)
      console.log('Using user-edited enrichment data for:', name);
      enrichmentGeneratedAt = new Date().toISOString();
      enrichmentVersion = '2.0.0'; // Wine Enrichment Agent V2
    }

    // Generate full_name
    const fullNameParts = [name];
    if (producerName && producerName !== name) {
      fullNameParts.push(producerName);
    }
    if (vintage) {
      fullNameParts.push(String(vintage));
    }
    const fullName = fullNameParts.join(' ');

    // Extract ai_generated_summary from enrichment data
    const aiGeneratedSummary = finalEnrichmentData?.summary || null;

    // Create wine in database
    const { data: newWine, error: insertError } = await supabase
      .from('wines')
      .insert({
        name,
        full_name: fullName,
        producer_name: producerName,
        wine_type: wineType,
        vintage,
        country: finalCountry,
        region: finalRegion,
        sub_region: subRegion || null,
        primary_grape: primaryGrape || null,
        primary_label_image_url: primaryLabelImageUrl || null,
        enrichment_data: finalEnrichmentData,
        enrichment_generated_at: enrichmentGeneratedAt,
        enrichment_version: enrichmentVersion,
        ai_generated_summary: aiGeneratedSummary,
        data_source: 'label_scan',
        verified: false,
        status: 'active', // Wine is confirmed and saved
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating wine:', insertError);
      return NextResponse.json(
        { error: 'Failed to create wine in database' },
        { status: 500 }
      );
    }

    console.log('Wine created successfully:', newWine.id);

    return NextResponse.json({
      success: true,
      wine: {
        id: newWine.id,
        name: newWine.name,
        producerName: newWine.producer_name,
        wineType: newWine.wine_type,
        vintage: newWine.vintage,
        country: newWine.country,
        region: newWine.region,
        subRegion: newWine.sub_region,
        primaryGrape: newWine.primary_grape,
        enrichmentData: newWine.enrichment_data,
        primaryLabelImageUrl: newWine.primary_label_image_url,
      },
      enrichmentSucceeded: finalEnrichmentData !== null,
    });
  } catch (error: any) {
    console.error('Wine creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create wine' },
      { status: 500 }
    );
  }
}
