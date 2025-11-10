'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Wine {
  id: string;
  full_name: string;
  userCount: number;
  bottleCount: number;
}

interface WineDeleteDialogProps {
  wine: Wine;
  onClose: () => void;
  onDelete: () => void;
}

export function WineDeleteDialog({ wine, onClose, onDelete }: WineDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<{ userCount: number; bottleCount: number } | null>(
    null
  );

  useEffect(() => {
    // Fetch actual impact if not already known
    if (wine.userCount === 0 && wine.bottleCount === 0) {
      setImpact({ userCount: 0, bottleCount: 0 });
    } else {
      setImpact({ userCount: wine.userCount, bottleCount: wine.bottleCount });
    }
  }, [wine]);

  async function handleDelete() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/wines/${wine.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDeletion: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete wine');
      }

      toast({
        title: 'Vin borttaget',
        description: `${wine.full_name} har tagits bort`,
      });

      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Misslyckades',
        description: error instanceof Error ? error.message : 'Kunde inte ta bort vinet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const hasBottles = impact && impact.bottleCount > 0;

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Ta bort vin?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Är du säker på att du vill ta bort <strong>{wine.full_name}</strong>?
            </p>

            {impact && hasBottles && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-900 font-medium mb-2">
                  Varning: Detta kommer att påverka:
                </p>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• {impact.userCount} användare</li>
                  <li>• {impact.bottleCount} flaskor kommer att tas bort</li>
                </ul>
              </div>
            )}

            {impact && !hasBottles && (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <p className="text-sm text-neutral-700">
                  Detta vin har inga flaskor och kan tas bort säkert.
                </p>
              </div>
            )}

            <p className="text-sm text-neutral-600">
              Denna åtgärd kan inte ångras.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tar bort...
              </>
            ) : (
              'Ta bort'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
