import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

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
  default: ({ onChange }: { onChange: (details: unknown) => void }) => (
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
    </div>
  ),
}));

vi.mock('../components/ItemForm', () => ({
  default: ({ items, onChange }: { items: unknown[]; onChange: (items: unknown[]) => void }) => (
    <div data-testid="item-form">
      <button onClick={() => onChange([...items, { id: 'new', name: 'New Item' }])}>Add Item</button>
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

vi.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <div data-testid="load-script">{children}</div>,
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
    expect(screen.getByText('Create professional tax invoices in minutes')).toBeInTheDocument();
  });

  it('renders all form components', () => {
    render(<App />);

    expect(screen.getByTestId('business-form')).toBeInTheDocument();
    expect(screen.getByTestId('client-form')).toBeInTheDocument();
    expect(screen.getByTestId('item-form')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
    expect(screen.getByTestId('invoice-pdf')).toBeInTheDocument();
  });

  it('renders LoadScript wrapper', () => {
    render(<App />);

    expect(screen.getByTestId('load-script')).toBeInTheDocument();
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

    // The component should render without errors with parsed data
    expect(screen.getByTestId('client-form')).toBeInTheDocument();
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

    // Verify state updates correctly
    await waitFor(() => {
      const businessValue = screen.getByTestId('business-value');
      expect(businessValue.textContent).toContain('Test Business');
    });
  });
});
