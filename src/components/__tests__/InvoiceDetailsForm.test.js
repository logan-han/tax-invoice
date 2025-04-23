import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import InvoiceDetailsForm from '../InvoiceDetailsForm';

test('renders InvoiceDetailsForm component and updates details', () => {
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <InvoiceDetailsForm onChange={handleChange} />
  );

  // Use YYYY-MM-DD format which is the standard for HTML date inputs
  fireEvent.change(getByLabelText('Invoice Date'), { target: { value: '2023-02-02' } });
  fireEvent.change(getByLabelText('Invoice Number'), { target: { value: '20230202-0002' } });
  fireEvent.change(getByLabelText('Currency'), { target: { value: 'USD' } });

  expect(handleChange).toHaveBeenCalled();
});

test('due date updates automatically when invoice date changes', () => {
  const handleChange = jest.fn();
  
  const { getByLabelText } = render(
    <InvoiceDetailsForm onChange={handleChange} />
  );

  // Change the invoice date
  fireEvent.change(getByLabelText('Invoice Date'), { target: { value: '2023-02-02' } });
  
  // The due date should have been updated to 2023-03-04 (30 days later)
  const dueDate = getByLabelText('Due Date').value;
  expect(dueDate).toBe('2023-03-04');
});

test('invoice number updates automatically when invoice date changes', () => {
  const handleChange = jest.fn();
  
  const { getByLabelText } = render(
    <InvoiceDetailsForm onChange={handleChange} />
  );

  // Change the invoice date
  fireEvent.change(getByLabelText('Invoice Date'), { target: { value: '2023-02-02' } });
  
  // Check that the invoice number has been updated according to the new date
  const invoiceNumber = getByLabelText('Invoice Number').value;
  expect(invoiceNumber).toBe('20230202-0001');
});
