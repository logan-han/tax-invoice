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

test('handles item quantity change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: false }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Quantity'), { target: { value: '2' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: '2', price: 10, gst: false }]);
});

test('handles item price change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: false }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Price'), { target: { value: '20' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: 1, price: '20', gst: false }]);
});

test('handles item GST change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: false }];
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.click(getByLabelText('Add GST'));

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: 1, price: 10, gst: true }]);
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

test('handles multiple items changes', () => {
  const items = [
    { name: 'Item 1', quantity: 1, price: 10, gst: false },
    { name: 'Item 2', quantity: 2, price: 20, gst: true }
  ];
  const handleChange = jest.fn();

  const { getAllByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getAllByPlaceholderText('Item Name')[0], { target: { value: 'Updated Item 1' } });
  fireEvent.change(getAllByPlaceholderText('Quantity')[0], { target: { value: '3' } });

  expect(handleChange).toHaveBeenCalledWith([
    { name: 'Updated Item 1', quantity: '3', price: 10, gst: false },
    { name: 'Item 2', quantity: 2, price: 20, gst: true }
  ]);
});

test('handles multiple items removal', () => {
  const items = [
    { name: 'Item 1', quantity: 1, price: 10, gst: false },
    { name: 'Item 2', quantity: 2, price: 20, gst: true }
  ];
  const handleChange = jest.fn();

  const { getAllByText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.click(getAllByText('Remove Item')[0]);

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 2', quantity: 2, price: 20, gst: true }]);
});
