import type { InvoiceItem } from '../types';

// Rounds half away from zero. toFixed first drops float noise such as 0.225 * 100 = 22.4999...
// The trailing `|| 0` turns -0 into 0.
const roundCents = (cents: number): number => {
  const clean = Number(cents.toFixed(6));
  return Math.sign(clean) * Math.round(Math.abs(clean)) || 0;
};

/** Line amount before GST. */
export const lineExGst = (item: InvoiceItem): number =>
  item.gst === 'inclusive' ? (item.quantity * item.price) / 1.1 : item.quantity * item.price;

/** Line amount including any GST. */
export const lineTotal = (item: InvoiceItem): number =>
  item.gst === 'add' ? item.quantity * item.price * 1.1 : item.quantity * item.price;

export interface Totals {
  subtotal: number;
  gst: number;
  total: number;
}

/**
 * Totals in whole cents. GST is rounded once for the whole invoice, which the ATO allows, and
 * the subtotal is the total less GST, so the three figures shown always add up.
 */
export const calculateTotals = (items: InvoiceItem[]): Totals => {
  let noGst = 0;
  let addGst = 0;
  let inclGst = 0;
  for (const item of items) {
    const cents = roundCents(item.quantity * item.price * 100);
    if (item.gst === 'add') addGst += cents;
    else if (item.gst === 'inclusive') inclGst += cents;
    else noGst += cents;
  }
  const gst = roundCents(addGst / 10 + inclGst / 11);
  const total = noGst + addGst + inclGst + roundCents(addGst / 10);
  return { subtotal: (total - gst) / 100, gst: gst / 100, total: total / 100 };
};

const formatters = new Map<string, Intl.NumberFormat>();

/** "$1,234.50" for AUD (or no currency), "€1,234.50" for EUR, "¥1,235" for JPY. */
export const formatMoney = (amount: number, currency = ''): string => {
  const code = currency || 'AUD';
  let formatter = formatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    });
    formatters.set(code, formatter);
  }
  // Keep -0 and float dust like -1e-12 from rendering as "-$0.00".
  const value = Number.isFinite(amount) && Math.abs(amount) >= 0.005 ? amount : 0;
  return formatter.format(value);
};
