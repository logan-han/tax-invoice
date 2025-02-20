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
