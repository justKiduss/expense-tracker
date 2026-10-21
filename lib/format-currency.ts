/** 425000 -> "4,250.00" */
export function formatCurrency(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return sign + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 32000 -> "320" */
export function formatBirrShort(cents: number): string {
  return Math.round(cents / 100).toLocaleString('en-US');
}