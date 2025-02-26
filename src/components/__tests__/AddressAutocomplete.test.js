import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressAutocomplete from '../AddressAutocomplete';

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

describe('AddressAutocomplete', () => {
    it('renders the input field', () => {
        render(<AddressAutocomplete onPlaceSelected={jest.fn()} placeholder="Enter your address" />);
        const input = screen.getByPlaceholderText('Enter your address');
        expect(input).toBeInTheDocument();
    });

    it('calls onPlaceSelected with the correct address components', () => {
        const handlePlaceSelected = jest.fn();
        render(<AddressAutocomplete onPlaceSelected={handlePlaceSelected} placeholder="Enter your address" />);
        const input = screen.getByPlaceholderText('Enter your address');
        fireEvent.change(input, { target: { value: '123 Main St' } });
        fireEvent.blur(input);

        expect(handlePlaceSelected).toHaveBeenCalledWith(expect.objectContaining({
            address_components: expect.arrayContaining([
                expect.objectContaining({ long_name: '123', types: ['street_number'] }),
                expect.objectContaining({ long_name: 'Main St', types: ['route'] }),
                expect.objectContaining({ long_name: 'Sydney', types: ['locality'] }),
                expect.objectContaining({ short_name: 'NSW', types: ['administrative_area_level_1'] }),
                expect.objectContaining({ long_name: '2000', types: ['postal_code'] })
            ])
        }));
    });
});
