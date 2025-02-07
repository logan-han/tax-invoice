import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ClientDetailsForm from '../ClientDetailsForm';

jest.mock('../../styles.css', () => ({})); // Mock the CSS file

test('renders ClientDetailsForm component and updates details', () => {
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <ClientDetailsForm onChange={handleChange} />
  );

  fireEvent.change(getByLabelText('Client Name:'), { target: { value: 'New Client' } });
  fireEvent.change(getByLabelText('Street:'), { target: { value: '456 Avenue' } });
  fireEvent.change(getByLabelText('Suburb:'), { target: { value: 'Suburbia' } });
  fireEvent.change(getByLabelText('State:'), { target: { value: 'State' } });
  fireEvent.change(getByLabelText('Postcode:'), { target: { value: '5678' } });
  fireEvent.change(getByLabelText('ABN:'), { target: { value: '987654321' } });
  fireEvent.change(getByLabelText('ACN:'), { target: { value: '123456789' } });

  expect(handleChange).toHaveBeenCalled();
});
