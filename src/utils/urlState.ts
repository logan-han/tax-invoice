import type { BusinessDetails, ClientDetails, InvoiceDetails, InvoiceItem } from '../types';
import { addDays } from './dates';
import { CURRENCIES, DEFAULT_PAYMENT_TERMS_DAYS } from './constants';
import { defaultInvoiceNumber, defaultNotes } from './invoice';

export interface InvoiceState {
  business: BusinessDetails;
  client: ClientDetails;
  invoice: InvoiceDetails;
  items: InvoiceItem[];
}

// Business details stay as flat params so links made by earlier versions keep loading.
const BUSINESS_PARAMS: Record<keyof BusinessDetails, string> = {
  name: 'businessName',
  street: 'businessStreet',
  suburb: 'businessSuburb',
  state: 'businessState',
  postcode: 'businessPostcode',
  phone: 'businessPhone',
  email: 'businessEmail',
  abn: 'businessAbn',
  acn: 'businessAcn',
  accountName: 'businessAccountName',
  bsb: 'businessBsb',
  accountNumber: 'businessAccountNumber',
};

// Older formats, read when the current params are absent and dropped on the next write.
const LEGACY_CLIENT_PARAMS: Record<keyof ClientDetails, string> = {
  name: 'clientName',
  street: 'clientStreet',
  suburb: 'clientSuburb',
  state: 'clientState',
  postcode: 'clientPostcode',
  abn: 'clientAbn',
  acn: 'clientAcn',
};
const LEGACY_ITEM_PARAM = /^item(Name|Quantity|Price|Gst)_\d+$/;
// Business details were a JSON param until Dec 2025; the rest belong to fields since removed.
const LEGACY_PARAMS = [
  'business',
  'clientPhone',
  'currencyRemarkEnabled',
  'currencyRemarkCurrency',
];

const OWNED_PARAMS = new Set([
  ...Object.values(BUSINESS_PARAMS),
  ...Object.values(LEGACY_CLIENT_PARAMS),
  ...LEGACY_PARAMS,
  'client',
  'items',
  'invoice',
]);

const GST_MODES: readonly InvoiceItem['gst'][] = ['no', 'add', 'inclusive'];

let itemCounter = 0;
const newItemId = (): string => `item-${++itemCounter}`;

export const blankItem = (): InvoiceItem => ({
  id: newItemId(),
  name: '',
  quantity: 1,
  price: 0,
  gst: 'add',
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJson = (raw: string | null): unknown => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

const number = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const gstMode = (value: unknown): InvoiceItem['gst'] => {
  if (GST_MODES.includes(value as InvoiceItem['gst'])) return value as InvoiceItem['gst'];
  // Until Feb 2025 GST was a checkbox, saved as true/false.
  return value === false || value === 'false' ? 'no' : 'add';
};

const toItem = (raw: Record<string, unknown>): InvoiceItem => ({
  id: newItemId(),
  name: text(raw.name),
  quantity: number(raw.quantity, 1),
  price: number(raw.price, 0),
  gst: gstMode(raw.gst),
});

const readBusiness = (params: URLSearchParams): BusinessDetails => {
  const json = parseJson(params.get('business'));
  const legacy = isRecord(json) ? json : {};
  const entries = Object.entries(BUSINESS_PARAMS).map(([field, param]) => [
    field,
    params.get(param) ?? text(legacy[field]),
  ]);
  return Object.fromEntries(entries) as BusinessDetails;
};

const readClient = (params: URLSearchParams): ClientDetails => {
  const json = params.has('client') ? parseJson(params.get('client')) : undefined;
  const stored = isRecord(json) ? json : {};
  const entries = Object.entries(LEGACY_CLIENT_PARAMS).map(([field, legacyParam]) => [
    field,
    params.has('client') ? text(stored[field]) : (params.get(legacyParam) ?? ''),
  ]);
  return Object.fromEntries(entries) as ClientDetails;
};

const readItems = (params: URLSearchParams): InvoiceItem[] => {
  let items: InvoiceItem[] = [];
  if (params.has('items')) {
    const json = parseJson(params.get('items'));
    items = Array.isArray(json) ? json.filter(isRecord).map(toItem) : [];
  } else {
    for (let i = 0; params.has(`itemName_${i}`); i++) {
      items.push(
        toItem({
          name: params.get(`itemName_${i}`),
          quantity: params.get(`itemQuantity_${i}`),
          price: params.get(`itemPrice_${i}`),
          gst: params.get(`itemGst_${i}`),
        })
      );
    }
  }
  return items.length > 0 ? items : [blankItem()];
};

const readInvoice = (params: URLSearchParams, today: string): InvoiceDetails => {
  const json = parseJson(params.get('invoice'));
  const stored = isRecord(json) ? json : {};
  const invoiceDate = text(stored.invoiceDate) || today;
  const dueDate = text(stored.dueDate) || addDays(invoiceDate, DEFAULT_PAYMENT_TERMS_DAYS);
  const currency = text(stored.currency);
  return {
    invoiceDate,
    invoiceNumber: text(stored.invoiceNumber) || defaultInvoiceNumber(invoiceDate),
    dueDate,
    currency: CURRENCIES.includes(currency) ? currency : '',
    notes: typeof stored.notes === 'string' ? stored.notes : defaultNotes(dueDate),
  };
};

/** Rebuilds the whole invoice from a query string, falling back to defaults for anything missing. */
export const readState = (search: string, today: string): InvoiceState => {
  const params = new URLSearchParams(search);
  return {
    business: readBusiness(params),
    client: readClient(params),
    invoice: readInvoice(params, today),
    items: readItems(params),
  };
};

/** Writes the invoice into a query string, keeping any unrelated params (e.g. utm_*) in `base`. */
export const writeState = (state: InvoiceState, base = ''): string => {
  const params = new URLSearchParams(base);
  for (const key of [...params.keys()]) {
    if (OWNED_PARAMS.has(key) || LEGACY_ITEM_PARAM.test(key)) params.delete(key);
  }

  for (const [field, param] of Object.entries(BUSINESS_PARAMS)) {
    const value = state.business[field as keyof BusinessDetails];
    if (value) params.set(param, value);
  }

  const client = Object.fromEntries(Object.entries(state.client).filter(([, value]) => value));
  if (Object.keys(client).length > 0) params.set('client', JSON.stringify(client));

  // Row ids only key React rows, so they stay out of the link.
  const items = state.items.map(({ name, quantity, price, gst }) => ({
    name,
    quantity,
    price,
    gst,
  }));
  params.set('items', JSON.stringify(items));
  params.set('invoice', JSON.stringify(state.invoice));

  return params.toString();
};
