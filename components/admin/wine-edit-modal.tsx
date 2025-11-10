'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

interface WineEditModalProps {
  wine: Wine;
  onClose: () => void;
  onSave: () => void;
}

export function WineEditModal({ wine, onClose, onSave }: WineEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editera vin</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Grundläggande information</h3>

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
            <h3 className="font-semibold">Plats</h3>

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
            <h3 className="font-semibold">Egenskaper</h3>

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
            <h3 className="font-semibold">Status</h3>

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
