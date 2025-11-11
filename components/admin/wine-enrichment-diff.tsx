'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X } from 'lucide-react';
import type { WineDataSuggestions } from '@/lib/ai/agents/wine-enrichment/wine-enrichment.types';

/**
 * Single field diff row
 */
interface FieldDiff {
  field: string;
  label: string;
  currentValue: string | number | null;
  suggestedValue: string | number | null;
  hasChanged: boolean;
  group: 'basic' | 'location' | 'enrichment' | 'tasting';
}

interface WineEnrichmentDiffProps {
  currentWine: {
    name: string;
    producer_name: string;
    wine_type: string | null;
    vintage: number | null;
    primary_grape: string | null;
    alcohol_content: number | null;
    sweetness_level: string | null;
    body: string | null;
    country: string | null;
    region: string | null;
    sub_region: string | null;
    appellation: string | null;
    ai_generated_summary: string | null;
    enrichment_data: any;
  };
  suggestions: WineDataSuggestions;
  onApplyChanges: (selectedFields: string[]) => void;
  onCancel: () => void;
  isApplying?: boolean;
}

export function WineEnrichmentDiff({
  currentWine,
  suggestions,
  onApplyChanges,
  onCancel,
  isApplying = false,
}: WineEnrichmentDiffProps) {
  // Calculate all field diffs
  const fieldDiffs = useMemo<FieldDiff[]>(() => {
    const diffs: FieldDiff[] = [];

    // Basic data fields
    const basicFields: Array<[string, string, string | number | null, string | number | null]> = [
      ['name', 'Vinnamn', currentWine.name, suggestions.basicData.name],
      ['producer_name', 'Producent', currentWine.producer_name, suggestions.basicData.producerName],
      ['wine_type', 'Vintyp', currentWine.wine_type, suggestions.basicData.wineType],
      ['vintage', 'Årgång', currentWine.vintage, suggestions.basicData.vintage],
      ['primary_grape', 'Druvsort', currentWine.primary_grape, suggestions.basicData.primaryGrape],
      ['alcohol_content', 'Alkoholhalt', currentWine.alcohol_content, suggestions.basicData.alcoholContent],
      ['sweetness_level', 'Sötma', currentWine.sweetness_level, suggestions.basicData.sweetnessLevel],
      ['body', 'Kropp', currentWine.body, suggestions.basicData.body],
    ];

    basicFields.forEach(([field, label, current, suggested]) => {
      const hasChanged = String(current || '').trim() !== String(suggested || '').trim();
      diffs.push({
        field,
        label,
        currentValue: current,
        suggestedValue: suggested,
        hasChanged,
        group: 'basic',
      });
    });

    // Location fields
    const locationFields: Array<[string, string, string | null, string | null]> = [
      ['country', 'Land', currentWine.country, suggestions.locationData.country],
      ['region', 'Region', currentWine.region, suggestions.locationData.region],
      ['sub_region', 'Subregion', currentWine.sub_region, suggestions.locationData.subRegion],
      ['appellation', 'Appellation', currentWine.appellation, suggestions.locationData.appellation],
    ];

    locationFields.forEach(([field, label, current, suggested]) => {
      const hasChanged = String(current || '').trim() !== String(suggested || '').trim();
      diffs.push({
        field,
        label,
        currentValue: current,
        suggestedValue: suggested,
        hasChanged,
        group: 'location',
      });
    });

    // Enrichment fields
    const enrichment = currentWine.enrichment_data || {};
    const enrichmentFields: Array<[string, string, string, string]> = [
      ['ai_generated_summary', 'Sammanfattning', currentWine.ai_generated_summary || '', suggestions.enrichmentData.summary],
      ['enrichment_overview', 'Översikt', enrichment.overview || '', suggestions.enrichmentData.overview],
      ['enrichment_terroir', 'Terroir', enrichment.terroir || '', suggestions.enrichmentData.terroir],
      ['enrichment_winemaking', 'Vinframställning', enrichment.winemaking || '', suggestions.enrichmentData.winemaking],
      ['enrichment_serving', 'Servering', enrichment.serving || '', suggestions.enrichmentData.serving],
      ['enrichment_signature_traits', 'Signatur egenskaper', enrichment.signatureTraits || '', suggestions.enrichmentData.signatureTraits],
    ];

    enrichmentFields.forEach(([field, label, current, suggested]) => {
      const hasChanged = current.trim() !== suggested.trim();
      diffs.push({
        field,
        label,
        currentValue: current,
        suggestedValue: suggested,
        hasChanged,
        group: 'enrichment',
      });
    });

    // Tasting notes
    const tastingNotes = enrichment.tastingNotes || {};
    const tastingFields: Array<[string, string, string, string]> = [
      ['enrichment_tasting_notes_nose', 'Doft', tastingNotes.nose || '', suggestions.enrichmentData.tastingNotes.nose],
      ['enrichment_tasting_notes_palate', 'Smak', tastingNotes.palate || '', suggestions.enrichmentData.tastingNotes.palate],
      ['enrichment_tasting_notes_finish', 'Eftersmak', tastingNotes.finish || '', suggestions.enrichmentData.tastingNotes.finish],
    ];

    tastingFields.forEach(([field, label, current, suggested]) => {
      const hasChanged = current.trim() !== suggested.trim();
      diffs.push({
        field,
        label,
        currentValue: current,
        suggestedValue: suggested,
        hasChanged,
        group: 'tasting',
      });
    });

    // Food pairings (special handling for array)
    const currentPairings = Array.isArray(enrichment.foodPairings) ? enrichment.foodPairings.join(', ') : '';
    const suggestedPairings = suggestions.enrichmentData.foodPairings.join(', ');
    diffs.push({
      field: 'enrichment_food_pairings',
      label: 'Matpar',
      currentValue: currentPairings,
      suggestedValue: suggestedPairings,
      hasChanged: currentPairings !== suggestedPairings,
      group: 'enrichment',
    });

    return diffs;
  }, [currentWine, suggestions]);

  // Track selected fields (all changed fields selected by default)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => {
    return new Set(fieldDiffs.filter((diff) => diff.hasChanged).map((diff) => diff.field));
  });

  const toggleField = (field: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFields(new Set(fieldDiffs.filter((diff) => diff.hasChanged).map((diff) => diff.field)));
  };

  const deselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleApply = () => {
    onApplyChanges(Array.from(selectedFields));
  };

  const changedCount = fieldDiffs.filter((diff) => diff.hasChanged).length;
  const selectedCount = selectedFields.size;

  // Group diffs
  const basicDiffs = fieldDiffs.filter((diff) => diff.group === 'basic');
  const locationDiffs = fieldDiffs.filter((diff) => diff.group === 'location');
  const enrichmentDiffs = fieldDiffs.filter((diff) => diff.group === 'enrichment');
  const tastingDiffs = fieldDiffs.filter((diff) => diff.group === 'tasting');

  return (
    <div className="border rounded-lg bg-neutral-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Förslag från AI-granskning</h3>
          <p className="text-sm text-neutral-700">
            {changedCount} föreslagna ändringar • {selectedCount} valda
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            Välj alla
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
            Avmarkera alla
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Data */}
        <DiffSection title="Grundläggande information" diffs={basicDiffs} selectedFields={selectedFields} onToggle={toggleField} />

        {/* Location */}
        <DiffSection title="Plats" diffs={locationDiffs} selectedFields={selectedFields} onToggle={toggleField} />

        {/* Enrichment */}
        <DiffSection title="Beskrivningar" diffs={enrichmentDiffs} selectedFields={selectedFields} onToggle={toggleField} />

        {/* Tasting Notes */}
        <DiffSection title="Provningsanteckningar" diffs={tastingDiffs} selectedFields={selectedFields} onToggle={toggleField} />
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t">
        <Button type="button" onClick={handleApply} disabled={selectedCount === 0 || isApplying}>
          {isApplying ? 'Tillämpar...' : `Tillämpa ${selectedCount} ändringar`}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isApplying}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

