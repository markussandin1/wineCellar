'use client';

import { useState, useEffect } from 'react';
import { Search, Wine, ChevronRight } from 'lucide-react';
import { WineTypeIcon, type WineType, playfair } from '@/lib/design-system';
import { Button } from '@/components/ui/button';

interface WineSearchResult {
  id: string;
  name: string;
  fullName: string | null;
  producerName: string;
  vintage: number | null;
  wineType: string;
  country: string;
  region: string;
  subRegion: string | null;
  primaryGrape: string | null;
  primaryLabelImageUrl: string | null;
  bottleCount: number;
}

interface WineSearchProps {
  onSelectWine: (wine: WineSearchResult) => void;
}

export function WineSearch({ onSelectWine }: WineSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<WineSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      fetch(`/api/user/wines?search=${encodeURIComponent(searchQuery)}&limit=10`)
        .then(res => res.json())
        .then(data => {
          setResults(data.wines || []);
          setShowResults(true);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error searching wines:', error);
          setResults([]);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectWine = (wine: WineSearchResult) => {
    onSelectWine(wine);
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search your wines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="w-full rounded-lg border border-amber-900/30 bg-[#1A1410] pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 rounded-lg border border-amber-900/30 bg-[#1A1410] shadow-xl max-h-96 overflow-y-auto">
          {results.map((wine) => {
            const wineType = (wine.wineType?.toLowerCase() || null) as WineType | null;

            return (
              <button
                key={wine.id}
                onClick={() => handleSelectWine(wine)}
                className="w-full text-left px-4 py-3 hover:bg-amber-900/20 transition-colors border-b border-amber-900/10 last:border-b-0 flex items-center gap-3"
              >
                <WineTypeIcon type={wineType} className="w-8 h-8 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <h3 className={`${playfair.className} font-semibold text-gray-100 truncate`}>
                    {wine.fullName || wine.name}
                  </h3>
                  <p className="text-sm text-gray-300 truncate">
                    {wine.producerName}
                    {wine.vintage && ` • ${wine.vintage}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{wine.region}, {wine.country}</span>
                    <span>•</span>
                    <span className="text-amber-400">
                      <Wine className="h-3 w-3 inline mr-1" />
                      {wine.bottleCount} bottle{wine.bottleCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showResults && searchQuery.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-2 rounded-lg border border-amber-900/30 bg-[#1A1410] shadow-xl p-4 text-center">
          <p className="text-gray-400 text-sm">No wines found matching &quot;{searchQuery}&quot;</p>
          <p className="text-gray-500 text-xs mt-1">Try scanning a new wine instead</p>
        </div>
      )}

      {loading && (
        <div className="absolute z-10 w-full mt-2 rounded-lg border border-amber-900/30 bg-[#1A1410] shadow-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Searching...</p>
        </div>
      )}
    </div>
  );
}
