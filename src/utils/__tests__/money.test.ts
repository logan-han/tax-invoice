import { describe, it, expect } from 'vitest';
import { calculateTotals, formatMoney, lineExGst, lineTotal } from '../money';
import type { InvoiceItem } from '../../types';

const item = (price: number, gst: InvoiceItem['gst'], quantity = 1): InvoiceItem => ({
  id: `${price}-${gst}-${quantity}`,
  name: 'Item',
  quantity,
  price,
  gst,
});

describe('line amounts', () => {
  it('adds GST on top for +10% lines', () => {
    expect(lineExGst(item(100, 'add', 2))).toBe(200);
    expect(lineTotal(item(100, 'add', 2))).toBeCloseTo(220);
  });

  it('backs GST out of GST-inclusive lines', () => {
    expect(lineExGst(item(110, 'inclusive'))).toBeCloseTo(100);
    expect(lineTotal(item(110, 'inclusive'))).toBe(110);
  });

  it('leaves GST-free lines alone', () => {
    expect(lineExGst(item(50, 'no', 3))).toBe(150);
    expect(lineTotal(item(50, 'no', 3))).toBe(150);
  });

  it('handles fractional quantities', () => {
    expect(lineExGst(item(150, 'add', 7.5))).toBe(1125);
  });
});

describe('calculateTotals', () => {
  it('adds 10% GST to +10% lines', () => {
    expect(calculateTotals([item(100, 'add', 5)])).toEqual({ subtotal: 500, gst: 50, total: 550 });
  });

  it('takes 1/11 of GST-inclusive lines as GST', () => {
    expect(calculateTotals([item(99, 'inclusive')])).toEqual({ subtotal: 90, gst: 9, total: 99 });
  });

  it('charges no GST on GST-free lines', () => {
    expect(calculateTotals([item(1500, 'no')])).toEqual({ subtotal: 1500, gst: 0, total: 1500 });
  });

  it('combines mixed lines', () => {
    const totals = calculateTotals([item(150, 'add', 7.5), item(99, 'inclusive'), item(20, 'no')]);
    expect(totals).toEqual({ subtotal: 1235, gst: 121.5, total: 1356.5 });
  });

  it('rounds GST once, to the nearest cent, half up', () => {
    // 5c + 10% = half a cent of GST.
    expect(calculateTotals([item(0.05, 'add')])).toEqual({
      subtotal: 0.05,
      gst: 0.01,
      total: 0.06,
    });
    // Two lines whose GST is half a cent each round together, not twice.
    expect(calculateTotals([item(0.05, 'add'), item(0.05, 'add')])).toEqual({
      subtotal: 0.1,
      gst: 0.01,
      total: 0.11,
    });
  });

  it('keeps subtotal + GST equal to the total for awkward inclusive amounts', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ ...item(10, 'inclusive'), id: `${i}` }));
    const { subtotal, gst, total } = calculateTotals(items);
    expect(total).toBe(70);
    expect(gst).toBe(6.36);
    expect(Math.round((subtotal + gst) * 100)).toBe(Math.round(total * 100));
  });

  it('is not thrown by float noise', () => {
    // 1.5 * 0.15 is 0.22499999999999998 in floating point.
    expect(calculateTotals([item(0.15, 'no', 1.5)]).total).toBe(0.23);
    expect(calculateTotals([item(0.1, 'no', 3)]).total).toBe(0.3);
  });

  it('supports negative lines such as discounts', () => {
    const totals = calculateTotals([item(100, 'add'), item(-20, 'add')]);
    expect(totals).toEqual({ subtotal: 80, gst: 8, total: 88 });
  });

  it('returns zeros for no items', () => {
    expect(calculateTotals([])).toEqual({ subtotal: 0, gst: 0, total: 0 });
  });
});

describe('formatMoney', () => {
  it('formats dollars with thousands separators', () => {
    expect(formatMoney(1234567.891)).toBe('$1,234,567.89');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('uses the currency symbol', () => {
    expect(formatMoney(1234.5, 'AUD')).toBe('$1,234.50');
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(1234.5, 'EUR')).toBe('€1,234.50');
    expect(formatMoney(1234.5, 'GBP')).toBe('£1,234.50');
    expect(formatMoney(1234.5, 'INR')).toBe('₹1,234.50');
  });

  it('drops decimals for currencies without minor units', () => {
    expect(formatMoney(1234.5, 'JPY')).toBe('¥1,235');
  });

  it('shows negatives with a leading minus', () => {
    expect(formatMoney(-50)).toBe('-$50.00');
  });

  it('never shows a negative zero', () => {
    expect(formatMoney(-0)).toBe('$0.00');
    expect(formatMoney(-1e-12)).toBe('$0.00');
  });

  it('treats non-numbers as zero', () => {
    expect(formatMoney(Number.NaN)).toBe('$0.00');
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('$0.00');
  });
});
