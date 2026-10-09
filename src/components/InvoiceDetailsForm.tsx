import { useCallback, useEffect, useRef, memo, type ChangeEvent } from 'react';
import Section from './ui/Section';
import Field from './ui/Field';
import { CURRENCIES } from '../utils/constants';
import { isIsoDate } from '../utils/dates';
import { changeDueDate, changeInvoiceDate, defaultNotes, notesAreDefault } from '../utils/invoice';
import type { InvoiceDetails } from '../types';

interface InvoiceDetailsFormProps {
  value: InvoiceDetails;
  onChange: (details: InvoiceDetails) => void;
}

const InvoiceDetailsForm = memo(function InvoiceDetailsForm({
  value,
  onChange,
}: InvoiceDetailsFormProps) {
  // Date inputs pass through '' mid-edit; derived fields move relative to the last whole date.
  const lastCompleteDate = useRef(value.invoiceDate);
  useEffect(() => {
    if (isIsoDate(value.invoiceDate)) lastCompleteDate.current = value.invoiceDate;
  }, [value.invoiceDate]);

  const handleDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(changeInvoiceDate(value, e.target.value, lastCompleteDate.current));
    },
    [value, onChange]
  );

  const handleDueDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(changeDueDate(value, e.target.value));
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onChange({ ...value, [e.target.name]: e.target.value });
    },
    [value, onChange]
  );

  const handleNotesReset = useCallback(() => {
    onChange({ ...value, notes: defaultNotes(value.dueDate) });
  }, [value, onChange]);

  return (
    <Section n={3} title="Invoice" meta={value.invoiceNumber}>
      <div className="field-grid">
        <Field label="Invoice number" htmlFor="invoiceNumber" span={4} compact>
          <input
            id="invoiceNumber"
            className="input mono"
            name="invoiceNumber"
            type="text"
            value={value.invoiceNumber}
            onChange={handleChange}
          />
        </Field>
        <Field label="Currency" htmlFor="currency" span={2} compact>
          <select
            id="currency"
            className="select mono"
            name="currency"
            value={value.currency}
            onChange={handleChange}
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
            value={value.invoiceDate}
            onChange={handleDateChange}
          />
        </Field>
        <Field label="Due date" htmlFor="dueDate" span={3} compact>
          <input
            id="dueDate"
            className="input mono"
            name="dueDate"
            type="date"
            value={value.dueDate}
            onChange={handleDueDateChange}
          />
        </Field>
        <Field
          label="Notes"
          htmlFor="invoiceNotes"
          hint={
            notesAreDefault(value) ? undefined : (
              <button
                type="button"
                className="btn ghost sm"
                onClick={handleNotesReset}
                style={{ height: 20, padding: '0 6px', fontSize: 10 }}
              >
                Reset
              </button>
            )
          }
        >
          <textarea
            id="invoiceNotes"
            className="input"
            name="notes"
            rows={2}
            value={value.notes}
            onChange={handleChange}
            style={{ height: 'auto', padding: '8px 12px', resize: 'vertical', minHeight: 60 }}
          />
        </Field>
      </div>
    </Section>
  );
});

export default InvoiceDetailsForm;
