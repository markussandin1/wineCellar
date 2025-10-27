// Simple currency conversion rates (EUR base)
// These are approximate rates - in production you'd want to use a real API
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  SEK: 11.5,  // 1 EUR = ~11.5 SEK
  USD: 1.08,  // 1 EUR = ~1.08 USD
  GBP: 0.85,  // 1 EUR = ~0.85 GBP
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;

  // Convert to EUR first, then to target currency
  const inEur = amount / fromRate;
  const converted = inEur * toRate;

  return Math.round(converted * 100) / 100; // Round to 2 decimals
}

export function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    SEK: 'kr',
    USD: '$',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;

  if (currency === 'SEK') {
    return `${Math.round(amount)} ${symbol}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
}
