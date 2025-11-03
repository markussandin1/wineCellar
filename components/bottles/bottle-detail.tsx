'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, ArrowLeft, GlassWater } from 'lucide-react';
import { deleteBottle } from '@/app/actions/bottle';
import { ConsumeBottleModal } from './consume-bottle-modal';
import { EditBottleModal } from './edit-bottle-modal';
import { WineTypeIcon, playfair } from '@/lib/design-system';

type Bottle = {
  id: string;
  quantity: number;
  purchasePrice: string | null;
  currency: string | null;
  purchaseDate: Date | null;
  purchaseLocation: string | null;
  storageLocation: string | null;
  status: string;
  rating: number | null;
  personalNotes: string | null;
  tags: string[];
  acquisitionMethod: string;
  createdAt: Date;
  labelImageUrl: string | null;
  wine: {
    id: string;
    name: string;
    fullName: string | null;
    vintage: number | null;
    producerName: string;
    wineType: string;
    country: string;
    region: string;
    subRegion: string | null;
    primaryGrape: string | null;
    primaryLabelImageUrl: string | null;
    description?: string | null;
    aiGeneratedSummary?: string | null;
  } | null;
  consumptionLogs: Array<{
    id: string;
    consumedDate: Date;
    rating: number | null;
    tastingNotes: string | null;
    occasion: string | null;
  }>;
};

type DescriptionBlock =
  | { type: 'paragraph'; body: string }
  | { type: 'section'; title: string; body: string }
  | { type: 'list'; title: string; items: string[] };

