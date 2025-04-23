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

jest.mock('@react-google-maps/api', () => ({
    Autocomplete: ({ onLoad, onPlaceChanged, children }) => {
        // Simulate onLoad callback
        React.useEffect(() => {
            const instance = mockAutocomplete();
            if (onLoad) {
                onLoad(instance);
            }
        }, [onLoad]);

        // Simulate onPlaceChanged by adding a data-testid to trigger it
        return React.cloneElement(children, {
            'data-testid': 'autocomplete-input',
            onChange: (e) => {
                 // Allow parent components to trigger place change for testing
                 if (e.target.value === 'trigger place changed') {
                     if(onPlaceChanged) onPlaceChanged();
                 }
                 if(children.props.onChange) children.props.onChange(e);
            }
        });
    },
    LoadScript: ({ children }) => <div>{children}</div> // Mock LoadScript
}));

describe('AddressAutocomplete', () => {
    it('renders the input field', () => {
        render(<AddressAutocomplete onPlaceSelected={jest.fn()} placeholder="Enter your address" />);
        const input = screen.getByPlaceholderText('Enter your address');
        expect(input).toBeInTheDocument();
    });

    it('calls onPlaceSelected with the correct address components', () => {
        const handlePlaceSelected = jest.fn();
        render(<AddressAutocomplete onPlaceSelected={handlePlaceSelected} placeholder="Enter your address" />);
        const input = screen.getByTestId('autocomplete-input'); // Use the test id added in the mock

        // Simulate place selection by changing input value to trigger mock's onPlaceChanged
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
