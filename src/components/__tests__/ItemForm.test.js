import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import InvoiceForm from '../ItemForm';

jest.mock('../../styles.css', () => ({}));

test('renders InvoiceForm component and adds an item', () => {
  const items = [];
  const handleChange = jest.fn();

  const { getByText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.click(getByText('Add Item'));

  expect(handleChange).toHaveBeenCalledWith([{ name: '', quantity: 1, price: 0, gst: false }]);
});

test('handles item changes', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: false }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Item Name'), { target: { value: 'Updated Item' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Updated Item', quantity: 1, price: 10, gst: false }]);
});

test('removes an item', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: false }];
  const handleChange = jest.fn();

  const { getByText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.click(getByText('Remove Item'));

  expect(handleChange).toHaveBeenCalledWith([]);
});

test('handles currency remark changes', () => {
  const items = [];
  const handleChange = jest.fn();
  const handleCurrencyRemarkChange = jest.fn();

  const { getByText, getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} currencyRemark={{ enabled: false, currency: 'AUD' }} onCurrencyRemarkChange={handleCurrencyRemarkChange} />
  );

  fireEvent.click(getByText('Add Currency'));

  expect(handleCurrencyRemarkChange).toHaveBeenCalledWith({ enabled: true, currency: 'AUD' });
});
