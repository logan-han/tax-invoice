import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressAutocomplete from '../AddressAutocomplete';

// Mock the @react-google-maps/api components
const mockGetPlace = jest.fn(() => ({
    address_components: [
        { long_name: '123', types: ['street_number'] },
        { long_name: 'Main St', types: ['route'] },
        { long_name: 'Sydney', types: ['locality'] },
        { short_name: 'NSW', types: ['administrative_area_level_1'] },
        { long_name: '2000', types: ['postal_code'] }
    ]
}));
const mockAutocomplete = jest.fn(() => ({
    getPlace: mockGetPlace
}));

jest.mock('@react-google-maps/api', () => {
    const React = require('react');
    const MockAutocompleteComponent = ({ onLoad, onPlaceChanged, children }) => {
        React.useLayoutEffect(() => {
            const instance = mockAutocomplete();
            if (onLoad) {
                onLoad(instance);
            }
        }, []);

        return React.cloneElement(children, {
            'data-testid': 'autocomplete-input',
            onChange: (e) => {
                if (e.target.value === 'trigger place changed') {
                    if (onPlaceChanged) onPlaceChanged();
                }
                if (children.props.onChange) children.props.onChange(e);
            }
        });
    };

    return {
        Autocomplete: MockAutocompleteComponent,
        LoadScript: ({ children }) => React.createElement('div', null, children)
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
        const input = screen.getByTestId('autocomplete-input');

        fireEvent.change(input, { target: { value: 'trigger place changed' } });

        expect(mockGetPlace).toHaveBeenCalled();
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
