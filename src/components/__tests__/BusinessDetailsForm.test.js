import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import BusinessDetailsForm from '../BusinessDetailsForm';

test('renders BusinessDetailsForm component and updates details', () => {
    const handleChange = jest.fn();

    const { getByLabelText } = render(
        <BusinessDetailsForm onChange={handleChange} />
    );

    fireEvent.change(getByLabelText('Business Name:'), { target: { value: 'New Business' } });
    fireEvent.change(getByLabelText('Street:'), { target: { value: '123 Street' } });
    fireEvent.change(getByLabelText('Suburb:'), { target: { value: 'Suburbia' } });
    fireEvent.change(getByLabelText('State:'), { target: { value: 'State' } });
    fireEvent.change(getByLabelText('Postcode:'), { target: { value: '1234' } });
    fireEvent.change(getByLabelText('Phone:'), { target: { value: '1234567890' } });
    fireEvent.change(getByLabelText('Email:'), { target: { value: 'email@example.com' } });
    fireEvent.change(getByLabelText('ABN:'), { target: { value: '123456789' } });
    fireEvent.change(getByLabelText('ACN:'), { target: { value: '987654321' } });

    expect(handleChange).toHaveBeenCalled();
});
