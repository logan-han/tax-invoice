import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import InvoiceForm from '../ItemForm';

jest.mock('../../styles.css', () => ({}));

test('renders InvoiceForm component and adds an item', () => {
  const items = [];
  const handleChange = jest.fn();

  const { getByText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.click(getByText('Add Item'));

  expect(handleChange).toHaveBeenCalledWith([{ name: '', quantity: 1, price: 0, gst: 'no' }]);
});

test('handles item changes', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: 'no' }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Item Name'), { target: { value: 'Updated Item' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Updated Item', quantity: 1, price: 10, gst: 'no' }]);
});

test('removes an item', () => {
  const items = [
    { name: 'Item 1', quantity: 1, price: 10, gst: 'no' },
    { name: 'Item 2', quantity: 2, price: 20, gst: 'add' }
  ];
  const handleChange = jest.fn();

  render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
  fireEvent.click(removeButtons[removeButtons.length - 1]);

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: 1, price: 10, gst: 'no' }]);
});

test('handles item quantity change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: 'no' }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Quantity'), { target: { value: '2' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: '2', price: 10, gst: 'no' }]);
});

test('handles item price change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: 'no' }];
  const handleChange = jest.fn();

  const { getByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getByPlaceholderText('Price'), { target: { value: '20' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: 1, price: '20', gst: 'no' }]);
});

test('handles item GST change', () => {
  const items = [{ name: 'Item 1', quantity: 1, price: 10, gst: 'no' }];
  const handleChange = jest.fn();

  render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  const gstSelect = screen.getByRole('combobox', {name: ""});
  fireEvent.change(gstSelect, { target: { value: 'add' } });

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 1', quantity: 1, price: 10, gst: 'add' }]);
});

test('handles multiple items changes', () => {
  const items = [
    { name: 'Item 1', quantity: 1, price: 10, gst: 'no' },
    { name: 'Item 2', quantity: 2, price: 20, gst: 'add' }
  ];
  const handleChange = jest.fn();

  const { getAllByPlaceholderText } = render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  fireEvent.change(getAllByPlaceholderText('Item Name')[0], { target: { value: 'Updated Item 1' } });
  fireEvent.change(getAllByPlaceholderText('Quantity')[0], { target: { value: '3' } });

  expect(handleChange).toHaveBeenCalledWith([
    { name: 'Updated Item 1', quantity: '3', price: 10, gst: 'no' },
    { name: 'Item 2', quantity: 2, price: 20, gst: 'add' }
  ]);
});

test('handles multiple items removal', () => {
  const items = [
    { name: 'Item 1', quantity: 1, price: 10, gst: 'no' },
    { name: 'Item 2', quantity: 2, price: 20, gst: 'add' }
  ];
  const handleChange = jest.fn();

  render(
    <InvoiceForm items={items} onChange={handleChange} />
  );

  const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
  fireEvent.click(removeButtons[0]);

  expect(handleChange).toHaveBeenCalledWith([{ name: 'Item 2', quantity: 2, price: 20, gst: 'add' }]);
});
