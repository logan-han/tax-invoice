import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';
import type { BusinessDetails, ClientDetails, InvoiceItem } from '../../types';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: () => 'data:image/jpeg;base64,mock',
    })
  ),
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    getImageProperties: () => ({ width: 100, height: 100 }),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  })),
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the preview section', () => {
    render(
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

    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('displays business details in footer', () => {
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

    expect(screen.getByText('Test Business')).toBeInTheDocument();
    expect(screen.getByText(/ABN:\s*12 345 678 901/)).toBeInTheDocument();
  });

  it('displays client details', () => {
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

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText(/ABN:\s*98 765 432 109/)).toBeInTheDocument();
  });

  it('displays invoice number', () => {
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

    expect(screen.getByText(/Tax Invoice # 20250115-0001/)).toBeInTheDocument();
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

  it('has a Generate PDF button', () => {
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

    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
  });

  it('shows loading state when generating PDF', async () => {
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

    const button = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Generate PDF')).toBeInTheDocument();
    });
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
});
