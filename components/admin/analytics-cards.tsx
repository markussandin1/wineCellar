'use client';

import { Users, Wine, Package, DollarSign } from 'lucide-react';

interface AnalyticsCardsProps {
  totalUsers: number;
  totalWines: number;
  totalBottles: number;
  totalCellarValue: number;
}

export function AnalyticsCards({
  totalUsers,
  totalWines,
  totalBottles,
  totalCellarValue,
}: AnalyticsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: 'Användare',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Viner i katalog',
      value: totalWines,
      icon: Wine,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Totalt flaskor',
      value: totalBottles,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Totalt värde',
      value: formatCurrency(totalCellarValue),
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold text-neutral-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
