'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { WineEnrichmentOutput } from '@/lib/ai/agents/wine-enrichment/wine-enrichment.types';
import { cn } from '@/lib/utils';

interface WineEnrichmentPreviewProps {
  initialData: WineEnrichmentOutput;
  wineName: string;
  producerName: string;
  vintage?: number;
  onSave: (editedData: WineEnrichmentOutput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <span className="font-semibold text-neutral-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-neutral-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-600" />
        )}
      </button>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

export function WineEnrichmentPreview({
  initialData,
  wineName,
  producerName,
  vintage,
  onSave,
  onCancel,
  isSubmitting = false,
}: WineEnrichmentPreviewProps) {
  const [enrichmentData, setEnrichmentData] = useState<WineEnrichmentOutput>(initialData);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    overview: false,
    terroir: false,
    winemaking: false,
    tastingNotes: true,
    serving: false,
    foodPairings: true,
    signatureTraits: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(enrichmentData);
  };

  const addFoodPairing = () => {
    setEnrichmentData((prev) => ({
      ...prev,
      foodPairings: [...prev.foodPairings, ''],
    }));
  };

  const removeFoodPairing = (index: number) => {
    setEnrichmentData((prev) => ({
      ...prev,
      foodPairings: prev.foodPairings.filter((_, i) => i !== index),
    }));
  };

  const updateFoodPairing = (index: number, value: string) => {
    setEnrichmentData((prev) => ({
      ...prev,
      foodPairings: prev.foodPairings.map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-neutral-900">Review Wine Profile</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {wineName} {vintage && `${vintage}`} - {producerName}
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Please verify the details below are correct. You can edit any section before saving.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary Section */}
          <CollapsibleSection
            title="Summary"
            isOpen={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <textarea
              value={enrichmentData.summary}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, summary: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={3}
              placeholder="Two-sentence summary of the wine..."
            />
          </CollapsibleSection>

          {/* Overview Section */}
          <CollapsibleSection
            title="Overview"
            isOpen={expandedSections.overview}
            onToggle={() => toggleSection('overview')}
          >
            <textarea
              value={enrichmentData.overview}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, overview: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={4}
              placeholder="Overview of producer and wine positioning..."
            />
          </CollapsibleSection>

          {/* Terroir Section */}
          <CollapsibleSection
            title="Terroir"
            isOpen={expandedSections.terroir}
            onToggle={() => toggleSection('terroir')}
          >
            <textarea
              value={enrichmentData.terroir}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, terroir: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={4}
              placeholder="Terroir and vineyard details..."
            />
          </CollapsibleSection>

          {/* Winemaking Section */}
          <CollapsibleSection
            title="Winemaking"
            isOpen={expandedSections.winemaking}
            onToggle={() => toggleSection('winemaking')}
          >
            <textarea
              value={enrichmentData.winemaking}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, winemaking: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={4}
              placeholder="Winemaking techniques..."
            />
          </CollapsibleSection>

          {/* Tasting Notes Section */}
          <CollapsibleSection
            title="Tasting Notes"
            isOpen={expandedSections.tastingNotes}
            onToggle={() => toggleSection('tastingNotes')}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nose (Aromatic Profile)
                </label>
                <textarea
                  value={enrichmentData.tastingNotes.nose}
                  onChange={(e) =>
                    setEnrichmentData((prev) => ({
                      ...prev,
                      tastingNotes: { ...prev.tastingNotes, nose: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
                  rows={2}
                  placeholder="Aromatic profile..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Palate (Flavor Profile & Texture)
                </label>
                <textarea
                  value={enrichmentData.tastingNotes.palate}
                  onChange={(e) =>
                    setEnrichmentData((prev) => ({
                      ...prev,
                      tastingNotes: { ...prev.tastingNotes, palate: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
                  rows={2}
                  placeholder="Flavor profile and texture..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Finish
                </label>
                <textarea
                  value={enrichmentData.tastingNotes.finish}
                  onChange={(e) =>
                    setEnrichmentData((prev) => ({
                      ...prev,
                      tastingNotes: { ...prev.tastingNotes, finish: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
                  rows={2}
                  placeholder="Finish characteristics..."
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Serving Section */}
          <CollapsibleSection
            title="Serving & Cellaring"
            isOpen={expandedSections.serving}
            onToggle={() => toggleSection('serving')}
          >
            <textarea
              value={enrichmentData.serving}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, serving: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={4}
              placeholder="Serving temperature, decanting, drinking window..."
            />
          </CollapsibleSection>

          {/* Food Pairings Section */}
          <CollapsibleSection
            title="Food Pairings"
            isOpen={expandedSections.foodPairings}
            onToggle={() => toggleSection('foodPairings')}
          >
            <div className="space-y-2">
              {enrichmentData.foodPairings.map((pairing, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pairing}
                    onChange={(e) => updateFoodPairing(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-neutral-900 bg-white"
                    placeholder="Food pairing suggestion..."
                  />
                  {enrichmentData.foodPairings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodPairing(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove pairing"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFoodPairing}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                + Add Another Pairing
              </button>
            </div>
          </CollapsibleSection>

          {/* Signature Traits Section */}
          <CollapsibleSection
            title="Signature Traits"
            isOpen={expandedSections.signatureTraits}
            onToggle={() => toggleSection('signatureTraits')}
          >
            <textarea
              value={enrichmentData.signatureTraits}
              onChange={(e) =>
                setEnrichmentData((prev) => ({ ...prev, signatureTraits: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-neutral-900 bg-white"
              rows={3}
              placeholder="What makes this wine distinctive..."
            />
          </CollapsibleSection>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg',
                'hover:bg-amber-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
