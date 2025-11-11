'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { WineEditModal } from './wine-edit-modal';
import { WineDeleteDialog } from './wine-delete-dialog';

interface Wine {
  id: string;
  name: string;
  full_name: string;
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
  primary_label_image_url: string | null;
  userCount: number;
  bottleCount: number;
  created_at: string;
  updated_at: string;
}

interface WineDataTableProps {
  wines: Wine[];
  onRefresh: () => void;
}

export function WineDataTable({ wines, onRefresh }: WineDataTableProps) {
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [deletingWine, setDeletingWine] = useState<Wine | null>(null);

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Vin</TableHead>
                <TableHead>Producent</TableHead>
                <TableHead>Årgång</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Land/Region</TableHead>
                <TableHead className="text-center">Användare</TableHead>
                <TableHead className="text-center">Flaskor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-neutral-600 py-8">
                    Inga viner hittades
                  </TableCell>
                </TableRow>
              ) : (
                wines.map((wine) => (
                  <TableRow key={wine.id}>
                    <TableCell>
                      {wine.primary_label_image_url ? (
                        <div className="relative w-10 h-12 rounded overflow-hidden bg-neutral-100">
                          <Image
                            src={wine.primary_label_image_url}
                            alt={wine.full_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-12 rounded bg-neutral-100" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-neutral-900">
                      <button
                        onClick={() => setEditingWine(wine)}
                        className="flex items-center gap-2 hover:text-purple-700 transition-colors text-left"
                      >
                        {wine.full_name}
                        {wine.verified && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {wine.producer_name}
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {wine.vintage || 'NV'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {wine.wine_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-700 text-sm">
                      <div>{wine.country}</div>
                      {wine.region && (
                        <div className="text-neutral-600">{wine.region}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                        {wine.userCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium text-neutral-900">
                      {wine.bottleCount}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          wine.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {wine.status === 'active' ? 'Aktiv' : 'Utkast'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingWine(wine)}
                          title="Editera"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingWine(wine)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Ta bort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      {editingWine && (
        <WineEditModal
          wine={editingWine}
          onClose={() => setEditingWine(null)}
          onSave={() => {
            setEditingWine(null);
            onRefresh();
          }}
        />
      )}

      {deletingWine && (
        <WineDeleteDialog
          wine={deletingWine}
          onClose={() => setDeletingWine(null)}
          onDelete={() => {
            setDeletingWine(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
