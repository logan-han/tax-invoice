import { describe, it, expect } from 'vitest';
import { blankItem, readState, writeState, type InvoiceState } from '../urlState';

const TODAY = '2026-10-10';

const withoutIds = (state: InvoiceState) => ({
  ...state,
  items: state.items.map(({ name, quantity, price, gst }) => ({ name, quantity, price, gst })),
});

const fullState = (): InvoiceState => ({
  business: {
    name: 'Acme Consulting',
    street: '5/123 Example St',
    suburb: 'Richmond',
    state: 'VIC',
    postcode: '3121',
    phone: '0412 345 678',
    email: 'accounts@acme.example',
    abn: '51 824 753 556',
    acn: '',
    accountName: 'Acme Consulting',
    bsb: '063-000',
    accountNumber: '12345678',
  },
  client: {
    name: 'Client & Co',
    street: '',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    abn: '',
    acn: '',
  },
  invoice: {
    invoiceDate: '2026-10-01',
    invoiceNumber: 'INV-042',
    dueDate: '2026-10-15',
    currency: 'AUD',
    notes: 'Thanks!\nPay within 14 days.',
  },
  items: [
    { id: 'a', name: 'Consulting', quantity: 7.5, price: 150, gst: 'add' },
    { id: 'b', name: 'Licence', quantity: 1, price: 99, gst: 'inclusive' },
  ],
});

