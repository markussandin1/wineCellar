'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Wine {
  id: string;
  full_name: string;
  producer_name: string;
  vintage: number | null;
  wine_type: string;
  country: string;
  region: string;
}

interface WineEnrichmentModalProps {
  wine: Wine;
  onClose: () => void;
  onSave: () => void;
}

export function WineEnrichmentModal({ wine, onClose, onSave }: WineEnrichmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const [enrichment, setEnrichment] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  async function handleGenerate() {
    setLoading(true);

    try {
      const res = await fetch('/api/admin/enrich-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wineId: wine.id,
          context: context || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate enrichment');
      }

      const data = await res.json();
      setEnrichment(data.enrichment);
      setStep('preview');

      toast({
        title: 'Beskrivning genererad',
        description: 'Granska beskrivningen innan du sparar',
      });
    } catch (error) {
      console.error('Enrichment error:', error);
      toast({
        title: 'Misslyckades',
        description: 'Kunde inte generera vinbeskrivning',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/wines/${wine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_generated_summary: enrichment.summary,
          enrichment_overview: enrichment.overview,
          enrichment_terroir: enrichment.terroir,
          enrichment_winemaking: enrichment.winemaking,
          enrichment_tasting_notes_nose: enrichment.tastingNotes?.nose,
          enrichment_tasting_notes_palate: enrichment.tastingNotes?.palate,
          enrichment_tasting_notes_finish: enrichment.tastingNotes?.finish,
          enrichment_serving_suggestions: enrichment.serving,
          enrichment_food_pairings: enrichment.foodPairings,
          enrichment_signature_traits: enrichment.signatureTraits,
          enrichment_version: new Date().toISOString(),
          enrichment_generated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save enrichment');
      }

      toast({
        title: 'Beskrivning sparad',
        description: 'Vinbeskrivningen har uppdaterats',
      });

      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Misslyckades',
        description: 'Kunde inte spara beskrivningen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generera vinbeskrivning
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-4">
                Genererar sommelierkvalitet beskrivning för:{' '}
                <strong>{wine.full_name}</strong>
              </p>

              <Label htmlFor="context">
                Extra information (valfritt)
              </Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="T.ex. provningsanteckningar, producent-detaljer, eller annan information som kan förbättra beskrivningen..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-neutral-500 mt-2">
                All extra information du lägger till kommer att användas för att skapa en mer träffsäker beskrivning
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generera beskrivning
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && enrichment && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-neutral-50 space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-neutral-700 mb-2">
                  Sammanfattning
                </h4>
                <p className="text-sm text-neutral-900">{enrichment.summary}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-neutral-700 mb-2">
                  Översikt
                </h4>
                <p className="text-sm text-neutral-900">{enrichment.overview}</p>
              </div>

              {enrichment.terroir && (
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">
                    Terroir
                  </h4>
                  <p className="text-sm text-neutral-900">{enrichment.terroir}</p>
                </div>
              )}

              {enrichment.tastingNotes && (
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">
                    Provningsanteckningar
                  </h4>
                  <div className="space-y-2 text-sm text-neutral-900">
                    {enrichment.tastingNotes.nose && (
                      <p>
                        <strong>Doft:</strong> {enrichment.tastingNotes.nose}
                      </p>
                    )}
                    {enrichment.tastingNotes.palate && (
                      <p>
                        <strong>Smak:</strong> {enrichment.tastingNotes.palate}
                      </p>
                    )}
                    {enrichment.tastingNotes.finish && (
                      <p>
                        <strong>Eftersmak:</strong> {enrichment.tastingNotes.finish}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {enrichment.foodPairings && enrichment.foodPairings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">
                    Matpar
                  </h4>
                  <ul className="text-sm text-neutral-900 list-disc list-inside space-y-1">
                    {enrichment.foodPairings.map((pairing: string, i: number) => (
                      <li key={i}>{pairing}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('input');
                  setEnrichment(null);
                }}
              >
                Tillbaka
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  'Spara beskrivning'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
