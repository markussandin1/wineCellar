'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface Wine {
  id: string;
  full_name: string;
  name: string;
  producer_name: string;
  vintage: number | null;
  wine_type: string;
  primary_grape: string;
  country: string;
  region: string;
  sub_region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  sweetness_level: string | null;
  body: string | null;
  status: 'draft' | 'active';
  verified: boolean;
  primary_label_image_url?: string | null;
  ai_generated_summary?: string | null;
  enrichment_data?: any;
  created_at?: string;
  updated_at?: string;
}

interface WineEditModalProps {
  wine: Wine;
  onClose: () => void;
  onSave: () => void;
  onRegenerateEnrichment?: () => void;
}

export function WineEditModal({ wine, onClose, onSave, onRegenerateEnrichment }: WineEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const enrichment = wine.enrichment_data || {};

  const [formData, setFormData] = useState({
    // Basic fields
    name: wine.name || wine.full_name,
    producer_name: wine.producer_name,
    vintage: wine.vintage?.toString() || '',
    wine_type: wine.wine_type,
    primary_grape: wine.primary_grape || '',
    country: wine.country,
    region: wine.region || '',
    sub_region: wine.sub_region || '',
    appellation: wine.appellation || '',
    alcohol_percentage: wine.alcohol_percentage?.toString() || '',
    sweetness_level: wine.sweetness_level || '',
    body: wine.body || '',
    status: wine.status,
    verified: wine.verified,
    // Enrichment fields
    ai_generated_summary: wine.ai_generated_summary || '',
    enrichment_overview: enrichment.overview || '',
    enrichment_terroir: enrichment.terroir || '',
    enrichment_winemaking: enrichment.winemaking || '',
    enrichment_tasting_notes_nose: enrichment.tastingNotes?.nose || '',
    enrichment_tasting_notes_palate: enrichment.tastingNotes?.palate || '',
    enrichment_tasting_notes_finish: enrichment.tastingNotes?.finish || '',
    enrichment_serving: enrichment.serving || '',
    enrichment_food_pairings: Array.isArray(enrichment.foodPairings) ? enrichment.foodPairings : [],
    enrichment_signature_traits: enrichment.signatureTraits || '',
  });

  const addFoodPairing = () => {
    setFormData({
      ...formData,
      enrichment_food_pairings: [...formData.enrichment_food_pairings, '']
    });
  };

  const removeFoodPairing = (index: number) => {
    setFormData({
      ...formData,
      enrichment_food_pairings: formData.enrichment_food_pairings.filter((_, i) => i !== index)
    });
  };

  const updateFoodPairing = (index: number, value: string) => {
    const updated = [...formData.enrichment_food_pairings];
    updated[index] = value;
    setFormData({ ...formData, enrichment_food_pairings: updated });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Build enrichment_data JSONB object
      const enrichmentData = {
        summary: formData.ai_generated_summary,
        overview: formData.enrichment_overview,
        terroir: formData.enrichment_terroir,
        winemaking: formData.enrichment_winemaking,
        tastingNotes: {
          nose: formData.enrichment_tasting_notes_nose,
          palate: formData.enrichment_tasting_notes_palate,
          finish: formData.enrichment_tasting_notes_finish,
        },
        serving: formData.enrichment_serving,
        foodPairings: formData.enrichment_food_pairings.filter(p => p.trim() !== ''),
        signatureTraits: formData.enrichment_signature_traits,
      };

      const updates: any = {
        name: formData.name,
        producer_name: formData.producer_name,
        vintage: formData.vintage ? parseInt(formData.vintage) : null,
        wine_type: formData.wine_type,
        primary_grape: formData.primary_grape,
        country: formData.country,
        region: formData.region,
        sub_region: formData.sub_region || null,
        appellation: formData.appellation || null,
        alcohol_percentage: formData.alcohol_percentage
          ? parseFloat(formData.alcohol_percentage)
          : null,
        sweetness_level: formData.sweetness_level || null,
        body: formData.body || null,
        status: formData.status,
        verified: formData.verified,
        // Enrichment fields
        ai_generated_summary: formData.ai_generated_summary,
        enrichment_data: enrichmentData,
      };

      // Update full_name if name, producer, or vintage changed
      updates.full_name = [
        updates.name,
        `by ${updates.producer_name}`,
        updates.vintage || 'NV',
      ].join(' ');

      const res = await fetch(`/api/admin/wines/${wine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update wine');
      }

      toast({
        title: 'Vin uppdaterad',
        description: 'Ändringarna har sparats',
      });

      onSave();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Misslyckades',
        description: 'Kunde inte uppdatera vinet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {wine.primary_label_image_url && (
              <div className="relative w-12 h-16 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                <Image
                  src={wine.primary_label_image_url}
                  alt={wine.full_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <div>Editera vin</div>
              <div className="text-sm font-normal text-neutral-700 mt-1">
                {wine.full_name}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Grundläggande information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vinnamn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="producer">Producent</Label>
                <Input
                  id="producer"
                  value={formData.producer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, producer_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="vintage">Årgång</Label>
                <Input
                  id="vintage"
                  type="number"
                  value={formData.vintage}
                  onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                  placeholder="NV"
                />
              </div>

              <div>
                <Label htmlFor="wineType">Vintyp</Label>
                <Select
                  value={formData.wine_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, wine_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Rött</SelectItem>
                    <SelectItem value="White">Vitt</SelectItem>
                    <SelectItem value="Rosé">Rosé</SelectItem>
                    <SelectItem value="Sparkling">Mousserande</SelectItem>
                    <SelectItem value="Dessert">Dessertvin</SelectItem>
                    <SelectItem value="Fortified">Starkvin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grape">Primär druva</Label>
                <Input
                  id="grape"
                  value={formData.primary_grape}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_grape: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="alcohol">Alkoholhalt (%)</Label>
                <Input
                  id="alcohol"
                  type="number"
                  step="0.1"
                  value={formData.alcohol_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, alcohol_percentage: e.target.value })
                  }
                  placeholder="13.5"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Plats</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="subRegion">Subregion</Label>
                <Input
                  id="subRegion"
                  value={formData.sub_region}
                  onChange={(e) =>
                    setFormData({ ...formData, sub_region: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="appellation">Appellation</Label>
                <Input
                  id="appellation"
                  value={formData.appellation}
                  onChange={(e) =>
                    setFormData({ ...formData, appellation: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Characteristics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Egenskaper</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sweetness">Sötma</Label>
                <Select
                  value={formData.sweetness_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sweetness_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Torr</SelectItem>
                    <SelectItem value="off-dry">Halvtorr</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="sweet">Söt</SelectItem>
                    <SelectItem value="very_sweet">Mycket söt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="body">Kropp</Label>
                <Select
                  value={formData.body}
                  onValueChange={(value) => setFormData({ ...formData, body: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Lätt</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="full">Fyllig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Status</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'active') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="draft">Utkast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) =>
                      setFormData({ ...formData, verified: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                  <span className="text-sm">Verifierat vin</span>
                </label>
              </div>
            </div>
          </div>

          {/* Descriptions & Enrichment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Beskrivningar & Enrichment</h3>
              {onRegenerateEnrichment && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRegenerateEnrichment}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Regenerera med AI
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="summary">Sammanfattning</Label>
              <Textarea
                id="summary"
                value={formData.ai_generated_summary}
                onChange={(e) =>
                  setFormData({ ...formData, ai_generated_summary: e.target.value })
                }
                rows={3}
                placeholder="Kort beskrivning av vinet (2-3 meningar)"
              />
            </div>

            <div>
              <Label htmlFor="overview">Översikt</Label>
              <Textarea
                id="overview"
                value={formData.enrichment_overview}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_overview: e.target.value })
                }
                rows={4}
                placeholder="Översikt av producent och vinets positionering"
              />
            </div>

            <div>
              <Label htmlFor="terroir">Terroir</Label>
              <Textarea
                id="terroir"
                value={formData.enrichment_terroir}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_terroir: e.target.value })
                }
                rows={4}
                placeholder="Terroir och vingårdsdetaljer"
              />
            </div>

            <div>
              <Label htmlFor="winemaking">Vinframställning</Label>
              <Textarea
                id="winemaking"
                value={formData.enrichment_winemaking}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_winemaking: e.target.value })
                }
                rows={4}
                placeholder="Vinframställningstekniker"
              />
            </div>
          </div>

          {/* Tasting Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Provningsanteckningar</h3>

            <div>
              <Label htmlFor="nose">Doft</Label>
              <Textarea
                id="nose"
                value={formData.enrichment_tasting_notes_nose}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_tasting_notes_nose: e.target.value })
                }
                rows={3}
                placeholder="Aromatisk profil"
              />
            </div>

            <div>
              <Label htmlFor="palate">Smak</Label>
              <Textarea
                id="palate"
                value={formData.enrichment_tasting_notes_palate}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_tasting_notes_palate: e.target.value })
                }
                rows={3}
                placeholder="Smakprofil och textur"
              />
            </div>

            <div>
              <Label htmlFor="finish">Eftersmak</Label>
              <Textarea
                id="finish"
                value={formData.enrichment_tasting_notes_finish}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_tasting_notes_finish: e.target.value })
                }
                rows={3}
                placeholder="Eftersmakens karaktär"
              />
            </div>
          </div>

          {/* Serving & Food Pairings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Servering & Matpar</h3>

            <div>
              <Label htmlFor="serving">Servering</Label>
              <Textarea
                id="serving"
                value={formData.enrichment_serving}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_serving: e.target.value })
                }
                rows={3}
                placeholder="Serverings- och lagringsråd"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Matpar</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFoodPairing}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Lägg till
                </Button>
              </div>

              <div className="space-y-2">
                {formData.enrichment_food_pairings.length === 0 ? (
                  <p className="text-sm text-neutral-600 italic">Inga matpar ännu. Klicka "Lägg till" för att lägga till.</p>
                ) : (
                  formData.enrichment_food_pairings.map((pairing, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pairing}
                        onChange={(e) => updateFoodPairing(index, e.target.value)}
                        placeholder="T.ex. Grillat rött kött"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFoodPairing(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="signatureTraits">Signatur egenskaper</Label>
              <Textarea
                id="signatureTraits"
                value={formData.enrichment_signature_traits}
                onChange={(e) =>
                  setFormData({ ...formData, enrichment_signature_traits: e.target.value })
                }
                rows={3}
                placeholder="Egenskaper som gör vinet distinktivt"
              />
            </div>
          </div>

          {/* Metadata (read-only) */}
          {(wine.created_at || wine.updated_at) && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h3 className="font-semibold text-sm text-neutral-700">Metadata</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {wine.created_at && (
                  <div>
                    <span className="text-neutral-700">Skapad:</span>{' '}
                    <span className="text-neutral-900">
                      {new Date(wine.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                )}
                {wine.updated_at && (
                  <div>
                    <span className="text-neutral-700">Uppdaterad:</span>{' '}
                    <span className="text-neutral-900">
                      {new Date(wine.updated_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara ändringar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
