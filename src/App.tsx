import { useState, useEffect, useCallback, memo } from 'react';
import { LoadScript } from '@react-google-maps/api';
import BusinessDetailsForm from './components/BusinessDetailsForm';
import ClientDetailsForm from './components/ClientDetailsForm';
import ItemForm from './components/ItemForm';
import InvoicePDF from './components/InvoicePDF';
import InvoiceDetailsForm from './components/InvoiceDetailsForm';
import type { BusinessDetails, ClientDetails, InvoiceItem, InvoiceDetails } from './types';

const googleMapsApiKey = 'AIzaSyBN-y5TW0Yz1qMBj7i4GA6KD2ToAp4us4o';
const libraries: ('places')[] = ['places'];

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
};

function App() {
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(emptyBusinessDetails);
  const [clientDetails, setClientDetails] = useState<ClientDetails>(emptyClientDetails);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(emptyInvoiceDetails);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);

    // Read business details from flat URL params
    const business: BusinessDetails = {
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

    const client = safeJsonParse<ClientDetails>(queryParams.get('client'), emptyClientDetails);
    const storedItems = safeJsonParse<InvoiceItem[]>(queryParams.get('items'), []);
    setBusinessDetails(business);
    setClientDetails(client);
    setItems(storedItems);
  }, []);

  const updateUrl = useCallback(
    (
      business: BusinessDetails,
      client: ClientDetails,
      itemsList: InvoiceItem[],
      invoice: InvoiceDetails
    ) => {
      const url = new URL(window.location.href);
      // Use flat format for business details
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

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries} loading="async" version="beta">
      <div className="App container my-4">
        <header className="mb-5 text-center">
          <h1 className="display-4 text-primary font-weight-bold">
            <span className="me-2" aria-hidden="true">
              📄
            </span>
            Australian Tax Invoice Generator
          </h1>
          <p className="lead text-muted">Create professional tax invoices in minutes</p>
        </header>

        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <BusinessDetailsForm onChange={handleBusinessDetailsChange} value={businessDetails} />
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <ClientDetailsForm onChange={handleClientDetailsChange} />
              </div>
              <div className="card-body">
                <InvoiceDetailsForm onChange={handleInvoiceDetailsChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <ItemForm items={items} onChange={handleItemsChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow">
              <div className="card-body">
                <InvoicePDF
                  businessDetails={businessDetails}
                  clientDetails={clientDetails}
                  items={items}
                  invoiceDate={invoiceDetails.invoiceDate}
                  invoiceNumber={invoiceDetails.invoiceNumber}
                  dueDate={invoiceDetails.dueDate}
                  currency={invoiceDetails.currency}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}

export default memo(App);
