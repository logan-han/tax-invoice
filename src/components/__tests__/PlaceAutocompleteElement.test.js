import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaceAutocompleteElement from '../PlaceAutocompleteElement';

// Mock the Google Maps API
const mockGetPlace = jest.fn(() => ({
    address_components: [
        { long_name: '123', types: ['street_number'] },
        { long_name: 'Main St', types: ['route'] },
        { long_name: 'Sydney', types: ['locality'] },
        { short_name: 'NSW', types: ['administrative_area_level_1'] },
        { long_name: '2000', types: ['postal_code'] }
    ]
}));

// Mock the PlaceAutocompleteElement class
const mockPlaceAutocompleteElement = jest.fn(() => ({
    getPlace: mockGetPlace,
    addListener: jest.fn((event, callback) => {
        if (event === 'place_changed') {
            // Store the callback to trigger it later
            mockPlaceAutocompleteElement.placeChangedCallback = callback;
        }
    })
}));

// Mock the Google Maps API
global.window.google = {
    maps: {
        places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteElement
        },
        event: {
            clearInstanceListeners: jest.fn()
        }
    }
};

// Mock the initAutocomplete callback
global.window.initAutocomplete = jest.fn();

describe('PlaceAutocompleteElement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the input field', () => {
        render(<PlaceAutocompleteElement onPlaceSelected={jest.fn()} placeholder="Enter your address" id="test-id" />);
        const input = screen.getByPlaceholderText('Enter your address');
        expect(input).toBeInTheDocument();
        expect(input.id).toBe('test-id');
    });

    it('calls onPlaceSelected with the correct address components when place changes', () => {
        const handlePlaceSelected = jest.fn();
        render(<PlaceAutocompleteElement onPlaceSelected={handlePlaceSelected} placeholder="Enter your address" />);
        
        // Simulate the place_changed event
        if (mockPlaceAutocompleteElement.placeChangedCallback) {
            mockPlaceAutocompleteElement.placeChangedCallback();
        }

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