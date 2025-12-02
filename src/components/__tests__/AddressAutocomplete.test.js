import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import AddressAutocomplete from '../AddressAutocomplete';

// Mock PlaceAutocompleteElement
const mockAddressComponents = [
    { longText: '123', shortText: '123', types: ['street_number'] },
    { longText: 'Main St', shortText: 'Main St', types: ['route'] },
    { longText: 'Sydney', shortText: 'Sydney', types: ['locality'] },
    { longText: 'New South Wales', shortText: 'NSW', types: ['administrative_area_level_1'] },
    { longText: '2000', shortText: '2000', types: ['postal_code'] }
];

let placeSelectCallback = null;

// Create a factory function that returns a real DOM element with added methods
const createMockPlaceAutocompleteElement = () => {
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'mock-place-autocomplete');

    const originalAddEventListener = element.addEventListener.bind(element);
    element.addEventListener = (event, callback) => {
        originalAddEventListener(event, callback);
        if (event === 'gmp-placeselect') {
            placeSelectCallback = callback;
        }
    };

    return element;
};

// Mock global google object
beforeEach(() => {
    placeSelectCallback = null;
    window.google = {
        maps: {
            places: {
                PlaceAutocompleteElement: jest.fn().mockImplementation(() => {
                    return createMockPlaceAutocompleteElement();
                })
            }
        }
    };
});

afterEach(() => {
    delete window.google;
});

describe('AddressAutocomplete', () => {
    it('renders the container element', async () => {
        const { container } = render(
            <AddressAutocomplete
                onPlaceSelected={jest.fn()}
                placeholder="Enter your address"
                id="test-autocomplete"
                className="form-control"
            />
        );

        await waitFor(() => {
            const autocompleteContainer = container.querySelector('.form-control');
            expect(autocompleteContainer).toBeInTheDocument();
        });
    });

    it('calls onPlaceSelected with the correct address components', async () => {
        const handlePlaceSelected = jest.fn();

        render(
            <AddressAutocomplete
                onPlaceSelected={handlePlaceSelected}
                placeholder="Enter your address"
                id="test-autocomplete"
            />
        );

        // Wait for the PlaceAutocompleteElement to be initialized
        await waitFor(() => {
            expect(placeSelectCallback).not.toBeNull();
        });

        // Simulate place selection
        const mockPlace = {
            addressComponents: mockAddressComponents,
            location: { lat: () => -33.8688, lng: () => 151.2093 },
            fetchFields: jest.fn().mockResolvedValue(undefined)
        };

        await act(async () => {
            await placeSelectCallback({ place: mockPlace });
        });

        expect(mockPlace.fetchFields).toHaveBeenCalledWith({
            fields: ['addressComponents', 'location']
        });

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
