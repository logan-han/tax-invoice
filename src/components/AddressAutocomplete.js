import React, { useEffect, useRef } from 'react';

const AddressAutocomplete = ({ onPlaceSelected, placeholder, id, className }) => {
    const containerRef = useRef(null);
    const autocompleteRef = useRef(null);
    const callbackRef = useRef(onPlaceSelected);

    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = onPlaceSelected;
    }, [onPlaceSelected]);

    useEffect(() => {
        if (!containerRef.current || autocompleteRef.current) return;

        const initAutocomplete = () => {
            if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
                setTimeout(initAutocomplete, 100);
                return;
            }

            const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
                includedRegionCodes: ['au'],
            });

            placeAutocomplete.id = id;
            if (placeholder) {
                placeAutocomplete.setAttribute('placeholder', placeholder);
            }

            // Handler for processing place data
            const handlePlaceSelection = async (place) => {
                try {
                    await place.fetchFields({ fields: ['addressComponents', 'location'] });

                    // Convert new API format to legacy format for backward compatibility
                    const addressComponents = place.addressComponents?.map(component => ({
                        long_name: component.longText || '',
                        short_name: component.shortText || '',
                        types: component.types || []
                    })) || [];

                    const legacyPlace = {
                        address_components: addressComponents,
                        geometry: place.location ? {
                            location: place.location
                        } : undefined
                    };

                    // Use ref to always call the latest callback
                    callbackRef.current(legacyPlace);
                } catch (error) {
                    console.error('Error fetching place details:', error);
                }
            };

            // Listen for gmp-placeselect (stable API)
            placeAutocomplete.addEventListener('gmp-placeselect', async (event) => {
                const place = event.place;
                if (place) {
                    await handlePlaceSelection(place);
                }
            });

            // Also listen for gmp-select (newer alpha API) for forward compatibility
            placeAutocomplete.addEventListener('gmp-select', async (event) => {
                const placePrediction = event.placePrediction;
                if (placePrediction && typeof placePrediction.toPlace === 'function') {
                    const place = placePrediction.toPlace();
                    await handlePlaceSelection(place);
                }
            });

            // Clear the container and append the new element
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(placeAutocomplete);
            autocompleteRef.current = placeAutocomplete;

            // Apply styles to match the existing form control appearance
            // Force light mode to prevent system dark mode from affecting the component
            const style = document.createElement('style');
            style.textContent = `
                gmp-place-autocomplete {
                    display: block !important;
                    width: 100% !important;
                    border: 1px solid #ced4da !important;
                    border-radius: 4px !important;
                    outline: none !important;
                    background: #f8f9fa !important;
                    background-color: #f8f9fa !important;
                    color-scheme: light only !important;
                    --gmp-mat-background: #f8f9fa !important;
                    --gmp-mat-color: #212529 !important;
                }
                gmp-place-autocomplete:focus-within {
                    border-color: #86b7fe !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
                }
                gmp-place-autocomplete * {
                    background: transparent !important;
                    background-color: transparent !important;
                    color-scheme: light only !important;
                }
                gmp-place-autocomplete::part(input),
                gmp-place-autocomplete::part(text-input) {
                    display: block !important;
                    width: 100% !important;
                    padding: 0.375rem 0.75rem !important;
                    font-size: 1rem !important;
                    font-weight: 400 !important;
                    line-height: 1.5 !important;
                    color: #212529 !important;
                    background-color: transparent !important;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                }
                gmp-place-autocomplete::part(input):focus,
                gmp-place-autocomplete::part(text-input):focus {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                gmp-place-autocomplete::part(container),
                gmp-place-autocomplete::part(search-icon) {
                    background: transparent !important;
                    background-color: transparent !important;
                }
                /* Force light mode on dropdown overlay */
                gmp-internal-place-autocomplete-overlay,
                .gmp-place-autocomplete-overlay,
                [class*="gmp-place-autocomplete"] {
                    color-scheme: light only !important;
                    background-color: #ffffff !important;
                }
                gmp-internal-place-autocomplete-overlay *,
                .gmp-place-autocomplete-overlay * {
                    color-scheme: light only !important;
                }
            `;
            if (!document.querySelector('style[data-gmp-autocomplete]')) {
                style.setAttribute('data-gmp-autocomplete', 'true');
                document.head.appendChild(style);
            }
        };

        initAutocomplete();

        return () => {
            if (autocompleteRef.current && containerRef.current) {
                containerRef.current.innerHTML = '';
                autocompleteRef.current = null;
            }
        };
    }, [id, placeholder]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ padding: 0, border: 'none' }}
        />
    );
};

export default AddressAutocomplete;
