import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientDetailsForm from '../ClientDetailsForm';

jest.mock('../../styles.css', () => ({}));

jest.mock('../AddressAutocomplete', () => ({ onPlaceSelected, id }) => (
    <input
        data-testid="autocomplete"
        id={id}
        onChange={() => onPlaceSelected({
            address_components: [
                { long_name: '123', types: ['street_number'] },
                { long_name: 'Main St', types: ['route'] },
                { long_name: 'Sydney', types: ['locality'] },
                { short_name: 'NSW', types: ['administrative_area_level_1'] },
                { long_name: '2000', types: ['postal_code'] }
            ]
        })}
    />
));

beforeAll(() => {
    global.google = {
        maps: {
            places: {
                Autocomplete: jest.fn().mockImplementation(() => {
                    return {
                        addListener: jest.fn((event, callback) => {
                            if (event === 'place_changed') {
                                callback();
                            }
                        }),
                        getPlace: jest.fn(() => ({
                            address_components: [
                                { long_name: '123', types: ['street_number'] },
                                { long_name: 'Main St', types: ['route'] },
                                { long_name: 'Sydney', types: ['locality'] },
                                { short_name: 'NSW', types: ['administrative_area_level_1'] },
                                { long_name: '2000', types: ['postal_code'] }
                            ]
                        }))
                    };
                })
            }
        }
    };
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
        const autocompleteInput = screen.getByTestId('autocomplete');
        fireEvent.change(autocompleteInput, { target: { value: '123 Main St' } });
        fireEvent.blur(autocompleteInput);

        fireEvent.click(screen.getByText('Enter Manually'));

        expect(screen.getByLabelText('Street').value).toBe('123 Main St');
        expect(screen.getByLabelText('Suburb').value).toBe('Sydney');
        expect(screen.getByLabelText('State').value).toBe('NSW');
        expect(screen.getByLabelText('Postcode').value).toBe('2000');
    });
});

test('renders ClientDetailsForm component and updates details', () => {
  const handleChange = jest.fn();

  const { getByLabelText } = render(
    <ClientDetailsForm onChange={handleChange} />
  );

  fireEvent.click(screen.getByText('Enter Manually'));

  fireEvent.change(getByLabelText('Client Name'), { target: { value: 'New Client' } });
  fireEvent.change(getByLabelText('Street'), { target: { value: '456 Avenue' } });
  fireEvent.change(getByLabelText('Suburb'), { target: { value: 'Suburbia' } });
  fireEvent.change(getByLabelText('State'), { target: { value: 'State' } });
  fireEvent.change(getByLabelText('Postcode'), { target: { value: '5678' } });
  fireEvent.change(getByLabelText('ABN'), { target: { value: '987654321' } });
  fireEvent.change(getByLabelText('ACN'), { target: { value: '123456789' } });

  expect(handleChange).toHaveBeenCalled();
});
