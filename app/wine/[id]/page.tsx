'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wine, MapPin, Plus, ArrowLeft, Edit } from 'lucide-react';
import { BottleLabelImage } from '@/components/bottles/bottle-label-image';
import { BottleSizeBadge } from '@/components/bottles/bottle-size-badge';
import { WineProfile } from '@/components/bottles/wine-profile';
import { WineTypeIcon, type WineType, playfair } from '@/lib/design-system';
import { Button } from '@/components/ui/button';

export default function WineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wineId = params.id as string;

  const [wine, setWine] = useState<any>(null);
  const [bottles, setBottles] = useState<any[]>([]);
  const [totalBottles, setTotalBottles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wineId) return;

    fetch(`/api/wines/${wineId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch wine details');
        }
        return res.json();
      })
      .then(data => {
        setWine(data.wine);
        setBottles(data.bottles);
        setTotalBottles(data.totalBottles);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching wine:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [wineId]);

  const getStatusBadge = (status: string) => {
    const styles = {
      in_cellar: 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30',
      consumed: 'bg-gray-700/50 text-gray-300 border border-gray-600/30',
      gifted: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
      other: 'bg-amber-900/50 text-amber-300 border border-amber-500/30',
    };

    const labels: Record<string, string> = {
      in_cellar: 'In cellar',
      consumed: 'Consumed',
      gifted: 'Watch list',
      other: 'Watch list',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.other}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return '—';
    return `${currency || 'USD'} ${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-amber-400">Loading...</div>
      </div>
    );
  }

  if (error || !wine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Wine not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const wineType = (wine.wineType?.toLowerCase() || null) as WineType | null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-sm text-amber-400 hover:text-yellow-400 hover:bg-amber-900/30 transition-colors font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Wine Header */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Label Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <BottleLabelImage
                src={wine.primaryLabelImageUrl}
                alt={`${wine.name} label`}
                wineType={wineType}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Wine Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <WineTypeIcon type={wineType} className="w-10 h-10" />
                <h1 className={`${playfair.className} text-3xl font-bold text-gray-100`}>
                  {wine.fullName || wine.name}
                </h1>
              </div>
              <p className="text-xl text-gray-300 mb-4">
                {wine.producerName}
                {wine.vintage && ` • ${wine.vintage}`}
              </p>

              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <MapPin className="h-5 w-5" />
                <span>
                  {wine.region}
                  {wine.subRegion && `, ${wine.subRegion}`}
                  {wine.country && ` • ${wine.country}`}
                </span>
              </div>

              {wine.primaryGrape && (
                <p className="text-gray-300 mb-2">
                  <span className="text-gray-400">Grape:</span> {wine.primaryGrape}
                </p>
              )}

              {wine.alcoholPercentage && (
                <p className="text-gray-300 mb-2">
                  <span className="text-gray-400">Alcohol:</span> {wine.alcoholPercentage}%
                </p>
              )}

              {wine.aiGeneratedSummary && (
                <p className="text-gray-300 mt-4 italic">
                  {wine.aiGeneratedSummary}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-amber-900/30">
              <div className="flex items-center gap-2 text-amber-400">
                <Wine className="h-5 w-5" />
                <span className="font-semibold">{totalBottles} bottle{totalBottles !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wine Profile (Enrichment Data) */}
        {wine.enrichmentData && (
          <div className="mb-8">
            <WineProfile enrichmentData={wine.enrichmentData} />
          </div>
        )}

        {/* User's Bottles */}
        <div className="rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-900/30 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-amber-400">Your Collection</h2>
            <Link href="/cellar/add">
              <Button className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Bottle
              </Button>
            </Link>
          </div>

          {bottles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-900/20 bg-black/30">
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Size</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Qty</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Purchase Date</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Price</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Location</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bottles.map((bottle) => (
                    <tr
                      key={bottle.id}
                      className="border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">{bottle.bottleSize}ml</span>
                          <BottleSizeBadge sizeInMl={bottle.bottleSize} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {bottle.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatDate(bottle.purchaseDate)}
                      </td>
                      <td className="px-4 py-3 text-amber-400">
                        {formatPrice(bottle.purchasePrice, bottle.currency)}
                        {bottle.quantity > 1 && bottle.purchasePrice && (
                          <div className="text-xs text-gray-500">
                            ({formatPrice(bottle.purchasePrice, bottle.currency)}/bottle)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {bottle.storageLocation || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(bottle.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/bottle/${bottle.id}`}>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 mb-4">You don&apos;t have any bottles of this wine yet.</p>
              <Link href="/cellar/add">
                <Button className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bottle
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
