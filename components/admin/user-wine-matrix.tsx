'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface UserWineEntry {
  userId: string;
  userName: string;
  userEmail: string;
  totalBottles: number;
  totalValue: number;
  wines: Array<{
    wineId: string;
    wineName: string;
    quantity: number;
    totalPrice: number;
  }>;
}

interface UserWineMatrixProps {
  data: UserWineEntry[];
}

export function UserWineMatrix({ data }: UserWineMatrixProps) {
  const [search, setSearch] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredData = data.filter(
    (user) =>
      user.userName.toLowerCase().includes(search.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      user.wines.some((wine) =>
        wine.wineName.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          Användare & Viner
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
          <Input
            placeholder="Sök användare eller vin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Användare</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Antal flaskor</TableHead>
                <TableHead className="text-right">Totalt värde</TableHead>
                <TableHead>Viner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-neutral-600">
                    Inga användare hittades
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">
                      {user.userName}
                    </TableCell>
                    <TableCell className="text-neutral-700">
                      {user.userEmail}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.totalBottles}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(user.totalValue)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {user.wines.length === 0 ? (
                          <span className="text-neutral-600 text-sm">
                            Inga flaskor
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {user.wines.slice(0, 3).map((wine) => (
                              <div
                                key={wine.wineId}
                                className="text-sm text-neutral-700"
                              >
                                {wine.wineName} ({wine.quantity} st)
                              </div>
                            ))}
                            {user.wines.length > 3 && (
                              <div className="text-sm text-neutral-600">
                                +{user.wines.length - 3} till
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
