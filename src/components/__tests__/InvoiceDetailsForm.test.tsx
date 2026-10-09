import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceDetailsForm from '../InvoiceDetailsForm';
import { readState } from '../../utils/urlState';
import type { InvoiceDetails } from '../../types';

// The defaults App starts from on 15 Jan 2025.
const fresh = (): InvoiceDetails => readState('', '2025-01-15').invoice;

function Harness({
  initial = fresh(),
  onChange,
}: {
  initial?: InvoiceDetails;
  onChange: (details: InvoiceDetails) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <InvoiceDetailsForm
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('InvoiceDetailsForm', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it('shows the defaults: today, 30 day terms and a dated number', () => {
    render(<Harness onChange={onChange} />);

    expect(field('Invoice date').value).toBe('2025-01-15');
    expect(field('Due date').value).toBe('2025-02-14');
    expect(field('Invoice number').value).toBe('20250115-0001');
    expect(field('Currency').value).toBe('');
    expect(field('Notes').value).toBe('Payment due by 14 Feb 2025.');
    expect(screen.getByText('20250115-0001')).toBeInTheDocument();
  });

  it('does not report a change just by rendering', () => {
    render(<Harness onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves the number, due date and notes with the invoice date', () => {
    render(<Harness onChange={onChange} />);
    change('Invoice date', '2025-03-15');

    expect(onChange).toHaveBeenLastCalledWith({
      invoiceDate: '2025-03-15',
      invoiceNumber: '20250315-0001',
      dueDate: '2025-04-14',
      currency: '',
      notes: 'Payment due by 14 Apr 2025.',
    });
  });

  it('keeps a typed invoice number when the date changes', () => {
    render(<Harness onChange={onChange} />);
    change('Invoice number', 'INV-042');
    change('Invoice date', '2025-03-15');

    expect(field('Invoice number').value).toBe('INV-042');
  });

  it('keeps custom payment terms when the date changes', () => {
    render(<Harness onChange={onChange} />);
    change('Due date', '2025-01-29');
    change('Invoice date', '2025-02-01');

    expect(field('Due date').value).toBe('2025-02-15');
    expect(field('Notes').value).toBe('Payment due by 15 Feb 2025.');
  });

  it('survives the date being cleared and retyped', () => {
    render(<Harness onChange={onChange} />);
    change('Invoice date', '');
    expect(field('Due date').value).toBe('2025-02-14');

    change('Invoice date', '2025-01-20');
    expect(field('Invoice number').value).toBe('20250120-0001');
    expect(field('Due date').value).toBe('2025-02-19');
  });

  it('changes the currency', () => {
    render(<Harness onChange={onChange} />);
    const options = Array.from(screen.getByLabelText('Currency').querySelectorAll('option'));
    expect(options.map((o) => o.value)).toEqual([
      '',
      'AUD',
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CAD',
      'NZD',
      'CNY',
      'INR',
      'SGD',
    ]);

    change('Currency', 'JPY');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ currency: 'JPY' }));
  });

  it('keeps edited notes and offers a reset', () => {
    render(<Harness onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

    change('Notes', 'Bank transfer only.');
    change('Invoice date', '2025-04-01');

    expect(field('Notes').value).toBe('Bank transfer only.');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('Reset brings back the generated note, which then follows the due date again', () => {
    render(<Harness onChange={onChange} />);
    change('Notes', 'Custom note');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(field('Notes').value).toBe('Payment due by 14 Feb 2025.');
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

    change('Invoice date', '2025-05-01');
    expect(field('Notes').value).toBe('Payment due by 31 May 2025.');
  });

  it('falls back to generic notes when the due date is cleared', () => {
    render(<Harness onChange={onChange} />);
    change('Due date', '');
    expect(field('Notes').value).toBe('Payment due within 30 days of invoice date.');
  });

  it('treats saved notes that match the generated wording as not edited', () => {
    render(
      <Harness
        onChange={onChange}
        initial={{
          invoiceDate: '2024-06-10',
          invoiceNumber: 'INV-42',
          dueDate: '2024-07-10',
          currency: 'EUR',
          notes: 'Payment due by 10 Jul 2024.',
        }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });
});
