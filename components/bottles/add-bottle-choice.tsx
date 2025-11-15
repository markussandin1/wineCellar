'use client';

import { useState } from 'react';
import { Camera, Search, Layers } from 'lucide-react';
import { BottleForm } from './bottle-form';
import { LabelScanner } from './label-scanner';
import { BatchLabelScanner } from './batch-label-scanner';
import { WineSearch } from './wine-search';

type Mode = 'choice' | 'scan' | 'batch' | 'search';
type Placement = 'cellar' | 'watchlist';

interface AddBottleChoiceProps {
  userCurrency: string;
}

export function AddBottleChoice({ userCurrency }: AddBottleChoiceProps) {
  const [mode, setMode] = useState<Mode>('choice');
  const [placement, setPlacement] = useState<Placement>('cellar');
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);

  if (mode === 'scan') {
    return (
      <div>
        <button
          onClick={() => setMode('choice')}
          className="mb-4 sm:mb-6 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-sm text-amber-400 hover:text-yellow-400 hover:bg-amber-900/30 transition-colors font-medium inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to options</span>
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
          className="mb-4 sm:mb-6 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-sm text-amber-400 hover:text-yellow-400 hover:bg-amber-900/30 transition-colors font-medium inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to options</span>
        </button>
        <BatchLabelScanner initialPlacement={placement} userCurrency={userCurrency} />
      </div>
    );
  }

  if (mode === 'search') {
    // If wine selected, show bottle form
    if (selectedWineId) {
      return (
        <div>
          <button
            onClick={() => {
              setSelectedWineId(null);
              setMode('choice');
            }}
            className="mb-4 sm:mb-6 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-sm text-amber-400 hover:text-yellow-400 hover:bg-amber-900/30 transition-colors font-medium inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to search</span>
          </button>
          <BottleForm initialPlacement={placement} existingWineId={selectedWineId} />
        </div>
      );
    }

    // Show wine search
    return (
      <div>
        <button
          onClick={() => setMode('choice')}
          className="mb-4 sm:mb-6 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-sm text-amber-400 hover:text-yellow-400 hover:bg-amber-900/30 transition-colors font-medium inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to options</span>
        </button>
        <div className="rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
          <h2 className="text-xl font-semibold text-amber-400 mb-2">Search Your Wines</h2>
          <p className="text-sm text-gray-400 mb-6">
            Find a wine you already own to add another bottle
          </p>
          <WineSearch onSelectWine={(wine) => setSelectedWineId(wine.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Placement Selector */}
      <div className="flex flex-col gap-3 rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-100">Where should we save this wine?</p>
          <p className="text-xs text-gray-400 mt-1">
            Use watch list to remember wines you enjoyed without adding them to your inventory.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-amber-900/30 bg-[#1A1410] p-1">
          <button
            type="button"
            onClick={() => setPlacement('cellar')}
            className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
              placement === 'cellar'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : 'hover:bg-[#2A1F1A] text-gray-300'
            }`}
          >
            Cellar
          </button>
          <button
            type="button"
            onClick={() => setPlacement('watchlist')}
            className={`px-4 py-2 text-sm font-semibold rounded transition-all ${
              placement === 'watchlist'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : 'hover:bg-[#2A1F1A] text-gray-300'
            }`}
          >
            Watch list
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scan Single Label Option */}
        <button
          onClick={() => setMode('scan')}
          className="group relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 text-center transition-all hover:scale-105 hover:border-amber-500/50 shadow-lg hover:shadow-amber-900/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col items-center space-y-3">
            <div className="rounded-full bg-amber-900/30 p-3 transition-all group-hover:bg-amber-500/20 border border-amber-500/30">
              <Camera className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100">Scan Label</h3>
              <p className="mt-1 text-xs text-gray-400">
                One photo at a time
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-amber-400">
              Quick & Easy
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>

        {/* Batch Scan Option */}
        <button
          onClick={() => setMode('batch')}
          className="group relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 text-center transition-all hover:scale-105 hover:border-amber-500/50 shadow-lg hover:shadow-amber-900/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-500/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col items-center space-y-3">
            <div className="rounded-full bg-amber-900/30 p-3 transition-all group-hover:bg-amber-500/20 border border-amber-500/30">
              <Layers className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100">Batch Upload</h3>
              <p className="mt-1 text-xs text-gray-400">
                Up to 20 bottles at once
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-amber-400">
              Power User
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>

        {/* Search Wines Option */}
        <button
          onClick={() => setMode('search')}
          className="group relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 text-center transition-all hover:scale-105 hover:border-amber-500/50 shadow-lg hover:shadow-amber-900/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-yellow-400/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col items-center space-y-3">
            <div className="rounded-full bg-amber-900/30 p-3 transition-all group-hover:bg-amber-500/20 border border-amber-500/30">
              <Search className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100">Search Wines</h3>
              <p className="mt-1 text-xs text-gray-400">
                Add bottle of existing wine
              </p>
            </div>
            <div className="mt-2 inline-flex items-center text-xs font-medium text-amber-400">
              Quick Restock
              <span className="ml-1">→</span>
            </div>
          </div>
        </button>
      </div>

      <div className="rounded-xl border border-amber-900/20 bg-amber-900/10 p-4 text-sm text-gray-300">
        <strong className="text-amber-400">Tip:</strong> Use batch upload if you have multiple bottles to add. Each label is processed
        separately, and you can review them one by one before saving.
      </div>
    </div>
  );
}
