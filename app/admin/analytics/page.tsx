import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { UserWineMatrix } from '@/components/admin/user-wine-matrix';
import { PopularWinesChart } from '@/components/admin/popular-wines-chart';
import { DataQualitySection } from '@/components/admin/data-quality-section';

async function getAnalytics() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/analytics`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return res.json();
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analys</h1>
        <p className="text-neutral-600 mt-1">
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
            <p className="text-sm text-neutral-600">Aktiva</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              {data.overview.winesByStatus.active}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600">Utkast</p>
            <p className="text-2xl font-semibold text-neutral-400 mt-1">
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
