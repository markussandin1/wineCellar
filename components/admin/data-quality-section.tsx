'use client';

import { CheckCircle2, XCircle, TrendingUp, Scan } from 'lucide-react';

interface DataQualityProps {
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
}

export function DataQualitySection({
  labelScans,
  enrichment,
}: DataQualityProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Datakvalitet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Label Scanning Stats */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <Scan className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">
              Etikettskanningar
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Totalt</span>
              <span className="font-medium text-neutral-900">
                {labelScans.total}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Lyckade</span>
              <span className="font-medium text-green-600">
                {labelScans.successful}
              </span>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">
                  Framgångsgrad
                </span>
                <span className="text-lg font-semibold text-blue-600">
                  {labelScans.successRate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${labelScans.successRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Stats */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-neutral-900">
              Vinbeskrivningar
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-neutral-600">Med beskrivning</span>
              </div>
              <span className="font-medium text-green-600">
                {enrichment.winesWithEnrichment}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">Utan beskrivning</span>
              </div>
              <span className="font-medium text-neutral-500">
                {enrichment.winesWithoutEnrichment}
              </span>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-900">
                  Täckningsgrad
                </span>
                <span className="text-lg font-semibold text-purple-600">
                  {enrichment.coveragePercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{ width: `${enrichment.coveragePercent}%` }}
                />
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Senaste version
                  </span>
                  <span className="text-xs font-mono font-medium text-neutral-700">
                    {enrichment.latestVersion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
