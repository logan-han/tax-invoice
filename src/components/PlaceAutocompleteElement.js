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