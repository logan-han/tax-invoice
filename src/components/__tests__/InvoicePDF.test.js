import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';

jest.mock('jspdf', () => {
  const saveMock = jest.fn();
  return jest.fn().mockImplementation(() => ({
    save: saveMock,
    addImage: jest.fn(),
    addPage: jest.fn(),
    getImageProperties: jest.fn().mockReturnValue({ width: 210, height: 297 }),
    internal: {
      pageSize: {
        height: 297,
        getWidth: jest.fn().mockReturnValue(210),
        getHeight: jest.fn().mockReturnValue(297)
      }
    }
  }));
});

jest.mock('html2canvas', () => {
  return jest.fn().mockImplementation(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,'
  }));
});

test('renders InvoicePDF component', () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: true }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '20250101-0001';

  const { getByText } = render(
    <InvoicePDF
      businessDetails={businessDetails}
      clientDetails={clientDetails}
      items={items}
      invoiceDate={invoiceDate}
      invoiceNumber={invoiceNumber}
    />
  );

  expect(getByText('Business Name')).toBeInTheDocument();
  expect(getByText('Client Name')).toBeInTheDocument();
  expect(getByText('Item 1')).toBeInTheDocument();
  expect(getByText('Tax Invoice # 20250101-0001')).toBeInTheDocument();
});

test('generates PDF', async () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: true }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '20250101-0001';

  const { getByText } = render(
    <InvoicePDF
      businessDetails={businessDetails}
      clientDetails={clientDetails}
      items={items}
      invoiceDate={invoiceDate}
      invoiceNumber={invoiceNumber}
    />
  );

  fireEvent.click(getByText('Generate PDF'));

  await waitFor(() => {
    const jsPDFMock = require('jspdf');
    expect(jsPDFMock).toHaveBeenCalled();
    expect(jsPDFMock().save).toHaveBeenCalledWith(`invoice-20250101-0001.pdf`);
  });
});

test('calculates GST correctly for "add" option', () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: 'add' }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '0001';

  const { getAllByText } = render(
    <InvoicePDF
      businessDetails={businessDetails}
      clientDetails={clientDetails}
      items={items}
      invoiceDate={invoiceDate}
      invoiceNumber={invoiceNumber}
    />
  );

  expect(getAllByText('$100.00')).toHaveLength(3); // Subtotal, Unit Price, Amount
  expect(getAllByText('$10.00')).toHaveLength(1); // GST
  expect(getAllByText('$110.00')).toHaveLength(1); // Total
});

test('calculates GST correctly for "inclusive" option', () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 110, gst: 'inclusive' }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '0001';

  const { getAllByText, getByText } = render(
    <InvoicePDF
      businessDetails={businessDetails}
      clientDetails={clientDetails}
      items={items}
      invoiceDate={invoiceDate}
      invoiceNumber={invoiceNumber}
    />
  );

  expect(getAllByText('$100.00')).toHaveLength(2); // Subtotal, Unit Price
  expect(getAllByText('$10.00')).toHaveLength(1); // GST
  expect(getByText('$110.00', { selector: 'b' })).toBeInTheDocument(); // Total
});

test('calculates GST correctly for "none" option', () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: 'none' }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '0001';

  const { getAllByText, getByText } = render(
    <InvoicePDF
      businessDetails={businessDetails}
      clientDetails={clientDetails}
      items={items}
      invoiceDate={invoiceDate}
      invoiceNumber={invoiceNumber}
    />
  );

  expect(getAllByText('$100.00')).toHaveLength(3); // Subtotal, Unit Price, Amount
  expect(getByText('$100.00', { selector: 'b' })).toBeInTheDocument(); // Total
});
