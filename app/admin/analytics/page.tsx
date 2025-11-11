'use client';

import { useEffect, useState } from 'react';
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { UserWineMatrix } from '@/components/admin/user-wine-matrix';
import { PopularWinesChart } from '@/components/admin/popular-wines-chart';
import { DataQualitySection } from '@/components/admin/data-quality-section';
import { Loader2 } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalWines: number;
    totalBottles: number;
    totalCellarValue: number;
    winesByStatus: {
      active: number;
      draft: number;
    };
  };
  userWineMatrix: any[];
  popularWines: any[];
  dataQuality: {
    labelScans: {
      total: number;
      successful: number;
      successRate: number;
    };
    enrichment: {
      winesWithEnrichment: number;
      winesWithoutEnrichment: number;
      coveragePercent: number;
      latestVersion: string;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');

        if (!res.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err) {
        console.error('Analytics error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load analytics</p>
          <p className="text-neutral-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analys</h1>
        <p className="text-neutral-700 mt-1">
          Systemövergripande statistik och insikter
        </p>
      </div>

      {/* Overview Cards */}
      <AnalyticsCards
        totalUsers={data.overview.totalUsers}
        totalWines={data.overview.totalWines}
        totalBottles={data.overview.totalBottles}
        totalCellarValue={data.overview.totalCellarValue}
      />

      {/* Wine Status Overview */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Vinstatus
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-700">Aktiva</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              {data.overview.winesByStatus.active}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-700">Utkast</p>
            <p className="text-2xl font-semibold text-neutral-600 mt-1">
              {data.overview.winesByStatus.draft}
            </p>
          </div>
        </div>
      </div>

      {/* User-Wine Matrix */}
      <UserWineMatrix data={data.userWineMatrix} />

      {/* Popular Wines */}
      <PopularWinesChart wines={data.popularWines} />

      {/* Data Quality */}
      <DataQualitySection
        labelScans={data.dataQuality.labelScans}
        enrichment={data.dataQuality.enrichment}
      />
    </div>
  );
}