/**
 * Diff section for a group of fields
 */
interface DiffSectionProps {
  title: string;
  diffs: FieldDiff[];
  selectedFields: Set<string>;
  onToggle: (field: string) => void;
}

function DiffSection({ title, diffs, selectedFields, onToggle }: DiffSectionProps) {
  const changedDiffs = diffs.filter((diff) => diff.hasChanged);

  if (changedDiffs.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-900 mb-3">{title}</h4>
      <div className="space-y-3">
        {changedDiffs.map((diff) => (
          <DiffRow key={diff.field} diff={diff} isSelected={selectedFields.has(diff.field)} onToggle={() => onToggle(diff.field)} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single diff row with checkbox
 */
interface DiffRowProps {
  diff: FieldDiff;
  isSelected: boolean;
  onToggle: () => void;
}

function DiffRow({ diff, isSelected, onToggle }: DiffRowProps) {
  const isLongText = typeof diff.suggestedValue === 'string' && diff.suggestedValue.length > 100;

  return (
    <div className="flex gap-3 items-start bg-white rounded border p-3">
      <Checkbox checked={isSelected} onCheckedChange={onToggle} className="mt-1" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-900 mb-1">{diff.label}</div>
        <div className={`grid ${isLongText ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
          {/* Current value */}
          <div className="min-w-0">
            <div className="text-xs text-neutral-600 mb-1">Nuvarande</div>
            <div className="text-sm text-neutral-700 bg-red-50 border border-red-200 rounded px-2 py-1 line-through">
              {diff.currentValue || <span className="text-neutral-400 italic">Tom</span>}
            </div>
          </div>

          {/* Suggested value */}
          <div className="min-w-0">
            <div className="text-xs text-neutral-600 mb-1">Föreslagen</div>
            <div className="text-sm text-neutral-900 bg-green-50 border border-green-200 rounded px-2 py-1 font-medium">
              {diff.suggestedValue || <span className="text-neutral-400 italic">Tom</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
