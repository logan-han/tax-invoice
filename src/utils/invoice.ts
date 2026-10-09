import type { InvoiceDetails } from '../types';
import { addDays, daysBetween, formatHumanDate, isIsoDate } from './dates';
import { DEFAULT_PAYMENT_TERMS_DAYS } from './constants';

export const defaultInvoiceNumber = (invoiceDate: string): string =>
  `${invoiceDate.replace(/-/g, '')}-0001`;

export const defaultNotes = (dueDate: string): string =>
  dueDate
    ? `Payment due by ${formatHumanDate(dueDate)}.`
    : `Payment due within ${DEFAULT_PAYMENT_TERMS_DAYS} days of invoice date.`;

export const notesAreDefault = (details: InvoiceDetails): boolean =>
  details.notes === defaultNotes(details.dueDate);

/** Notes that still hold the generated wording follow the due date; edited notes stay put. */
export const changeDueDate = (details: InvoiceDetails, dueDate: string): InvoiceDetails => ({
  ...details,
  dueDate,
  notes: notesAreDefault(details) ? defaultNotes(dueDate) : details.notes,
});

/**
 * Moves the invoice date and carries the fields derived from it: a generated invoice number is
 * regenerated and the due date keeps the same payment terms. Edited values are left alone.
 * `from` is the last complete date, since date inputs report '' while a date is half typed.
 */
export const changeInvoiceDate = (
  details: InvoiceDetails,
  invoiceDate: string,
  from: string = details.invoiceDate
): InvoiceDetails => {
  if (!isIsoDate(invoiceDate)) return { ...details, invoiceDate };

  const terms = daysBetween(from, details.dueDate);
  const dueDate =
    terms !== null
      ? addDays(invoiceDate, terms)
      : details.dueDate || addDays(invoiceDate, DEFAULT_PAYMENT_TERMS_DAYS);
  const invoiceNumber =
    details.invoiceNumber === defaultInvoiceNumber(from)
      ? defaultInvoiceNumber(invoiceDate)
      : details.invoiceNumber;

  return changeDueDate({ ...details, invoiceDate, invoiceNumber }, dueDate);
};