export function BottleDetail({ bottle }: { bottle: Bottle }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const statusLabels: Record<string, string> = {
    in_cellar: 'In cellar',
    consumed: 'Consumed',
    gifted: 'Watch list',
    other: 'Watch list',
  };

  // Format date consistently for SSR hydration
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const parsedDescription = useMemo<DescriptionBlock[]>(() => {
    const description = bottle.wine?.description;
    if (!description) return [];

    return description
      .split('\n\n')
      .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
      .filter((lines) => lines.length > 0)
      .map((lines) => {
        if (lines.length === 1) {
          return { type: 'paragraph', body: lines[0] };
        }

        const [heading, ...rest] = lines;
        const listItems = rest.filter((line) => line.startsWith('• ')).map((line) => line.replace(/^•\s*/, ''));

        if (listItems.length === rest.length && listItems.length > 0) {
          return { type: 'list', title: heading, items: listItems };
        }

        return { type: 'section', title: heading, body: rest.join('\n') };
      });
  }, [bottle.wine?.description]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBottle(bottle.id);
    } catch (error) {
      console.error('Error deleting bottle:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/cellar"
            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-yellow-400 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cellar
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-900/30 bg-[#2A1F1A] px-3 py-2 text-sm font-semibold text-amber-400 hover:bg-[#3A2F2A] hover:border-amber-400/50 transition-all"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            {bottle.status === 'in_cellar' && bottle.quantity > 0 && (
              <button
                onClick={() => setShowConsumeModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-2 text-sm font-semibold text-black hover:from-amber-500 hover:to-yellow-600 hover:scale-105 shadow-lg shadow-amber-500/20 transition-all"
              >
                <GlassWater className="h-4 w-4" />
                Mark as Consumed
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-900/30 bg-[#2A1F1A] px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/20 hover:border-red-400/50 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Label Image */}
        {(bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl) && (
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
            <div className="relative w-full h-96 bg-[#1A1410]">
              <Image
                src={bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl || ''}
                alt={`${bottle.wine?.name || 'Wine'} label`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
          </div>
        )}

        {/* Wine Header */}
        <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-4 mb-6">
            <WineTypeIcon
              type={(bottle.wine?.wineType as 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified') || 'red'}
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <h1 className={`${playfair.className} text-3xl font-bold mb-2 text-gray-100`}>
                {bottle.wine?.fullName || 'Unknown Wine'}
              </h1>
              <p className="text-lg text-gray-300">
                {bottle.wine?.producerName}
                {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
              </p>
              {bottle.wine?.aiGeneratedSummary && (
                <p className="mt-4 text-base leading-relaxed text-gray-300">
                  {bottle.wine.aiGeneratedSummary}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Status</div>
              <div className="text-lg font-semibold text-gray-100">
                {statusLabels[bottle.status] || bottle.status.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Wine Type</div>
              <div className="capitalize text-gray-100">{bottle.wine?.wineType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Region</div>
              <div className="text-gray-100">
                {bottle.wine?.region}, {bottle.wine?.country}
                {bottle.wine?.subRegion && <div className="text-sm text-gray-400">{bottle.wine.subRegion}</div>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Grape</div>
              <div className="text-gray-100">{bottle.wine?.primaryGrape || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Bottle Details - Your cellar information */}
        <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
          <h2 className={`${playfair.className} relative text-xl font-semibold mb-4 text-gray-100`}>Bottle Details</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Quantity</div>
              <div className="text-lg text-gray-100">{bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''}</div>
            </div>
            {bottle.purchasePrice && (
              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Purchase Price</div>
                <div className="text-lg text-gray-100">
                  {bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)} per bottle
                  {bottle.quantity > 1 && (
                    <div className="text-sm text-gray-400 mt-1">
                      Total value: {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {bottle.purchaseDate && (
              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Purchase Date</div>
                <div className="text-gray-100">{formatDate(bottle.purchaseDate)}</div>
              </div>
            )}
            {bottle.purchaseLocation && (
              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Purchased From</div>
                <div className="text-gray-100">{bottle.purchaseLocation}</div>
              </div>
            )}
            {bottle.storageLocation && (
              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Storage Location</div>
                <div className="text-gray-100">{bottle.storageLocation}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Acquisition</div>
              <div className="capitalize text-gray-100">{bottle.acquisitionMethod}</div>
            </div>
          </div>

          {bottle.personalNotes && (
            <div className="relative mt-6 pt-6 border-t border-amber-900/20">
              <div className="text-sm font-medium text-gray-400 mb-2">Personal Notes</div>
              <div className="text-sm text-gray-300">{bottle.personalNotes}</div>
            </div>
          )}

          {bottle.rating && (
            <div className="relative mt-6 pt-6 border-t border-amber-900/20">
              <div className="text-sm font-medium text-gray-400 mb-2">Your Rating</div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-2xl ${i < bottle.rating! ? 'text-amber-400' : 'text-gray-600'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}

          {bottle.tags.length > 0 && (
            <div className="relative mt-6 pt-6 border-t border-amber-900/20">
              <div className="text-sm font-medium text-gray-400 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {bottle.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-amber-900/30 border border-amber-500/30 text-amber-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wine Profile - Detailed description */}
        {parsedDescription.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
            <h2 className={`${playfair.className} relative text-xl font-semibold mb-4 text-gray-100`}>Wine Profile</h2>
            <div className="relative space-y-4 text-sm leading-relaxed text-gray-300">
              {parsedDescription.map((block, index) => {
                if (block.type === 'paragraph') {
                  return (
                    <p key={index} className="text-base text-gray-300">
                      {block.body}
                    </p>
                  );
                }

                if (block.type === 'section') {
                  return (
                    <div key={index} className="space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
                        {block.title}
                      </h3>
                      <p className="whitespace-pre-line text-base text-gray-300">{block.body}</p>
                    </div>
                  );
                }

                return (
                  <div key={index} className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
                      {block.title}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {block.items?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Consumption History */}
        {bottle.consumptionLogs.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
            <h2 className={`${playfair.className} relative text-xl font-semibold mb-4 text-gray-100`}>Consumption History</h2>
            <div className="relative space-y-4">
              {bottle.consumptionLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-amber-400 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-gray-100">{formatDate(log.consumedDate)}</div>
                    {log.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < log.rating! ? 'text-amber-400' : 'text-gray-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {log.occasion && <div className="text-sm text-gray-400">{log.occasion}</div>}
                  {log.tastingNotes && <div className="text-sm mt-2 text-gray-300">{log.tastingNotes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 max-w-md w-full mx-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-red-500/5 rounded-full blur-3xl" />
            <h3 className={`${playfair.className} relative text-lg font-semibold mb-2 text-gray-100`}>Delete Bottle?</h3>
            <p className="relative text-gray-300 mb-6">
              Are you sure you want to delete this bottle? This action cannot be undone.
            </p>
            <div className="relative flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg border border-amber-900/30 bg-[#2A1F1A] px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-[#3A2F2A] hover:border-amber-400/50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consume Bottle Modal */}
      {showConsumeModal && (
        <ConsumeBottleModal
          bottle={bottle}
          onClose={() => setShowConsumeModal(false)}
        />
      )}

      {/* Edit Bottle Modal */}
      {showEditModal && (
        <EditBottleModal
          bottle={bottle}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
