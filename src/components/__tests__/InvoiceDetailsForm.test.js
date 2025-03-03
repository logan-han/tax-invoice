import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import InvoiceDetailsForm from '../InvoiceDetailsForm';

jest.mock('../../styles.css', () => ({}));

test('renders InvoiceDetailsForm component and updates details', () => {
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <InvoiceDetailsForm onChange={handleChange} />
  );

  fireEvent.change(getByLabelText('Invoice Date'), { target: { value: '02-02-2023' } });
  fireEvent.change(getByLabelText('Invoice Number'), { target: { value: '20230202-0002' } });

  expect(handleChange).toHaveBeenCalled();
});
