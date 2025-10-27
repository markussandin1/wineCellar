'use client';

import { useState } from 'react';
import { Camera, Edit3, Layers } from 'lucide-react';
import { BottleForm } from './bottle-form';
import { LabelScanner } from './label-scanner';
import { BatchLabelScanner } from './batch-label-scanner';

type Mode = 'choice' | 'scan' | 'batch' | 'manual';
type Placement = 'cellar' | 'watchlist';

interface AddBottleChoiceProps {
  userCurrency: string;
}

export function AddBottleChoice({ userCurrency }: AddBottleChoiceProps) {
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
        <LabelScanner initialPlacement={placement} userCurrency={userCurrency} />
      </div>
    );
  }

  if (mode === 'batch') {
    return (
      <div>
        <button
          onClick={() => setMode('choice')}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to options
        </button>
        <BatchLabelScanner initialPlacement={placement} userCurrency={userCurrency} />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scan Single Label Option */}
        <button
          onClick={() => setMode('scan')}
          className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Scan Label</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                One photo at a time
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-primary">
              Quick & Easy
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>

        {/* Batch Scan Option */}
        <button
          onClick={() => setMode('batch')}
          className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Batch Upload</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Up to 20 bottles at once
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-primary">
              Power User
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>

        {/* Manual Entry Option */}
        <button
          onClick={() => setMode('manual')}
          className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <Edit3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Enter Manually</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Type in details yourself
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-primary">
              Full Control
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <strong>Tip:</strong> Use batch upload if you have multiple bottles to add. Each label is processed
        separately by AI, and you can review them one by one before saving.
      </div>
    </div>
  );
}
