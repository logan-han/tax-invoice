import { useState, useCallback, useEffect, useRef, memo } from 'react';
import BusinessDetailsForm from './components/BusinessDetailsForm';
import ClientDetailsForm from './components/ClientDetailsForm';
import ItemForm from './components/ItemForm';
import InvoicePDF from './components/InvoicePDF';
import InvoiceDetailsForm from './components/InvoiceDetailsForm';
import { I } from './utils/icons';
import { generateInvoicePdf } from './utils/generatePdf';
import { todayIso } from './utils/dates';
import { readState, writeState, type InvoiceState } from './utils/urlState';
import type { BusinessDetails, ClientDetails, InvoiceItem, InvoiceDetails } from './types';

const ZOOM_LEVELS = [0.55, 0.7, 0.85, 1, 1.5] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

// Safari throws after 100 replaceState calls in 10 seconds, so the URL waits for a pause.
const URL_WRITE_DELAY_MS = 300;

const getInitialZoom = (): ZoomLevel => {
  if (window.innerWidth < 720) return 0.55;
  if (window.innerWidth < 1400) return 0.85;
  return 1;
};

const buildShareUrl = (state: InvoiceState): string => {
  const url = new URL(window.location.href);
  url.search = writeState(state, url.search);
  return url.toString();
};

function App() {
  const [state, setState] = useState<InvoiceState>(() =>
    readState(window.location.search, todayIso())
  );
  const [zoom, setZoom] = useState<ZoomLevel>(getInitialZoom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The URL is the save file: keep it in step with the form.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.history.replaceState(window.history.state, '', buildShareUrl(state));
      } catch {
        // Rate limited; the next edit writes it again.
      }
    }, URL_WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // "Save as PDF" in the print dialog names the file after the page title.
  const invoiceNumber = state.invoice.invoiceNumber.trim();
  useEffect(() => {
    const original = document.title;
    const rename = () => {
      document.title = `invoice-${invoiceNumber || 'draft'}`;
    };
    const restore = () => {
      document.title = original;
    };
    window.addEventListener('beforeprint', rename);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', rename);
      window.removeEventListener('afterprint', restore);
    };
  }, [invoiceNumber]);

  const updateBusiness = useCallback((patch: Partial<BusinessDetails>) => {
    setState((s) => ({ ...s, business: { ...s.business, ...patch } }));
  }, []);

  const updateClient = useCallback((patch: Partial<ClientDetails>) => {
    setState((s) => ({ ...s, client: { ...s.client, ...patch } }));
  }, []);

  const setInvoice = useCallback((invoice: InvoiceDetails) => {
    setState((s) => ({ ...s, invoice }));
  }, []);

  const setItems = useCallback((items: InvoiceItem[]) => {
    setState((s) => ({ ...s, items }));
  }, []);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setPdfFailed(false);
    try {
      await generateInvoicePdf(state.invoice.invoiceNumber, state.business.name);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfFailed(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(state));
      setCopyStatus('copied');
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyStatus('idle'), 1500);
    } catch {
      /* ignore clipboard errors */
    }
  };

  const { business, client, invoice, items } = state;

  return (
    <div className="App app" data-accent="blue">
      <div className="editor">
        <div className="topbar topbar--actions-only">
          <div className="topbar-actions">
            <button type="button" className="btn ghost sm" onClick={handleCopyLink}>
              {copyStatus === 'copied' ? I.check : I.copy}{' '}
              {copyStatus === 'copied' ? 'Link copied' : 'Copy share link'}
            </button>
          </div>
        </div>

        <div className="editor-head">
          <h1 className="editor-title">Australian Tax Invoice Generator</h1>
          <p className="editor-sub">
            Create professional tax invoices in minutes. Fill the fields on the left — your invoice
            renders live on the right. Nothing is stored; your URL is the save file.
          </p>
        </div>

        <BusinessDetailsForm value={business} onChange={updateBusiness} />
        <ClientDetailsForm value={client} onChange={updateClient} />
        <InvoiceDetailsForm value={invoice} onChange={setInvoice} />
        <ItemForm items={items} currency={invoice.currency} onChange={setItems} />

        <div className="editor-actions">
          {pdfFailed && (
            <p className="pdf-error" role="alert">
              Couldn&apos;t create the PDF. Try again, or use Print and choose Save as PDF.
            </p>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => window.print()}
            title="Print, or choose Save as PDF for a PDF with selectable text"
          >
            {I.print} Print
          </button>
          <button
            type="button"
            className="btn accent pdf-button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            aria-busy={isGenerating}
            aria-label="Generate PDF invoice"
          >
            {I.download} {isGenerating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>

        <div className="editor-footer">
          Open source ·{' '}
          <a href="https://github.com/logan-han/tax-invoice" rel="noreferrer">
            Source on GitHub
          </a>{' '}
          ·{' '}
          <a href="https://han.life/coffee" target="_blank" rel="noopener">
            ☕ Buy me a coffee
          </a>
        </div>
      </div>

      <div className="preview-pane">
        <div className="preview-bar">
          <span className="preview-label">Live preview · A4</span>
          <div className="preview-zoom" role="group" aria-label="Zoom">
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z}
                type="button"
                className={zoom === z ? 'on' : ''}
                aria-pressed={zoom === z}
                onClick={() => setZoom(z)}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
          </div>
        </div>
        <div className="paper-wrap">
          <div
            style={{
              width: `${595 * zoom}px`,
              height: `${842 * zoom}px`,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              className="paper-scale"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: 595,
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <InvoicePDF
                businessDetails={business}
                clientDetails={client}
                items={items}
                invoiceDate={invoice.invoiceDate}
                invoiceNumber={invoice.invoiceNumber}
                dueDate={invoice.dueDate}
                currency={invoice.currency}
                notes={invoice.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(App);
