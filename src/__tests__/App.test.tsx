import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the PDF generator so tests don't touch html2canvas/jspdf.
vi.mock('../utils/generatePdf', () => ({
  generateInvoicePdf: vi.fn(() => Promise.resolve()),
}));

// Mock all child components to isolate App testing
vi.mock('../components/BusinessDetailsForm', () => ({
  default: ({ onChange, value }: { onChange: (details: unknown) => void; value?: unknown }) => (
    <div data-testid="business-form">
      <button
        onClick={() =>
          onChange({
            name: 'Test Business',
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
          })
        }
      >
        Update Business
      </button>
      <span data-testid="business-value">{value ? JSON.stringify(value) : 'empty'}</span>
    </div>
  ),
}));

vi.mock('../components/ClientDetailsForm', () => ({
  default: ({ onChange, value }: { onChange: (details: unknown) => void; value?: unknown }) => (
    <div data-testid="client-form">
      <button
        onClick={() =>
          onChange({
            name: 'Test Client',
            street: '',
            suburb: '',
            state: '',
            postcode: '',
            abn: '',
            acn: '',
          })
        }
      >
        Update Client
      </button>
      <span data-testid="client-value">{value ? JSON.stringify(value) : 'empty'}</span>
    </div>
  ),
}));

vi.mock('../components/ItemForm', () => ({
  default: ({ items, onChange }: { items: unknown[]; onChange: (items: unknown[]) => void }) => (
    <div data-testid="item-form">
      <button onClick={() => onChange([...items, { id: 'new', name: 'New Item' }])}>
        Add Item
      </button>
      <span data-testid="items-count">{items.length}</span>
    </div>
  ),
}));

vi.mock('../components/InvoiceDetailsForm', () => ({
  default: ({ onChange }: { onChange: (details: unknown) => void }) => (
    <div data-testid="invoice-form">
      <button
        onClick={() =>
          onChange({
            invoiceDate: '2025-01-15',
            invoiceNumber: '20250115-0001',
            dueDate: '2025-02-14',
            currency: 'AUD',
          })
        }
      >
        Update Invoice
      </button>
    </div>
  ),
}));

vi.mock('../components/InvoicePDF', () => ({
  default: () => <div data-testid="invoice-pdf">Invoice PDF</div>,
}));

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    });
    window.history.replaceState = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);

    expect(screen.getByText('Australian Tax Invoice Generator')).toBeInTheDocument();
    expect(screen.getByText(/Create professional tax invoices in minutes/)).toBeInTheDocument();
  });

  it('renders all form components', () => {
    render(<App />);

    expect(screen.getByTestId('business-form')).toBeInTheDocument();
    expect(screen.getByTestId('client-form')).toBeInTheDocument();
    expect(screen.getByTestId('item-form')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-pdf')).toBeInTheDocument();
  });

  it('renders immediately without a Google Maps loading gate', () => {
    render(<App />);

    expect(screen.getByText('Australian Tax Invoice Generator')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders the Generate PDF button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
  });

  it('calls generateInvoicePdf when Generate PDF is clicked', async () => {
    const { generateInvoicePdf } = await import('../utils/generatePdf');
    render(<App />);

    fireEvent.click(screen.getByText('Update Invoice'));
    fireEvent.click(screen.getByRole('button', { name: /generate pdf/i }));

    await waitFor(() => {
      expect(generateInvoicePdf).toHaveBeenCalledWith('20250115-0001');
    });
  });

  it('handles business details change', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('Update Business'));

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  it('handles client details change', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('Update Client'));

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  it('handles items change', async () => {
    render(<App />);

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(() => {
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  it('handles invoice details change', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('Update Invoice'));

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  it('reads business details from URL params on mount', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?businessName=URL+Business&businessEmail=test@example.com',
        href: 'http://localhost/?businessName=URL+Business&businessEmail=test@example.com',
      },
      writable: true,
    });

    render(<App />);

    const businessValue = screen.getByTestId('business-value');
    expect(businessValue.textContent).toContain('URL Business');
    expect(businessValue.textContent).toContain('test@example.com');
  });

  it('parses JSON client details from URL params', () => {
    const clientData = JSON.stringify({
      name: 'URL Client',
      street: '',
      suburb: '',
      state: '',
      postcode: '',
      abn: '',
      acn: '',
    });

    Object.defineProperty(window, 'location', {
      value: {
        search: `?client=${encodeURIComponent(clientData)}`,
        href: `http://localhost/?client=${encodeURIComponent(clientData)}`,
      },
      writable: true,
    });

    render(<App />);

    expect(screen.getByTestId('client-value').textContent).toContain('URL Client');
  });

  it('parses JSON items from URL params', () => {
    const itemsData = JSON.stringify([
      { id: 'item-1', name: 'URL Item', quantity: 1, price: 100, gst: 'no' },
    ]);

    Object.defineProperty(window, 'location', {
      value: {
        search: `?items=${encodeURIComponent(itemsData)}`,
        href: `http://localhost/?items=${encodeURIComponent(itemsData)}`,
      },
      writable: true,
    });

    render(<App />);

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
  });

  it('handles invalid JSON in URL params gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      value: {
        search: '?client=invalid-json&items=also-invalid',
        href: 'http://localhost/?client=invalid-json&items=also-invalid',
      },
      writable: true,
    });

    render(<App />);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse URL parameter');
    expect(screen.getByTestId('items-count')).toHaveTextContent('0');

    consoleSpy.mockRestore();
  });

  it('updates URL with business data on change', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('Update Business'));

    await waitFor(() => {
      const businessValue = screen.getByTestId('business-value');
      expect(businessValue.textContent).toContain('Test Business');
    });
  });

  it('copies the share link to the clipboard and flips the button label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('http://localhost/');
      expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /copy share link/i })).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });

  it('silently swallows clipboard errors', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: /link copied/i })).not.toBeInTheDocument();
  });

  it('switches the active zoom level when a zoom button is clicked', () => {
    render(<App />);
    const zoomGroup = screen.getByRole('group', { name: 'Zoom' });
    const buttons = zoomGroup.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '150%' }));
    expect(screen.getByRole('button', { name: '150%' })).toHaveClass('on');
  });

  it('logs and recovers when PDF generation throws', async () => {
    const { generateInvoicePdf } = await import('../utils/generatePdf');
    (generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('boom')
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /generate pdf/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error generating PDF:', expect.any(Error));
    });

    const button = screen.getByRole('button', { name: /generate pdf/i });
    expect(button).not.toBeDisabled();
    consoleSpy.mockRestore();
  });

  it('picks the smallest zoom on narrow viewports', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    render(<App />);
    expect(screen.getByRole('button', { name: '55%' })).toHaveClass('on');
  });

  it('picks the largest default zoom on wide viewports', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 });
    render(<App />);
    expect(screen.getByRole('button', { name: '100%' })).toHaveClass('on');
  });

  it('disables the Generate PDF button while generation is in progress', async () => {
    const { generateInvoicePdf } = await import('../utils/generatePdf');
    let resolveFn: () => void = () => {};
    (generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        })
    );

    render(<App />);
    const button = screen.getByRole('button', { name: /generate pdf invoice/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveTextContent(/generating/i);
    });

    resolveFn();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });
});
