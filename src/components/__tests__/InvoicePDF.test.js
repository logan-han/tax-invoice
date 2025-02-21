import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';

jest.mock('../../styles.css', () => ({}));

jest.mock('jspdf', () => {
  const saveMock = jest.fn();
  return jest.fn().mockImplementation(() => ({
    save: saveMock,
    addImage: jest.fn(),
    addPage: jest.fn(),
    internal: {
      pageSize: {
        height: 297
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
  const invoiceNumber = '0001';

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
  expect(getByText('Tax Invoice # 0001')).toBeInTheDocument();
});

test('generates PDF', async () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: true }];
  const invoiceDate = '01-01-2025';
  const invoiceNumber = '0001';

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
    expect(jsPDFMock().save).toHaveBeenCalledWith('invoice_01012025-0001.pdf');
  });
});
