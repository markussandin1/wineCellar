'use client';
import { useMemo } from 'react';
import { playfair } from '@/lib/design-system';
import { hasText, type WineProfileEnrichment } from './wine-profile.utils';
interface WineProfileProps {
  enrichmentData?: WineProfileEnrichment | null;
}
export function WineProfile({ enrichmentData }: WineProfileProps) {
  const structuredSections = useMemo(() => {
    if (!enrichmentData) return [];

    const sections: Array<{ title: string; body: string }> = [];
    if (hasText(enrichmentData.overview)) {
      sections.push({ title: 'Overview', body: enrichmentData.overview!.trim() });
    }
    if (hasText(enrichmentData.terroir)) {
      sections.push({ title: 'Terroir', body: enrichmentData.terroir!.trim() });
    }
    if (hasText(enrichmentData.winemaking)) {
      sections.push({ title: 'Winemaking', body: enrichmentData.winemaking!.trim() });
    }
    if (hasText(enrichmentData.serving)) {
      sections.push({ title: 'Serving & Cellaring', body: enrichmentData.serving!.trim() });
    }

    return sections;
  }, [enrichmentData]);

  const tastingNotes = {
    nose: enrichmentData?.tastingNotes?.nose,
    palate: enrichmentData?.tastingNotes?.palate,
    finish: enrichmentData?.tastingNotes?.finish,
  };
  const hasTastingNotes = Object.values(tastingNotes).some((value) => hasText(value));

  const foodPairings = (enrichmentData?.foodPairings || []).filter((item) => hasText(item));
  const hasFoodPairings = foodPairings.length > 0;

  const signatureTraits = enrichmentData?.signatureTraits;

  const hasStructuredContent =
    structuredSections.length > 0 || hasTastingNotes || hasFoodPairings || hasText(signatureTraits);

  if (!hasStructuredContent) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
      <div className="relative space-y-6">
        <h2 className={`${playfair.className} text-xl font-semibold text-gray-100`}>Wine Profile</h2>

        {structuredSections.map((section) => (
          <div key={section.title}>
            <div className="text-sm font-medium text-amber-200 mb-2">{section.title}</div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{section.body}</p>
          </div>
        ))}

        {hasTastingNotes && (
          <div>
            <div className="text-sm font-medium text-amber-200 mb-2">Tasting Notes</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              {hasText(tastingNotes.nose) && (
                <div>
                  <div className="font-semibold text-amber-100">Nose</div>
                  <p className="text-gray-300 mt-1">{tastingNotes.nose}</p>
                </div>
              )}
              {hasText(tastingNotes.palate) && (
                <div>
                  <div className="font-semibold text-amber-100">Palate</div>
                  <p className="text-gray-300 mt-1">{tastingNotes.palate}</p>
                </div>
              )}
              {hasText(tastingNotes.finish) && (
                <div>
                  <div className="font-semibold text-amber-100">Finish</div>
                  <p className="text-gray-300 mt-1">{tastingNotes.finish}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {hasFoodPairings && (
          <div>
            <div className="text-sm font-medium text-amber-200 mb-2">Food Pairings</div>
            <div className="flex flex-wrap gap-2">
              {foodPairings.map((pairing) => (
                <span
                  key={pairing.trim()}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-amber-900/30 border border-amber-500/30 text-amber-200"
                >
                  {pairing}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasText(signatureTraits) && (
          <div>
            <div className="text-sm font-medium text-amber-200 mb-2">Signature Traits</div>
            <p className="text-sm text-gray-300 leading-relaxed">{signatureTraits}</p>
          </div>
        )}
      </div>
    </div>
  );
}
