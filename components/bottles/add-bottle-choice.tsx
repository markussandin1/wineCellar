'use client';

import { useState } from 'react';
import { Camera, Edit3 } from 'lucide-react';
import { BottleForm } from './bottle-form';
import { LabelScanner } from './label-scanner';

type Mode = 'choice' | 'scan' | 'manual';
type Placement = 'cellar' | 'watchlist';

export function AddBottleChoice() {
  const [mode, setMode] = useState<Mode>('choice');
  const [placement, setPlacement] = useState<Placement>('cellar');

  if (mode === 'scan') {
    return (
      <div>
        <button
          onClick={() => setMode('choice')}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to options
        </button>
        <LabelScanner initialPlacement={placement} />
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div>
        <button
          onClick={() => setMode('choice')}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to options
        </button>
        <BottleForm initialPlacement={placement} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-6">
        Choose how you&apos;d like to add your bottle
      </p>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Where should we save this wine?</p>
          <p className="text-xs text-muted-foreground">
            Use watch list to remember wines you enjoyed without adding them to your inventory.
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-background p-1">
          <button
            type="button"
            onClick={() => setPlacement('cellar')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              placement === 'cellar'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-foreground'
            }`}
          >
            Cellar
          </button>
          <button
            type="button"
            onClick={() => setPlacement('watchlist')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              placement === 'watchlist'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-foreground'
            }`}
          >
            Watch list
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scan Label Option */}
        <button
          onClick={() => setMode('scan')}
          className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-8 text-center transition-all hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Scan Label</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Take a photo of the wine label and we will extract the details
              </p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Quick & Easy
              <span className="ml-2">→</span>
            </div>
          </div>
        </button>

        {/* Manual Entry Option */}
        <button
          onClick={() => setMode('manual')}
          className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-8 text-center transition-all hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
              <Edit3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Enter Manually</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill in the wine details yourself with autocomplete
              </p>
            </div>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Full Control
              <span className="ml-2">→</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <strong>Tip:</strong> Scanning is faster, but you can always review and edit
        the extracted information before saving.
      </div>
    </div>
  );
}
