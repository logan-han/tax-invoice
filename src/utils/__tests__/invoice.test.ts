import { describe, it, expect } from 'vitest';
import {
  changeDueDate,
  changeInvoiceDate,
  defaultInvoiceNumber,
  defaultNotes,
  notesAreDefault,
} from '../invoice';
import type { InvoiceDetails } from '../../types';

const details = (overrides: Partial<InvoiceDetails> = {}): InvoiceDetails => ({
  invoiceDate: '2026-10-10',
  invoiceNumber: '20261010-0001',
  dueDate: '2026-11-09',
  currency: '',
  notes: 'Payment due by 9 Nov 2026.',
  ...overrides,
});

describe('defaults', () => {
  it('numbers the invoice from its date', () => {
    expect(defaultInvoiceNumber('2026-10-10')).toBe('20261010-0001');
  });

  it('words the notes from the due date', () => {
    expect(defaultNotes('2026-11-09')).toBe('Payment due by 9 Nov 2026.');
    expect(defaultNotes('')).toBe('Payment due within 30 days of invoice date.');
  });

  it('knows when the notes are still the generated wording', () => {
    expect(notesAreDefault(details())).toBe(true);
    expect(notesAreDefault(details({ notes: 'Thanks!' }))).toBe(false);
  });
});

describe('changeDueDate', () => {
  it('moves generated notes with the due date', () => {
    expect(changeDueDate(details(), '2026-10-24')).toEqual(
      details({ dueDate: '2026-10-24', notes: 'Payment due by 24 Oct 2026.' })
    );
  });

  it('keeps edited notes', () => {
    expect(changeDueDate(details({ notes: 'Thanks!' }), '2026-10-24').notes).toBe('Thanks!');
  });
});

describe('changeInvoiceDate', () => {
  it('regenerates a generated number and keeps 30 day terms', () => {
    expect(changeInvoiceDate(details(), '2026-10-15')).toEqual(
      details({
        invoiceDate: '2026-10-15',
        invoiceNumber: '20261015-0001',
        dueDate: '2026-11-14',
        notes: 'Payment due by 14 Nov 2026.',
      })
    );
  });

  it('keeps an invoice number the user typed', () => {
    const next = changeInvoiceDate(details({ invoiceNumber: 'INV-042' }), '2026-10-15');
    expect(next.invoiceNumber).toBe('INV-042');
  });

  it('keeps custom payment terms', () => {
    const next = changeInvoiceDate(details({ dueDate: '2026-10-24' }), '2026-10-15');
    expect(next.dueDate).toBe('2026-10-29');
  });

  it('only updates the date while it is half typed', () => {
    expect(changeInvoiceDate(details(), '')).toEqual(details({ invoiceDate: '' }));
  });

  it('works from the last whole date once typing finishes', () => {
    const halfTyped = details({ invoiceDate: '' });
    const next = changeInvoiceDate(halfTyped, '2026-10-12', '2026-10-10');
    expect(next.invoiceNumber).toBe('20261012-0001');
    expect(next.dueDate).toBe('2026-11-11');
  });

  it('falls back to 30 day terms when there was no due date', () => {
    const next = changeInvoiceDate(details({ dueDate: '' }), '2026-10-15');
    expect(next.dueDate).toBe('2026-11-14');
  });

  it('leaves the due date alone when the old invoice date is unknown', () => {
    const next = changeInvoiceDate(details({ invoiceDate: '' }), '2026-10-15', '');
    expect(next.dueDate).toBe('2026-11-09');
  });
});
