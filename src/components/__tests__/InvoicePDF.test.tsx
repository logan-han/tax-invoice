import type { ComponentProps } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';
import type { BusinessDetails, ClientDetails, InvoiceItem } from '../../types';

type PaperProps = ComponentProps<typeof InvoicePDF>;

describe('InvoicePDF', () => {
  const mockBusinessDetails: BusinessDetails = {
    name: 'Test Business',
    street: '123 Test St',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    phone: '0412345678',
    email: 'test@business.com',
    abn: '12 345 678 901',
    acn: '',
    accountName: 'Test Account',
    bsb: '123-456',
    accountNumber: '12345678',
  };

  const mockClientDetails: ClientDetails = {
    name: 'Test Client',
    street: '456 Client St',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    abn: '98 765 432 109',
    acn: '',
  };

  const mockItems: InvoiceItem[] = [
    { id: '1', name: 'Item 1', quantity: 2, price: 100, gst: 'add' },
    { id: '2', name: 'Item 2', quantity: 1, price: 50, gst: 'no' },
  ];

  const baseProps: PaperProps = {
    businessDetails: mockBusinessDetails,
    clientDetails: mockClientDetails,
    items: mockItems,
    invoiceDate: '2025-01-15',
    invoiceNumber: '20250115-0001',
    dueDate: '2025-02-14',
  };

  const renderPaper = (overrides: Partial<PaperProps> = {}) =>
    render(<InvoicePDF {...baseProps} {...overrides} />);

  it('renders the paper with #invoice id for html2canvas capture', () => {
    const { container } = renderPaper({ currency: 'AUD' });

    expect(container.querySelector('#invoice')).not.toBeNull();
  });

  it('displays business details', () => {
    renderPaper();

    expect(screen.getAllByText('Test Business').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ABN:\s*12 345 678 901/).length).toBeGreaterThan(0);
  });

  it('displays client details in Bill to block', () => {
    renderPaper();

    expect(screen.getByText('Bill to')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText(/ABN:\s*98 765 432 109/)).toBeInTheDocument();
  });

  it('displays invoice number prefixed with #', () => {
    const { container } = renderPaper();

    const badge = container.querySelector('.inv-badge-num');
    expect(badge?.textContent).toContain('#');
    expect(badge?.textContent).toContain('20250115-0001');
  });

  it('displays item names', () => {
    renderPaper();

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('calculates and displays GST when items have GST', () => {
    const { container } = renderPaper();

    const totals = within(container.querySelector('.inv-totals') as HTMLElement);
    expect(totals.getByText('GST (10%)').nextElementSibling).toHaveTextContent('$20.00');
    expect(totals.getByText('Subtotal').nextElementSibling).toHaveTextContent('$250.00');
    expect(totals.getByText('Total').nextElementSibling).toHaveTextContent('$270.00');
  });

  it('displays bank details when provided', () => {
    renderPaper();

    expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('123-456')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
  });

  it('displays ACN when provided', () => {
    const businessWithACN = {
      ...mockBusinessDetails,
      acn: '123 456 789',
    };
    const clientWithACN = {
      ...mockClientDetails,
      acn: '987 654 321',
    };

    renderPaper({ businessDetails: businessWithACN, clientDetails: clientWithACN });

    expect(screen.getAllByText(/ACN:\s*123 456 789/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ACN:\s*987 654 321/).length).toBeGreaterThan(0);
  });

  it('does not show bank details section when BSB is missing', () => {
    const businessWithoutBSB = {
      ...mockBusinessDetails,
      bsb: '',
    };

    renderPaper({ businessDetails: businessWithoutBSB });

    expect(screen.queryByText('Bank Account Details')).not.toBeInTheDocument();
  });

  it('does not show due date when not provided', () => {
    renderPaper({ dueDate: '' });

    expect(screen.queryByText('Due')).not.toBeInTheDocument();
  });

  it('shows grand total without Subtotal / GST rows when no items have GST', () => {
    const noGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item 1', quantity: 2, price: 100, gst: 'no' },
      { id: '2', name: 'Item 2', quantity: 1, price: 50, gst: 'no' },
    ];

    renderPaper({ items: noGstItems });

    expect(screen.queryByText('GST (10%)')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
  });

  it('is a plain invoice when no line carries GST, and a tax invoice otherwise', () => {
    const noGst: InvoiceItem[] = [
      { id: '1', name: 'Consulting', quantity: 1, price: 100, gst: 'no' },
    ];
    const { rerender } = renderPaper({ items: noGst, invoiceNumber: '1', dueDate: '' });
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.queryByText('Tax Invoice')).not.toBeInTheDocument();

    rerender(<InvoicePDF {...baseProps} invoiceNumber="1" dueDate="" />);
    expect(screen.getByText('Tax Invoice')).toBeInTheDocument();
  });

  it('calculates inclusive GST correctly', () => {
    const inclusiveGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item with inclusive GST', quantity: 1, price: 110, gst: 'inclusive' },
    ];

    renderPaper({ items: inclusiveGstItems });

    // $110 including GST is $100 + $10 GST, shown ex-GST on the line.
    expect(screen.getByText('GST (10%)').nextElementSibling).toHaveTextContent('$10.00');
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$110.00').length).toBeGreaterThan(0);
  });

  it('labels the due date and formats both dates', () => {
    renderPaper();

    expect(screen.getByText('Issued').nextElementSibling).toHaveTextContent('15 Jan 2025');
    expect(screen.getByText('Due').nextElementSibling).toHaveTextContent('14 Feb 2025');
  });

  it('formats amounts in the invoice currency', () => {
    renderPaper({
      items: [{ id: '1', name: 'Licence', quantity: 1, price: 1000, gst: 'no' }],
      invoiceNumber: '1',
      dueDate: '',
      currency: 'GBP',
    });

    expect(screen.getByText('Total GBP').nextElementSibling).toHaveTextContent('£1,000.00');
  });

  it('handles empty date gracefully', () => {
    const { container } = renderPaper({ invoiceDate: '' });

    expect(container.querySelector('#invoice')).not.toBeNull();
  });

  it('displays currency in amount header when provided', () => {
    renderPaper({ currency: 'USD' });

    expect(screen.getByText(/Amount\s+USD/)).toBeInTheDocument();
  });

  it('displays phone and email when provided', () => {
    const { container } = renderPaper();

    expect(container.textContent).toContain('test@business.com');
    expect(container.textContent).toContain('0412345678');
  });

  it('does not display phone and email when not provided', () => {
    const businessWithoutContact = {
      ...mockBusinessDetails,
      phone: '',
      email: '',
    };

    const { container } = renderPaper({ businessDetails: businessWithoutContact });

    expect(container.textContent).not.toContain('test@business.com');
    expect(container.textContent).not.toContain('0412345678');
  });

  it('does not show bank details section when account number is missing', () => {
    const businessWithoutAccountNumber = {
      ...mockBusinessDetails,
      accountNumber: '',
    };

    renderPaper({ businessDetails: businessWithoutAccountNumber });

    expect(screen.queryByText('Bank Account Details')).not.toBeInTheDocument();
  });

  it('displays currency in totals when provided and GST exists', () => {
    renderPaper({ currency: 'EUR' });

    expect(screen.getByText(/Total\s+EUR/)).toBeInTheDocument();
  });

  it('displays currency in totals when provided and no GST', () => {
    const noGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item 1', quantity: 1, price: 100, gst: 'no' },
    ];

    renderPaper({ items: noGstItems, currency: 'GBP' });

    expect(screen.getByText(/Total\s+GBP/)).toBeInTheDocument();
  });

  it('does not display ABN when not provided', () => {
    const businessWithoutABN = {
      ...mockBusinessDetails,
      abn: '',
    };

    const { container } = renderPaper({ businessDetails: businessWithoutABN });

    // The only ABN rendered should be the client's, in the Bill to block
    const abnMatches = container.textContent?.match(/ABN:/g) || [];
    expect(abnMatches.length).toBe(1);
  });

  it('does not display client ABN when not provided', () => {
    const clientWithoutABN = {
      ...mockClientDetails,
      abn: '',
    };

    const { container } = renderPaper({ clientDetails: clientWithoutABN });

    const clientBlock = container.querySelector('.clientDetails');
    expect(clientBlock?.textContent).not.toContain('ABN:');
  });

  it('renders empty items list with a placeholder row', () => {
    renderPaper({ items: [] });

    expect(screen.getByText('No items yet.')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('formats large currency amounts correctly', () => {
    const expensiveItems: InvoiceItem[] = [
      { id: '1', name: 'Expensive Item', quantity: 1, price: 12345.67, gst: 'add' },
    ];

    renderPaper({ items: expensiveItems });

    const formattedAmounts = screen.getAllByText('$12,345.67');
    expect(formattedAmounts.length).toBeGreaterThan(0);
  });

  it('falls back to placeholders when business name and account name are empty', () => {
    const minimalBusiness: BusinessDetails = {
      name: '',
      street: '',
      suburb: '',
      state: '',
      postcode: '',
      phone: '',
      email: '',
      abn: '',
      acn: '',
      accountName: '',
      bsb: '',
      accountNumber: '',
    };

    const { container } = renderPaper({ businessDetails: minimalBusiness });

    const fromName = container.querySelector('.footerDetails .inv-party-name');
    expect(fromName?.textContent).toBe('—');

    // With nothing to remit to, the whole block is an editor hint.
    const remit = container.querySelector('.inv-footer > div');
    expect(remit).toHaveAttribute('data-placeholder');
    expect(remit?.textContent).toContain('Add BSB');
    expect(screen.getByText('Your business')).toHaveAttribute('data-placeholder');
  });

  it('marks editor hints so the PDF can leave them out', () => {
    const { container } = renderPaper({
      businessDetails: { ...mockBusinessDetails, name: '', bsb: '' },
      clientDetails: { ...mockClientDetails, name: '' },
      items: [{ id: '1', name: '', quantity: 1, price: 10, gst: 'no' }],
      invoiceNumber: '1',
      dueDate: '',
    });

    const hints = Array.from(container.querySelectorAll('[data-placeholder]')).map(
      (el) => el.textContent
    );
    expect(hints).toEqual([
      'Your business',
      'Client name',
      'Item description',
      'Add BSB & account',
    ]);
    // The account name is real content, so the remit block itself stays.
    expect(screen.getByText('Test Account').closest('[data-placeholder]')).toBeNull();
  });

  it('omits the client street line when only suburb/state/postcode are present', () => {
    const clientNoStreet: ClientDetails = {
      ...mockClientDetails,
      street: '',
    };

    const { container } = renderPaper({ clientDetails: clientNoStreet });

    const detail = container.querySelector('.clientDetails .inv-party-detail');
    expect(detail?.textContent).not.toContain('456 Client St');
    expect(detail?.textContent).toContain('Melbourne');
  });

  it('renders a placeholder description for unnamed line items', () => {
    const namelessItems: InvoiceItem[] = [{ id: '1', name: '', quantity: 1, price: 10, gst: 'no' }];

    renderPaper({ items: namelessItems });

    expect(screen.getByText('Item description')).toBeInTheDocument();
  });

  it('falls back to placeholder client name when missing', () => {
    const anonymousClient: ClientDetails = {
      name: '',
      street: '',
      suburb: '',
      state: '',
      postcode: '',
      abn: '',
      acn: '',
    };

    const { container } = renderPaper({ clientDetails: anonymousClient });

    const billTo = container.querySelector('.clientDetails .inv-party-name');
    expect(billTo?.textContent).toBe('Client name');
  });
});
