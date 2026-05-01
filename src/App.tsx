import { useState, useCallback, memo } from 'react';
import BusinessDetailsForm from './components/BusinessDetailsForm';
import ClientDetailsForm from './components/ClientDetailsForm';
import ItemForm from './components/ItemForm';
import InvoicePDF from './components/InvoicePDF';
import InvoiceDetailsForm from './components/InvoiceDetailsForm';
import { I } from './utils/icons';
import { generateInvoicePdf } from './utils/generatePdf';
import type { BusinessDetails, ClientDetails, InvoiceItem, InvoiceDetails } from './types';

const safeJsonParse = <T,>(str: string | null, fallback: T): T => {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    console.warn('Failed to parse URL parameter');
    return fallback;
  }
};

const emptyBusinessDetails: BusinessDetails = {
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

const emptyClientDetails: ClientDetails = {
  name: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  abn: '',
  acn: '',
};

const emptyInvoiceDetails: InvoiceDetails = {
  invoiceDate: '',
  invoiceNumber: '',
  dueDate: '',
  currency: '',
  notes: '',
};

const getQueryParams = (): URLSearchParams => {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
};

const getInitialBusinessDetails = (): BusinessDetails => {
  const queryParams = getQueryParams();
  return {
    name: queryParams.get('businessName') || '',
    street: queryParams.get('businessStreet') || '',
    suburb: queryParams.get('businessSuburb') || '',
    state: queryParams.get('businessState') || '',
    postcode: queryParams.get('businessPostcode') || '',
    phone: queryParams.get('businessPhone') || '',
    email: queryParams.get('businessEmail') || '',
    abn: queryParams.get('businessAbn') || '',
    acn: queryParams.get('businessAcn') || '',
    accountName: queryParams.get('businessAccountName') || '',
    bsb: queryParams.get('businessBsb') || '',
    accountNumber: queryParams.get('businessAccountNumber') || '',
  };
};

const getInitialClientDetails = (): ClientDetails => {
  const queryParams = getQueryParams();
  const legacyClient: ClientDetails = {
    name: queryParams.get('clientName') || '',
    street: queryParams.get('clientStreet') || '',
    suburb: queryParams.get('clientSuburb') || '',
    state: queryParams.get('clientState') || '',
    postcode: queryParams.get('clientPostcode') || '',
    abn: queryParams.get('clientAbn') || '',
    acn: queryParams.get('clientAcn') || '',
  };
  return queryParams.has('client')
    ? safeJsonParse<ClientDetails>(queryParams.get('client'), emptyClientDetails)
    : legacyClient;
};

const getInitialItems = (): InvoiceItem[] => {
  const queryParams = getQueryParams();
  return safeJsonParse<InvoiceItem[]>(queryParams.get('items'), []);
};

const ZOOM_LEVELS = [0.55, 0.7, 0.85, 1, 1.5] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const getInitialZoom = (): ZoomLevel => {
  if (typeof window === 'undefined') return 0.85;
  if (window.innerWidth < 720) return 0.55;
  if (window.innerWidth < 1400) return 0.85;
  return 1;
};

function App() {
  const [businessDetails, setBusinessDetails] =
    useState<BusinessDetails>(getInitialBusinessDetails);
  const [clientDetails, setClientDetails] = useState<ClientDetails>(getInitialClientDetails);
  const [items, setItems] = useState<InvoiceItem[]>(getInitialItems);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(emptyInvoiceDetails);
  const [zoom, setZoom] = useState<ZoomLevel>(getInitialZoom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const updateUrl = useCallback(
    (
      business: BusinessDetails,
      client: ClientDetails,
      itemsList: InvoiceItem[],
      invoice: InvoiceDetails
    ) => {
      const url = new URL(window.location.href);
      url.searchParams.set('businessName', business.name);
      url.searchParams.set('businessStreet', business.street);
      url.searchParams.set('businessSuburb', business.suburb);
      url.searchParams.set('businessState', business.state);
      url.searchParams.set('businessPostcode', business.postcode);
      url.searchParams.set('businessPhone', business.phone);
      url.searchParams.set('businessEmail', business.email);
      url.searchParams.set('businessAbn', business.abn);
      url.searchParams.set('businessAcn', business.acn);
      url.searchParams.set('businessAccountName', business.accountName);
      url.searchParams.set('businessBsb', business.bsb);
      url.searchParams.set('businessAccountNumber', business.accountNumber);
      url.searchParams.set('client', JSON.stringify(client));
      url.searchParams.set('items', JSON.stringify(itemsList));
      url.searchParams.set('invoice', JSON.stringify(invoice));
      window.history.replaceState({}, '', url);
    },
    []
  );

  const handleBusinessDetailsChange = useCallback(
    (details: BusinessDetails) => {
      setBusinessDetails(details);
      updateUrl(details, clientDetails, items, invoiceDetails);
    },
    [clientDetails, items, invoiceDetails, updateUrl]
  );

  const handleClientDetailsChange = useCallback(
    (details: ClientDetails) => {
      setClientDetails(details);
      updateUrl(businessDetails, details, items, invoiceDetails);
    },
    [businessDetails, items, invoiceDetails, updateUrl]
  );

  const handleItemsChange = useCallback(
    (newItems: InvoiceItem[]) => {
      setItems(newItems);
      updateUrl(businessDetails, clientDetails, newItems, invoiceDetails);
    },
    [businessDetails, clientDetails, invoiceDetails, updateUrl]
  );

  const handleInvoiceDetailsChange = useCallback(
    (details: InvoiceDetails) => {
      setInvoiceDetails(details);
      updateUrl(businessDetails, clientDetails, items, details);
    },
    [businessDetails, clientDetails, items, updateUrl]
  );

  const handleGeneratePdf = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateInvoicePdf(invoiceDetails.invoiceNumber);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [invoiceDetails.invoiceNumber]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    } catch {
      /* ignore clipboard errors */
    }
  }, []);

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
              Create professional tax invoices in minutes. Fill the fields on the left — your
              invoice renders live on the right. Nothing is stored; your URL is the save file.
            </p>
          </div>

          <BusinessDetailsForm
            onChange={handleBusinessDetailsChange}
            value={businessDetails}
          />
          <ClientDetailsForm onChange={handleClientDetailsChange} value={clientDetails} />
          <InvoiceDetailsForm onChange={handleInvoiceDetailsChange} />
          <ItemForm items={items} onChange={handleItemsChange} />

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
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

          <div
            style={{
              marginTop: 40,
              paddingTop: 20,
              borderTop: '1px solid var(--line)',
              color: 'var(--ink-3)',
              fontSize: 11,
            }}
          >
            Open source ·{' '}
            <a
              href="https://github.com/logan-han/tax-invoice"
              style={{ color: 'var(--ink-2)' }}
              rel="noreferrer"
            >
              Source on GitHub
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
                  businessDetails={businessDetails}
                  clientDetails={clientDetails}
                  items={items}
                  invoiceDate={invoiceDetails.invoiceDate}
                  invoiceNumber={invoiceDetails.invoiceNumber}
                  dueDate={invoiceDetails.dueDate}
                  currency={invoiceDetails.currency}
                  notes={invoiceDetails.notes}
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default memo(App);