describe('readState defaults', () => {
  it('starts a fresh invoice dated today with one blank line', () => {
    const state = readState('', TODAY);

    expect(state.business.name).toBe('');
    expect(state.client.name).toBe('');
    expect(state.invoice).toEqual({
      invoiceDate: '2026-10-10',
      invoiceNumber: '20261010-0001',
      dueDate: '2026-11-09',
      currency: '',
      notes: 'Payment due by 9 Nov 2026.',
    });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ name: '', quantity: 1, price: 0, gst: 'add' });
  });

  it('gives every line its own id', () => {
    const ids = [blankItem().id, blankItem().id, ...readState('', TODAY).items.map((i) => i.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('round trip', () => {
  it('reads back everything it writes', () => {
    const state = fullState();
    const restored = readState(writeState(state), TODAY);
    expect(withoutIds(restored)).toEqual(withoutIds(state));
  });

  it('keeps more than ten line items', () => {
    const state = fullState();
    state.items = Array.from({ length: 12 }, (_, i) => ({
      id: `${i}`,
      name: `Line ${i + 1}`,
      quantity: 1,
      price: i,
      gst: 'no' as const,
    }));
    const restored = readState(writeState(state), TODAY);
    expect(restored.items).toHaveLength(12);
    expect(restored.items[11].name).toBe('Line 12');
  });

  it('keeps fractional quantities', () => {
    const restored = readState(writeState(fullState()), TODAY);
    expect(restored.items[0].quantity).toBe(7.5);
  });
});

describe('writeState', () => {
  it('leaves out empty business fields and an empty client', () => {
    const state = readState('', TODAY);
    state.business.name = 'Solo';
    const params = new URLSearchParams(writeState(state));

    expect(params.get('businessName')).toBe('Solo');
    expect(params.has('businessStreet')).toBe(false);
    expect(params.has('client')).toBe(false);
  });

  it('only stores the client fields that are filled in', () => {
    const params = new URLSearchParams(writeState(fullState()));
    expect(JSON.parse(params.get('client') ?? '')).toEqual({
      name: 'Client & Co',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    });
  });

  it('keeps row ids out of the link', () => {
    const params = new URLSearchParams(writeState(fullState()));
    expect(params.get('items')).not.toContain('"id"');
  });

  it('keeps unrelated params and drops the old per-field formats', () => {
    const base = 'utm_source=newsletter&clientName=Old&itemName_0=Old&itemPrice_11=5&businessAcn=1';
    const params = new URLSearchParams(writeState(fullState(), base));

    expect(params.get('utm_source')).toBe('newsletter');
    expect(params.has('clientName')).toBe(false);
    expect(params.has('itemName_0')).toBe(false);
    expect(params.has('itemPrice_11')).toBe(false);
    expect(params.has('businessAcn')).toBe(false);
  });
});

describe('links from earlier versions', () => {
  it('reads flat client params when there is no client JSON', () => {
    const state = readState('?clientName=Legacy+Client&clientSuburb=Perth&clientState=WA', TODAY);
    expect(state.client).toMatchObject({ name: 'Legacy Client', suburb: 'Perth', state: 'WA' });
  });

  it('prefers client JSON over flat params', () => {
    const client = encodeURIComponent(JSON.stringify({ name: 'JSON Client' }));
    const state = readState(`?client=${client}&clientName=Legacy`, TODAY);
    expect(state.client.name).toBe('JSON Client');
  });

  it('reads per-line item params, however many there are', () => {
    const search = Array.from(
      { length: 12 },
      (_, i) => `itemName_${i}=Line+${i}&itemQuantity_${i}=2&itemPrice_${i}=10.5&itemGst_${i}=no`
    ).join('&');
    const state = readState(`?${search}`, TODAY);

    expect(state.items).toHaveLength(12);
    expect(state.items[0]).toMatchObject({ name: 'Line 0', quantity: 2, price: 10.5, gst: 'no' });
  });

  it('fills sensible defaults for missing per-line values', () => {
    const state = readState('?itemName_0=Widget', TODAY);
    expect(state.items[0]).toMatchObject({ name: 'Widget', quantity: 1, price: 0, gst: 'add' });
  });

  it('prefers items JSON over per-line params', () => {
    const items = encodeURIComponent(JSON.stringify([{ name: 'JSON', quantity: 1, price: 1 }]));
    const state = readState(`?items=${items}&itemName_0=Legacy`, TODAY);
    expect(state.items.map((i) => i.name)).toEqual(['JSON']);
  });

  it('reads items that still carry ids', () => {
    const items = encodeURIComponent(
      JSON.stringify([{ id: 'item-1', name: 'Old', quantity: 2, price: 5, gst: 'inclusive' }])
    );
    expect(readState(`?items=${items}`, TODAY).items[0]).toMatchObject({
      name: 'Old',
      quantity: 2,
      price: 5,
      gst: 'inclusive',
    });
  });
});

describe('links from 2025', () => {
  it('reads business details from the old business JSON', () => {
    const business = encodeURIComponent(
      JSON.stringify({ name: 'Old Co', bsb: '063-000', accountNumber: '1234' })
    );
    expect(readState(`?business=${business}`, TODAY).business).toMatchObject({
      name: 'Old Co',
      bsb: '063-000',
      accountNumber: '1234',
      street: '',
    });
  });

  it('prefers the flat business params over the old JSON', () => {
    const business = encodeURIComponent(JSON.stringify({ name: 'Old Co', street: '1 Old St' }));
    const state = readState(`?business=${business}&businessName=New+Co&businessStreet=`, TODAY);
    expect(state.business.name).toBe('New Co');
    expect(state.business.street).toBe('');
  });

  it('reads the true/false GST checkbox from the first versions', () => {
    const items = encodeURIComponent(
      JSON.stringify([
        { name: 'Taxed', quantity: 1, price: 100, gst: true },
        { name: 'Free', quantity: 1, price: 100, gst: false },
      ])
    );
    expect(readState(`?items=${items}`, TODAY).items.map((i) => i.gst)).toEqual(['add', 'no']);
    expect(
      readState('?itemName_0=A&itemGst_0=false&itemName_1=B&itemGst_1=true', TODAY).items.map(
        (i) => i.gst
      )
    ).toEqual(['no', 'add']);
  });

  it('drops params for fields that no longer exist', () => {
    const base =
      'business=%7B%22name%22%3A%22Old%22%7D&clientPhone=0400&currencyRemarkEnabled=true&currencyRemarkCurrency=USD';
    const params = new URLSearchParams(writeState(fullState(), base));
    for (const key of [
      'business',
      'clientPhone',
      'currencyRemarkEnabled',
      'currencyRemarkCurrency',
    ]) {
      expect(params.has(key)).toBe(false);
    }
  });
});

describe('damaged links', () => {
  it('falls back to defaults for unparseable JSON', () => {
    const state = readState('?client=%7Bnope&items=also-bad&invoice=%5B1%5D', TODAY);

    expect(state.client.name).toBe('');
    expect(state.items).toHaveLength(1);
    expect(state.invoice.invoiceDate).toBe(TODAY);
  });

  it('ignores junk inside the JSON', () => {
    const items = encodeURIComponent(
      JSON.stringify([null, 'x', { name: 7, quantity: 'lots', price: '12.5', gst: 'sometimes' }])
    );
    const invoice = encodeURIComponent(JSON.stringify({ currency: 'DOGE', notes: 3 }));
    const state = readState(`?items=${items}&invoice=${invoice}`, TODAY);

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ name: '', quantity: 1, price: 12.5, gst: 'add' });
    expect(state.invoice.currency).toBe('');
    expect(state.invoice.notes).toBe('Payment due by 9 Nov 2026.');
  });

  it('keeps notes the user cleared on purpose', () => {
    const invoice = encodeURIComponent(JSON.stringify({ dueDate: '2026-11-09', notes: '' }));
    expect(readState(`?invoice=${invoice}`, TODAY).invoice.notes).toBe('');
  });

  it('starts with a blank line when the saved list is empty', () => {
    expect(readState('?items=%5B%5D', TODAY).items).toHaveLength(1);
  });
});
