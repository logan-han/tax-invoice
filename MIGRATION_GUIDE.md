# Google Maps Places API Migration Guide

## Overview

This document provides guidance on migrating from `google.maps.places.Autocomplete` to `google.maps.places.PlaceAutocompleteElement` in this project.

As of March 1st, 2025, `google.maps.places.Autocomplete` will not be available to new customers. Google recommends using `google.maps.places.PlaceAutocompleteElement` instead. While the old API is not scheduled to be discontinued immediately, it will only receive bug fixes for major regressions, and existing bugs will not be addressed.

## Migration Steps

### 1. Created a New Component

We created a new `PlaceAutocompleteElement.js` component that directly uses the Google Maps JavaScript API's `PlaceAutocompleteElement` class instead of relying on the `@react-google-maps/api` package's `Autocomplete` component.

```jsx
import React, { useEffect, useRef } from 'react';

const PlaceAutocompleteElement = ({ onPlaceSelected, placeholder, id, className }) => {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const autocompleteElementRef = useRef(null);

    useEffect(() => {
        // Function to load the Google Maps JavaScript API
        const loadGoogleMapsAPI = () => {
            // Check if the API is already loaded
            if (window.google && window.google.maps && window.google.maps.places) {
                initializeAutocomplete();
                return;
            }

            // Create a script element to load the API
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete`;
            script.async = true;
            script.defer = true;
            
            // Define the callback function
            window.initAutocomplete = () => {
                initializeAutocomplete();
            };

            document.head.appendChild(script);
        };

        // Function to initialize the PlaceAutocompleteElement
        const initializeAutocomplete = () => {
            if (!containerRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
                return;
            }

            // Create a new PlaceAutocompleteElement
            autocompleteElementRef.current = new window.google.maps.places.PlaceAutocompleteElement({
                inputElement: inputRef.current,
                componentRestrictions: { country: 'au' },
                fields: ['address_components', 'geometry']
            });

            // Add event listener for place selection
            autocompleteElementRef.current.addListener('place_changed', () => {
                const place = autocompleteElementRef.current.getPlace();
                if (place) {
                    onPlaceSelected(place);
                } else {
                    console.log('PlaceAutocompleteElement is not loaded yet!');
                }
            });
        };

        loadGoogleMapsAPI();

        // Cleanup function
        return () => {
            if (autocompleteElementRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteElementRef.current);
            }
        };
    }, [onPlaceSelected]);

    return (
        <div ref={containerRef}>
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                id={id}
                className={className}
            />
        </div>
    );
};

export default PlaceAutocompleteElement;
```

### 2. Updated Component Imports

We updated the imports in `BusinessDetailsForm.js` and `ClientDetailsForm.js` to use the new component:

```jsx
// Old import
import AddressAutocomplete from './AddressAutocomplete';

// New import
import PlaceAutocompleteElement from './PlaceAutocompleteElement';
```

### 3. Updated Component Usage

We replaced the `AddressAutocomplete` component with the new `PlaceAutocompleteElement` component:

```jsx
// Old usage
<AddressAutocomplete
    id="fullAddress"
    onPlaceSelected={handlePlaceSelected}
    placeholder="Enter your business address"
    className="form-control"
/>

// New usage
<PlaceAutocompleteElement
    id="fullAddress"
    onPlaceSelected={handlePlaceSelected}
    placeholder="Enter your business address"
    className="form-control"
/>
```

### 4. Updated Tests

We updated the tests to mock the new component:

```jsx
// Old mock
jest.mock('../AddressAutocomplete', () => ({ onPlaceSelected, id, placeholder, className }) => {
    // Mock implementation
});

// New mock
jest.mock('../PlaceAutocompleteElement', () => ({ onPlaceSelected, id, placeholder, className }) => {
    // Mock implementation
});
```

We also created a new test file for the `PlaceAutocompleteElement` component.

## Key Differences Between the APIs

1. **Initialization**: 
   - `Autocomplete` is initialized with an input element as a child component
   - `PlaceAutocompleteElement` is initialized with an input element as a configuration option

2. **Event Handling**:
   - `Autocomplete` uses `onLoad` and `onPlaceChanged` props
   - `PlaceAutocompleteElement` uses the `addListener` method with the 'place_changed' event

3. **Options**:
   - Both APIs support similar options like `componentRestrictions` and `fields`
   - The way these options are passed differs slightly

## References

- [Google Maps Places Migration Overview](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
- [PlaceAutocompleteElement Documentation](https://developers.google.com/maps/documentation/javascript/reference/place-autocomplete-element)
- [Legacy Information](https://developers.google.com/maps/legacy)