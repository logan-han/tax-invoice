import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '../App';
import { generateInvoicePdf } from '../utils/generatePdf';

vi.mock('../utils/generatePdf', () => ({
  generateInvoicePdf: vi.fn(() => Promise.resolve()),
}));

// The real widget loads Google Maps; tests only need somewhere to type.
vi.mock('../components/AddressAutocomplete', () => ({
  default: ({ id }: { id: string }) => <input id={id} />,
}));

const pdfMock = vi.mocked(generateInvoicePdf);

const openAt = (search: string) => window.history.replaceState(null, '', `/${search}`);
const preview = () => within(document.getElementById('invoice') as HTMLElement);
const params = () => new URLSearchParams(window.location.search);

describe('App', () => {
  beforeEach(() => {
    openAt('');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    pdfMock.mockReset();
    pdfMock.mockResolvedValue(undefined);
  });

  it('renders the heading and every section', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Australian Tax Invoice Generator' })
    ).toBeInTheDocument();
    for (const name of ['Your business', 'Bill to', 'Invoice', 'Line items']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
  });

  it('loads the invoice from the link', () => {
    const client = encodeURIComponent(JSON.stringify({ name: 'Client Corp', suburb: 'Sydney' }));
    const items = encodeURIComponent(
      JSON.stringify([{ name: 'Consulting', quantity: 7.5, price: 150, gst: 'add' }])
    );
    const invoice = encodeURIComponent(
      JSON.stringify({ invoiceDate: '2026-10-01', invoiceNumber: 'INV-9', dueDate: '2026-10-15' })
    );
    openAt(
      `?businessName=Acme&businessAbn=51+824+753+556&client=${client}&items=${items}&invoice=${invoice}`
    );

    render(<App />);

    expect(screen.getByLabelText('Business name')).toHaveValue('Acme');
    expect(screen.getByLabelText('Client name')).toHaveValue('Client Corp');
    expect(screen.getByLabelText('Item 1 Quantity')).toHaveValue(7.5);
    expect(screen.getByLabelText('Invoice number')).toHaveValue('INV-9');
    expect(preview().getByText('Client Corp')).toBeInTheDocument();
    expect(preview().getByText('1 Oct 2026')).toBeInTheDocument();
    // 7.5 x $150 + 10% GST
    expect(preview().getByText('$1,237.50')).toBeInTheDocument();
  });

  it('updates the preview as you type and saves to the URL once you pause', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    render(<App />);

    const name = screen.getByLabelText('Business name');
    for (const text of ['A', 'Ac', 'Acm', 'Acme']) {
      fireEvent.change(name, { target: { value: text } });
    }
    expect(preview().getAllByText('Acme').length).toBeGreaterThan(0);

    await waitFor(() => expect(params().get('businessName')).toBe('Acme'));
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it('writes a link that reopens the same invoice', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Client name'), { target: { value: 'Round Trip' } });
    fireEvent.change(screen.getByLabelText('Item 1 Description'), { target: { value: 'Widget' } });
    await waitFor(() => expect(params().get('items')).toContain('Widget'));

    expect(JSON.parse(params().get('client') ?? '{}')).toEqual({ name: 'Round Trip' });
    expect(params().has('itemName_0')).toBe(false);
  });

  it('carries on if the browser refuses a URL update', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
      throw new DOMException(
        'Attempt to use history.replaceState() more than 100 times',
        'SecurityError'
      );
    });
    render(<App />);

    fireEvent.change(screen.getByLabelText('Business name'), { target: { value: 'Still here' } });
    await waitFor(() => expect(replaceState).toHaveBeenCalled());

    expect(screen.getByLabelText('Business name')).toHaveValue('Still here');
  });

  it('generates the PDF with the invoice number and business name', async () => {
    openAt('?businessName=Acme');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Invoice number'), { target: { value: 'INV-1' } });

    fireEvent.click(screen.getByRole('button', { name: /generate pdf/i }));

    await waitFor(() => expect(pdfMock).toHaveBeenCalledWith('INV-1', 'Acme'));
  });

  it('disables the button while the PDF is being made', async () => {
    let finish: () => void = () => {};
    pdfMock.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<App />);
    const button = screen.getByRole('button', { name: /generate pdf invoice/i });

    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveTextContent(/generating/i);
    });

    finish();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('says so when the PDF fails, and clears the message on retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    pdfMock.mockRejectedValueOnce(new Error('boom'));
    render(<App />);
    const button = screen.getByRole('button', { name: /generate pdf/i });

    fireEvent.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t create the pdf/i);
    expect(consoleError).toHaveBeenCalledWith('Error generating PDF:', expect.any(Error));
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('prints, naming a saved PDF after the invoice', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    document.title = 'Australian Tax Invoice Generator';
    render(<App />);
    fireEvent.change(screen.getByLabelText('Invoice number'), { target: { value: 'INV-5' } });

    fireEvent.click(screen.getByRole('button', { name: /print/i }));
    expect(print).toHaveBeenCalled();

    window.dispatchEvent(new Event('beforeprint'));
    expect(document.title).toBe('invoice-INV-5');
    window.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe('Australian Tax Invoice Generator');
  });

  describe('Copy share link', () => {
    const stubClipboard = (writeText: (text: string) => Promise<void>) =>
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    });

    it('copies the current invoice even before the URL catches up', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<App />);

      fireEvent.change(screen.getByLabelText('Business name'), { target: { value: 'Fresh' } });
      fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument()
      );
      const copied = new URL(writeText.mock.calls[0][0]);
      expect(copied.searchParams.get('businessName')).toBe('Fresh');

      await waitFor(
        () => expect(screen.getByRole('button', { name: /copy share link/i })).toBeInTheDocument(),
        { timeout: 2500 }
      );
    });

    it('does not claim success when copying fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      stubClipboard(writeText);
      render(<App />);

      fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));
      await waitFor(() => expect(writeText).toHaveBeenCalled());

      expect(screen.queryByRole('button', { name: /link copied/i })).not.toBeInTheDocument();
    });

    it('does nothing without a clipboard API', async () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(screen.queryByRole('button', { name: /link copied/i })).not.toBeInTheDocument();
    });
  });

  describe('zoom', () => {
    it('switches level and marks the pressed button', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: '150%' });

      fireEvent.click(button);

      expect(button).toHaveClass('on');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '85%' })).toHaveAttribute('aria-pressed', 'false');
    });

    it.each([
      [500, '55%'],
      [1200, '85%'],
      [1600, '100%'],
    ])('starts at a size that fits a %ipx window', (width, level) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(<App />);
      expect(screen.getByRole('button', { name: level })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
