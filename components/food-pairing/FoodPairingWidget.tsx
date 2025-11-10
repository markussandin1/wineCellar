'use client';

/**
 * Food Pairing Widget
 *
 * Dashboard widget for searching wine pairings by dish/food.
 * Uses hybrid matching (semantic + rule-based) for intelligent recommendations.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Search, Wine, Loader2, ChefHat, Sparkles } from 'lucide-react';
import type { WineRecommendation } from '@/lib/food-pairing';

interface FoodPairingWidgetProps {
  className?: string;
}

export function FoodPairingWidget({ className = '' }: FoodPairingWidgetProps) {
  const [dish, setDish] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<WineRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dish.trim()) {
      setError('Please enter a dish or food');
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(false);

    try {
      const response = await fetch('/api/food-pairing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish: dish.trim(), limit: 5 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setRecommendations(data.recommendations || []);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Food pairing search error:', err);
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-yellow-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <ChefHat className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-amber-400">Food Pairing</h2>
          <p className="text-xs sm:text-sm text-gray-400">Find wines for your dish</p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            placeholder="E.g., pasta carbonara, grilled salmon..."
            disabled={isSearching}
            className="w-full px-4 py-2.5 sm:py-3 pl-10 rounded-lg bg-[#1A1410] border border-amber-900/30 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <button
          type="submit"
          disabled={isSearching || !dish.trim()}
          className="mt-2.5 sm:mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Find Pairing
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Wine className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No matching wines found in your cellar.
              </p>
              <Link
                href="/cellar/add"
                className="inline-block mt-3 text-sm text-amber-400 hover:text-yellow-400 transition-colors font-medium"
              >
                Add more bottles →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">
                  Found {recommendations.length} match{recommendations.length !== 1 ? 'es' : ''}
                </p>
                <div className="text-xs text-gray-500">
                  Score: Semantic + Rules
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recommendations.map((rec, index) => (
                  <Link
                    key={`${rec.wine.wineId}-${index}`}
                    href={`/cellar?highlight=${rec.wine.wineId}`}
                    className="block p-4 rounded-lg bg-[#1A1410]/50 border border-amber-900/20 hover:border-amber-500/30 hover:bg-[#1A1410] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Wine Icon */}
                      <Wine className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />

                      {/* Wine Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-100 truncate group-hover:text-amber-400 transition-colors">
                              {rec.wine.wineName}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {rec.wine.producerName}
                              {rec.wine.vintage && ` • ${rec.wine.vintage}`}
                            </p>
                          </div>

                          {/* Score Badge */}
                          <div className={`flex-shrink-0 px-2 py-1 rounded-md border text-xs font-bold ${getScoreBgColor(rec.score.total)} ${getScoreColor(rec.score.total)}`}>
                            {rec.score.total}%
                          </div>
                        </div>

                        {/* Pairing Reason */}
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {rec.pairingReason}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !error && (
        <div className="text-center py-8">
          <ChefHat className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Tell us what you&apos;re eating and we&apos;ll find the perfect wine from your cellar
          </p>
        </div>
      )}
    </div>
  );
}
