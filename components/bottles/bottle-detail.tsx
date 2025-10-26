'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Wine, MapPin, Calendar, DollarSign, Trash2, Edit, ArrowLeft, GlassWater } from 'lucide-react';
import { deleteBottle } from '@/app/actions/bottle';
import { ConsumeBottleModal } from './consume-bottle-modal';
import { EditBottleModal } from './edit-bottle-modal';

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

  const getWineTypeColor = (type: string) => {
    const colors = {
      red: 'text-red-600 dark:text-red-400',
      white: 'text-yellow-600 dark:text-yellow-400',
      rose: 'text-pink-600 dark:text-pink-400',
      sparkling: 'text-blue-600 dark:text-blue-400',
      dessert: 'text-amber-600 dark:text-amber-400',
      fortified: 'text-purple-600 dark:text-purple-400',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/cellar"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cellar
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            {bottle.status === 'in_cellar' && bottle.quantity > 0 && (
              <button
                onClick={() => setShowConsumeModal(true)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <GlassWater className="h-4 w-4" />
                Mark as Consumed
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-md border border-destructive bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Label Image */}
        {(bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl) && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="relative w-full h-96">
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

        {/* Wine Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4 mb-6">
            <Wine className={`h-12 w-12 ${bottle.wine ? getWineTypeColor(bottle.wine.wineType) : 'text-gray-400'}`} />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{bottle.wine?.fullName || 'Unknown Wine'}</h1>
              <p className="text-lg text-muted-foreground">
                {bottle.wine?.producerName}
                {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
              </p>
              {bottle.wine?.aiGeneratedSummary && (
                <p className="mt-4 text-base leading-relaxed text-foreground/80">
                  {bottle.wine.aiGeneratedSummary}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">
                {statusLabels[bottle.status] || bottle.status.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Wine Type</div>
              <div className="capitalize">{bottle.wine?.wineType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Region</div>
              <div>
                {bottle.wine?.region}, {bottle.wine?.country}
                {bottle.wine?.subRegion && <div className="text-sm text-muted-foreground">{bottle.wine.subRegion}</div>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Grape</div>
              <div>{bottle.wine?.primaryGrape || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {parsedDescription.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Wine Profile</h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              {parsedDescription.map((block, index) => {
                if (block.type === 'paragraph') {
                  return (
                    <p key={index} className="text-base">
                      {block.body}
                    </p>
                  );
                }

                if (block.type === 'section') {
                  return (
                    <div key={index} className="space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {block.title}
                      </h3>
                      <p className="whitespace-pre-line text-base">{block.body}</p>
                    </div>
                  );
                }

                return (
                  <div key={index} className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {block.title}
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
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

        {/* Bottle Details */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Bottle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Quantity</div>
              <div className="text-lg">{bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''}</div>
            </div>
            {bottle.purchasePrice && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Purchase Price</div>
                <div className="text-lg">
                  {bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)} per bottle
                  {bottle.quantity > 1 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Total value: {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {bottle.purchaseDate && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</div>
                <div>{new Date(bottle.purchaseDate).toLocaleDateString()}</div>
              </div>
            )}
            {bottle.purchaseLocation && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Purchased From</div>
                <div>{bottle.purchaseLocation}</div>
              </div>
            )}
            {bottle.storageLocation && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Storage Location</div>
                <div>{bottle.storageLocation}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Acquisition</div>
              <div className="capitalize">{bottle.acquisitionMethod}</div>
            </div>
          </div>

          {bottle.personalNotes && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Personal Notes</div>
              <div className="text-sm">{bottle.personalNotes}</div>
            </div>
          )}

          {bottle.rating && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Your Rating</div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-2xl ${i < bottle.rating! ? 'text-yellow-500' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}

          {bottle.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {bottle.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full text-xs bg-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Consumption History */}
        {bottle.consumptionLogs.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Consumption History</h2>
            <div className="space-y-4">
              {bottle.consumptionLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-primary pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium">{new Date(log.consumedDate).toLocaleDateString()}</div>
                    {log.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < log.rating! ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {log.occasion && <div className="text-sm text-muted-foreground">{log.occasion}</div>}
                  {log.tastingNotes && <div className="text-sm mt-2">{log.tastingNotes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Bottle?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this bottle? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
