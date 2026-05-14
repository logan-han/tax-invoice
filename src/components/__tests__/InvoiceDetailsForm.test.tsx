import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceDetailsForm from '../InvoiceDetailsForm';

describe('InvoiceDetailsForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { search: '', href: 'http://localhost/' },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the form with default values', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    expect(screen.getByLabelText('Invoice date')).toBeInTheDocument();
    expect(screen.getByLabelText('Due date')).toBeInTheDocument();
    expect(screen.getByLabelText('Invoice number')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  it('sets default invoice date to today', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice date') as HTMLInputElement;
    expect(invoiceDateInput.value).toBe('2025-01-15');
  });

  it('sets default due date to 30 days from today', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const dueDateInput = screen.getByLabelText('Due date') as HTMLInputElement;
    expect(dueDateInput.value).toBe('2025-02-14');
  });

  it('generates invoice number from date', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceNumberInput = screen.getByLabelText('Invoice number') as HTMLInputElement;
    expect(invoiceNumberInput.value).toBe('20250115-0001');
  });

  it('calls onChange when invoice date is changed', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-02-01' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('updates due date when invoice date changes', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-02-01' } });

    const dueDateInput = screen.getByLabelText('Due date') as HTMLInputElement;
    expect(dueDateInput.value).toBe('2025-03-03');
  });

  it('has currency dropdown with options', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const currencySelect = screen.getByLabelText('Currency');
    expect(currencySelect).toBeInTheDocument();

    const options = currencySelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(5);
  });

  it('calls onChange when currency is changed', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const currencySelect = screen.getByLabelText('Currency');
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onChange when invoice number is changed manually', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceNumberInput = screen.getByLabelText('Invoice number');
    fireEvent.change(invoiceNumberInput, { target: { value: 'CUSTOM-001' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.invoiceNumber).toBe('CUSTOM-001');
  });

  it('calls onChange when due date is changed manually', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const dueDateInput = screen.getByLabelText('Due date');
    fireEvent.change(dueDateInput, { target: { value: '2025-03-01' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.dueDate).toBe('2025-03-01');
  });

  it('updates invoice number based on new date when invoice date changes', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-03-15' } });

    const invoiceNumberInput = screen.getByLabelText('Invoice number') as HTMLInputElement;
    expect(invoiceNumberInput.value).toBe('20250315-0001');
  });

  it('calls onChange on mount with default values', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const firstCall = mockOnChange.mock.calls[0][0];
    expect(firstCall).toHaveProperty('invoiceDate');
    expect(firstCall).toHaveProperty('invoiceNumber');
    expect(firstCall).toHaveProperty('dueDate');
    expect(firstCall).toHaveProperty('currency');
  });

  it('has all currency options', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const currencySelect = screen.getByLabelText('Currency');
    const options = currencySelect.querySelectorAll('option');

    // Should have N/A + 10 currencies
    expect(options.length).toBe(11);

    // Check some specific currencies
    expect(screen.getByRole('option', { name: 'AUD' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'USD' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EUR' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'N/A' })).toBeInTheDocument();
  });

  it('can select different currencies', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const currencySelect = screen.getByLabelText('Currency');

    fireEvent.change(currencySelect, { target: { value: 'AUD' } });
    expect(mockOnChange).toHaveBeenCalled();
    let lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.currency).toBe('AUD');

    fireEvent.change(currencySelect, { target: { value: 'JPY' } });
    lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.currency).toBe('JPY');
  });

  it('seeds notes with the default payment line for the due date', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);
    const notes = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(notes.value).toBe('Payment due by 14 Feb 2025.');
  });

  it('refreshes the default notes when the due date changes', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-03-15' } });

    const notes = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(notes.value).toBe('Payment due by 14 Apr 2025.');
  });

  it('marks notes as edited, reveals the reset button, and stops auto-syncing', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const notes = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: 'Bank transfer only.' } });
    expect(notes.value).toBe('Bank transfer only.');

    fireEvent.change(screen.getByLabelText('Invoice date'), { target: { value: '2025-04-01' } });
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe('Bank transfer only.');

    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('Reset restores the default note for the current due date and re-enables auto-sync', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const notes = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: 'Custom note' } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'Payment due by 14 Feb 2025.'
    );
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Invoice date'), { target: { value: '2025-05-01' } });
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'Payment due by 31 May 2025.'
    );
  });

  it('falls back to generic notes when the due date is empty', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);
    const dueDate = screen.getByLabelText('Due date');
    fireEvent.change(dueDate, { target: { value: '' } });

    const notes = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(notes.value).toBe('Payment due within 30 days of invoice date.');
  });

  it('hydrates all fields from the invoice URL parameter, preserving custom notes', () => {
    const invoice = {
      invoiceDate: '2024-06-10',
      invoiceNumber: 'INV-42',
      dueDate: '2024-07-10',
      currency: 'EUR',
      notes: 'Net 30 — wire transfer.',
    };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        search: `?invoice=${encodeURIComponent(JSON.stringify(invoice))}`,
        href: 'http://localhost/',
      },
    });

    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    expect((screen.getByLabelText('Invoice date') as HTMLInputElement).value).toBe('2024-06-10');
    expect((screen.getByLabelText('Invoice number') as HTMLInputElement).value).toBe('INV-42');
    expect((screen.getByLabelText('Due date') as HTMLInputElement).value).toBe('2024-07-10');
    expect((screen.getByLabelText('Currency') as HTMLSelectElement).value).toBe('EUR');
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe('Net 30 — wire transfer.');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('does not mark notes as edited when the stored notes match the default for the due date', () => {
    const invoice = {
      invoiceDate: '2024-06-10',
      invoiceNumber: 'INV-42',
      dueDate: '2024-07-10',
      currency: 'EUR',
      notes: 'Payment due by 10 Jul 2024.',
    };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        search: `?invoice=${encodeURIComponent(JSON.stringify(invoice))}`,
        href: 'http://localhost/',
      },
    });

    render(<InvoiceDetailsForm onChange={mockOnChange} />);
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'Payment due by 10 Jul 2024.'
    );
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('ignores invalid JSON in the invoice URL parameter', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { search: '?invoice=not-json', href: 'http://localhost/' },
    });

    render(<InvoiceDetailsForm onChange={mockOnChange} />);
    expect((screen.getByLabelText('Invoice date') as HTMLInputElement).value).toBe('2025-01-15');
  });
});
