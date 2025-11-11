'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PopularWine {
  wineId: string;
  wineName: string;
  producer: string;
  vintage: number | null;
  userCount: number;
  totalBottles: number;
}

interface PopularWinesChartProps {
  wines: PopularWine[];
}

export function PopularWinesChart({ wines }: PopularWinesChartProps) {
  if (wines.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Populärast viner
        </h2>
        <p className="text-neutral-600 text-center">Ingen data tillgänglig</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">
          Populäraste viner
        </h2>
        <p className="text-sm text-neutral-700 mt-1">
          Viner med flest användare och flaskor
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Vin</TableHead>
              <TableHead>Producent</TableHead>
              <TableHead>Årgång</TableHead>
              <TableHead className="text-right">Användare</TableHead>
              <TableHead className="text-right">Totalt flaskor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wines.map((wine, index) => (
              <TableRow key={wine.wineId}>
                <TableCell className="font-medium text-neutral-600">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{wine.wineName}</TableCell>
                <TableCell className="text-neutral-700">
                  {wine.producer}
                </TableCell>
                <TableCell className="text-neutral-700">
                  {wine.vintage || 'NV'}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    {wine.userCount}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {wine.totalBottles}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
