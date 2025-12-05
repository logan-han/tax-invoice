import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientDetailsForm from '../ClientDetailsForm';

// Keep the mock simple for form tests, focus on interaction
jest.mock('../AddressAutocomplete', () => ({ onPlaceSelected, id, placeholder, className }) => {
    const handleChange = (event) => {
        // Simulate a place selection when a specific value is entered
        if (event.target.value === '456 High St, Melbourne VIC 3000') {
             onPlaceSelected({
                address_components: [
                    { long_name: '456', types: ['street_number'] },
                    { long_name: 'High St', types: ['route'] },
                    { long_name: 'Melbourne', types: ['locality'] },
                    { short_name: 'VIC', types: ['administrative_area_level_1'] },
                    { long_name: '3000', types: ['postal_code'] }
                ]
            });
        }
    };
    return (
        <input
            data-testid={`autocomplete-${id}`} // Use id for unique test id
            id={id}
            placeholder={placeholder}
            className={className}
            onChange={handleChange}
        />
    );
});

describe('ClientDetailsForm', () => {
    it('renders the form fields', () => {
        render(<ClientDetailsForm onChange={jest.fn()} />);
        expect(screen.getByLabelText('Client Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Address')).toBeInTheDocument();
        expect(screen.getByLabelText('ABN')).toBeInTheDocument();
        expect(screen.getByLabelText('ACN')).toBeInTheDocument();
    });

    it('updates address fields when a place is selected', () => {
        render(<ClientDetailsForm onChange={jest.fn()} />);
        // Use the specific id assigned in ClientDetailsForm
        const autocompleteInput = screen.getByTestId('autocomplete-clientFullAddress');

        // Simulate typing the address that triggers the mock's onPlaceSelected
        fireEvent.change(autocompleteInput, { target: { value: '456 High St, Melbourne VIC 3000' } });

        // Click manual entry button to reveal fields if not already visible
        const toggleButton = screen.getByRole('button', { name: /Enter Manually|Hide Manual Entry/ });
        if (toggleButton.textContent === 'Enter Manually') {
            fireEvent.click(toggleButton);
        }

        // Check if fields are populated (ensure manual fields are visible)
        expect(screen.getByLabelText('Street').value).toBe('456 High St');
        expect(screen.getByLabelText('Suburb').value).toBe('Melbourne');
        expect(screen.getByLabelText('State').value).toBe('VIC');
        expect(screen.getByLabelText('Postcode').value).toBe('3000');
    });
});

test('renders ClientDetailsForm component and updates details', () => {
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <ClientDetailsForm onChange={handleChange} />
  );

  // Click manual entry button to reveal fields if not already visible
  const toggleButton = screen.getByRole('button', { name: /Enter Manually|Hide Manual Entry/ });
  if (toggleButton.textContent === 'Enter Manually') {
    fireEvent.click(toggleButton);
  }

  fireEvent.change(getByLabelText('Client Name'), { target: { value: 'New Client' } });
  fireEvent.change(getByLabelText('Street'), { target: { value: '456 Avenue' } });
  fireEvent.change(getByLabelText('Suburb'), { target: { value: 'Suburbia' } });
  fireEvent.change(getByLabelText('State'), { target: { value: 'State' } });
  fireEvent.change(getByLabelText('Postcode'), { target: { value: '5678' } });
  fireEvent.change(getByLabelText('ABN'), { target: { value: '987654321' } });
  fireEvent.change(getByLabelText('ACN'), { target: { value: '123456789' } });

  expect(handleChange).toHaveBeenCalled();
});