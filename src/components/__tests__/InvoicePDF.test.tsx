import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';
import type { BusinessDetails, ClientDetails, InvoiceItem } from '../../types';

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

  it('renders the paper with #invoice id for html2canvas capture', () => {
    const { container } = render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
        currency="AUD"
      />
    );

    expect(container.querySelector('#invoice')).not.toBeNull();
  });

  it('displays business details', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getAllByText('Test Business').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ABN:\s*12 345 678 901/).length).toBeGreaterThan(0);
  });

  it('displays client details in Bill to block', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getByText('Bill to')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText(/ABN:\s*98 765 432 109/)).toBeInTheDocument();
  });

  it('displays invoice number prefixed with #', () => {
    const { container } = render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    const badge = container.querySelector('.inv-badge-num');
    expect(badge?.textContent).toContain('#');
    expect(badge?.textContent).toContain('20250115-0001');
  });

  it('displays item names', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('calculates and displays GST when items have GST', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getByText('TOTAL GST(10%)')).toBeInTheDocument();
  });

  it('displays bank details when provided', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

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

    render(
      <InvoicePDF
        businessDetails={businessWithACN}
        clientDetails={clientWithACN}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getAllByText(/ACN:\s*123 456 789/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ACN:\s*987 654 321/).length).toBeGreaterThan(0);
  });

  it('does not show bank details section when BSB is missing', () => {
    const businessWithoutBSB = {
      ...mockBusinessDetails,
      bsb: '',
    };

    render(
      <InvoicePDF
        businessDetails={businessWithoutBSB}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.queryByText('Bank Account Details')).not.toBeInTheDocument();
  });

  it('does not show due date when not provided', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate=""
      />
    );

    expect(screen.queryByText('Due Date:')).not.toBeInTheDocument();
  });

  it('shows grand total without Subtotal / GST rows when no items have GST', () => {
    const noGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item 1', quantity: 2, price: 100, gst: 'no' },
      { id: '2', name: 'Item 2', quantity: 1, price: 50, gst: 'no' },
    ];

    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={noGstItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.queryByText('TOTAL GST(10%)')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
  });

  it('calculates inclusive GST correctly', () => {
    const inclusiveGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item with inclusive GST', quantity: 1, price: 110, gst: 'inclusive' },
    ];

    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={inclusiveGstItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getByText('TOTAL GST(10%)')).toBeInTheDocument();
  });

  it('handles empty date gracefully', () => {
    const { container } = render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate=""
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(container.querySelector('#invoice')).not.toBeNull();
  });

  it('displays currency in amount header when provided', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
        currency="USD"
      />
    );

    expect(screen.getByText(/Amount\s+USD/)).toBeInTheDocument();
  });

  it('displays phone and email when provided', () => {
    const { container } = render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(container.textContent).toContain('test@business.com');
    expect(container.textContent).toContain('0412345678');
  });

  it('does not display phone and email when not provided', () => {
    const businessWithoutContact = {
      ...mockBusinessDetails,
      phone: '',
      email: '',
    };

    const { container } = render(
      <InvoicePDF
        businessDetails={businessWithoutContact}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(container.textContent).not.toContain('test@business.com');
    expect(container.textContent).not.toContain('0412345678');
  });

  it('does not show bank details section when account number is missing', () => {
    const businessWithoutAccountNumber = {
      ...mockBusinessDetails,
      accountNumber: '',
    };

    render(
      <InvoicePDF
        businessDetails={businessWithoutAccountNumber}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.queryByText('Bank Account Details')).not.toBeInTheDocument();
  });

  it('displays currency in totals when provided and GST exists', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
        currency="EUR"
      />
    );

    expect(screen.getByText(/Total\s+EUR/)).toBeInTheDocument();
  });

  it('displays currency in totals when provided and no GST', () => {
    const noGstItems: InvoiceItem[] = [
      { id: '1', name: 'Item 1', quantity: 1, price: 100, gst: 'no' },
    ];

    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={noGstItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
        currency="GBP"
      />
    );

    expect(screen.getByText(/Total\s+GBP/)).toBeInTheDocument();
  });

  it('does not display ABN when not provided', () => {
    const businessWithoutABN = {
      ...mockBusinessDetails,
      abn: '',
    };

    const { container } = render(
      <InvoicePDF
        businessDetails={businessWithoutABN}
        clientDetails={mockClientDetails}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    // The only ABN rendered should be the client's, in the Bill to block
    const abnMatches = container.textContent?.match(/ABN:/g) || [];
    expect(abnMatches.length).toBe(1);
  });

  it('does not display client ABN when not provided', () => {
    const clientWithoutABN = {
      ...mockClientDetails,
      abn: '',
    };

    const { container } = render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={clientWithoutABN}
        items={mockItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    const clientBlock = container.querySelector('.clientDetails');
    expect(clientBlock?.textContent).not.toContain('ABN:');
  });

  it('renders empty items list with a placeholder row', () => {
    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={[]}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    expect(screen.getByText('No items yet.')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('formats large currency amounts correctly', () => {
    const expensiveItems: InvoiceItem[] = [
      { id: '1', name: 'Expensive Item', quantity: 1, price: 12345.67, gst: 'add' },
    ];

    render(
      <InvoicePDF
        businessDetails={mockBusinessDetails}
        clientDetails={mockClientDetails}
        items={expensiveItems}
        invoiceDate="2025-01-15"
        invoiceNumber="20250115-0001"
        dueDate="2025-02-14"
      />
    );

    const formattedAmounts = screen.getAllByText('$12,345.67');
    expect(formattedAmounts.length).toBeGreaterThan(0);
  });
});
