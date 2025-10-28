export const WINE_TYPES = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortified' },
] as const;

export const ACQUISITION_METHODS = [
  { value: 'purchased', label: 'Purchased' },
  { value: 'gift', label: 'Gift' },
  { value: 'trade', label: 'Trade' },
  { value: 'other', label: 'Other' },
] as const;

export const BOTTLE_SIZES = [
  { value: 375, label: 'Half Bottle (375ml)' },
  { value: 750, label: 'Standard (750ml)' },
  { value: 1500, label: 'Magnum (1.5L)' },
  { value: 3000, label: 'Double Magnum (3L)' },
  { value: 6000, label: 'Imperial (6L)' },
] as const;

export const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'SEK'] as const;
