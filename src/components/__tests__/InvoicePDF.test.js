import React from 'react';
import { render } from '@testing-library/react';
import InvoicePDF from '../InvoicePDF';

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }));
});

jest.mock('html2canvas', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});

jest.mock('../../styles.css', () => ({})); // Mock the CSS file

test('renders InvoicePDF component', () => {
  const businessDetails = { name: 'Business Name' };
  const clientDetails = { name: 'Client Name' };
  const items = [{ name: 'Item 1', quantity: 1, price: 100, gst: true }];
  const invoiceDate = '01-01-2023';
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
