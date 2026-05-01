import { useState, useEffect, useCallback, memo, type ChangeEvent } from 'react';
import Section from './ui/Section';
import Field from './ui/Field';
import type { InvoiceDetails } from '../types';

interface InvoiceDetailsFormProps {
  onChange: (details: InvoiceDetails) => void;
}

const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'NZD', 'CNY', 'INR', 'SGD'];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatHumanDate = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const monthIdx = parseInt(m, 10) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
  return `${parseInt(d, 10)} ${MONTHS[monthIdx]} ${y}`;
};

const defaultNotesFor = (dueDate: string): string => {
  const formatted = formatHumanDate(dueDate);
  return formatted
    ? `Payment due by ${formatted}.`
    : 'Payment due within 30 days of invoice date.';
};

const InvoiceDetailsForm = memo(function InvoiceDetailsForm({ onChange }: InvoiceDetailsFormProps) {
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('');
  const [notes, setNotes] = useState('');
  const [notesEdited, setNotesEdited] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const stored = queryParams.get('invoice');
    let parsed: Partial<InvoiceDetails> | null = null;
    if (stored) {
      try {
        parsed = JSON.parse(stored) as Partial<InvoiceDetails>;
      } catch {
        parsed = null;
      }
    }

    const date = new Date();
    const dateString = parsed?.invoiceDate || date.toISOString().split('T')[0];
    setInvoiceDate(dateString);
    setInvoiceNumber(parsed?.invoiceNumber || `${dateString.replace(/-/g, '')}-0001`);

    let due = parsed?.dueDate;
    if (!due) {
      const dueDateObj = new Date(dateString);
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      due = dueDateObj.toISOString().split('T')[0];
    }
    setDueDate(due);
    setCurrency(parsed?.currency || '');
    if (typeof parsed?.notes === 'string' && parsed.notes !== defaultNotesFor(due)) {
      setNotes(parsed.notes);
      setNotesEdited(true);
    } else {
      setNotes(defaultNotesFor(due));
    }
  }, []);

  useEffect(() => {
    if (!notesEdited) {
      setNotes(defaultNotesFor(dueDate));
    }
  }, [dueDate, notesEdited]);

  useEffect(() => {
    onChange({ invoiceDate, invoiceNumber, dueDate, currency, notes });
  }, [invoiceDate, invoiceNumber, dueDate, currency, notes, onChange]);

  const handleDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newInvoiceDate = e.target.value;
    setInvoiceDate(newInvoiceDate);
    setInvoiceNumber(`${newInvoiceDate.replace(/-/g, '')}-0001`);
    const newDueDateObj = new Date(newInvoiceDate);
    newDueDateObj.setDate(newDueDateObj.getDate() + 30);
    setDueDate(newDueDateObj.toISOString().split('T')[0]);
  }, []);

  const handleNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
  }, []);

  const handleDueDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  }, []);

  const handleNotesChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setNotesEdited(true);
  }, []);

  const handleNotesReset = useCallback(() => {
    setNotesEdited(false);
    setNotes(defaultNotesFor(dueDate));
  }, [dueDate]);

  return (
    <Section n={3} title="Invoice" meta={invoiceNumber}>
      <div className="field-grid">
        <Field label="Invoice number" htmlFor="invoiceNumber" span={4} compact>
          <input
            id="invoiceNumber"
            className="input mono"
            name="invoiceNumber"
            type="text"
            value={invoiceNumber}
            onChange={handleNumberChange}
          />
        </Field>
        <Field label="Currency" htmlFor="currency" span={2} compact>
          <select
            id="currency"
            className="select mono"
            name="currency"
            value={currency}
            onChange={handleCurrencyChange}
          >
            <option value="">N/A</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Invoice date" htmlFor="invoiceDate" span={3} compact>
          <input
            id="invoiceDate"
            className="input mono"
            name="invoiceDate"
            type="date"
            value={invoiceDate}
            onChange={handleDateChange}
          />
        </Field>
        <Field label="Due date" htmlFor="dueDate" span={3} compact>
          <input
            id="dueDate"
            className="input mono"
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
          />
        </Field>
        <Field
          label="Notes"
          htmlFor="invoiceNotes"
          hint={
            notesEdited ? (
              <button
                type="button"
                className="btn ghost sm"
                onClick={handleNotesReset}
                style={{ height: 20, padding: '0 6px', fontSize: 10 }}
              >
                Reset
              </button>
            ) : undefined
          }
        >
          <textarea
            id="invoiceNotes"
            className="input"
            name="notes"
            rows={2}
            value={notes}
            onChange={handleNotesChange}
            style={{ height: 'auto', padding: '8px 12px', resize: 'vertical', minHeight: 60 }}
          />
        </Field>
      </div>
    </Section>
  );
});

export default InvoiceDetailsForm;
