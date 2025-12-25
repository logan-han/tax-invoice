import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceDetailsForm from '../InvoiceDetailsForm';

describe('InvoiceDetailsForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the form with default values', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    expect(screen.getByLabelText('Invoice Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Invoice Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  it('sets default invoice date to today', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice Date') as HTMLInputElement;
    expect(invoiceDateInput.value).toBe('2025-01-15');
  });

  it('sets default due date to 30 days from today', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const dueDateInput = screen.getByLabelText('Due Date') as HTMLInputElement;
    expect(dueDateInput.value).toBe('2025-02-14');
  });

  it('generates invoice number from date', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceNumberInput = screen.getByLabelText('Invoice Number') as HTMLInputElement;
    expect(invoiceNumberInput.value).toBe('20250115-0001');
  });

  it('calls onChange when invoice date is changed', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice Date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-02-01' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('updates due date when invoice date changes', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice Date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-02-01' } });

    const dueDateInput = screen.getByLabelText('Due Date') as HTMLInputElement;
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

    const invoiceNumberInput = screen.getByLabelText('Invoice Number');
    fireEvent.change(invoiceNumberInput, { target: { value: 'CUSTOM-001' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.invoiceNumber).toBe('CUSTOM-001');
  });

  it('calls onChange when due date is changed manually', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const dueDateInput = screen.getByLabelText('Due Date');
    fireEvent.change(dueDateInput, { target: { value: '2025-03-01' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.dueDate).toBe('2025-03-01');
  });

  it('updates invoice number based on new date when invoice date changes', () => {
    render(<InvoiceDetailsForm onChange={mockOnChange} />);

    const invoiceDateInput = screen.getByLabelText('Invoice Date');
    fireEvent.change(invoiceDateInput, { target: { value: '2025-03-15' } });

    const invoiceNumberInput = screen.getByLabelText('Invoice Number') as HTMLInputElement;
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
});
