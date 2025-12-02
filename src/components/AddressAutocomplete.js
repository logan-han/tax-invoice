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
            const style = document.createElement('style');
            style.textContent = `
                gmp-place-autocomplete {
                    display: block !important;
                    width: 100% !important;
                }
                gmp-place-autocomplete::part(input) {
                    display: block !important;
                    width: 100% !important;
                    padding: 0.375rem 0.75rem !important;
                    font-size: 1rem !important;
                    font-weight: 400 !important;
                    line-height: 1.5 !important;
                    color: #212529 !important;
                    background-color: #fff !important;
                    background: #fff !important;
                    background-clip: padding-box !important;
                    border: 1px solid #ced4da !important;
                    border-radius: 0.25rem !important;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
                }
                gmp-place-autocomplete::part(input):focus {
                    color: #212529 !important;
                    background-color: #fff !important;
                    background: #fff !important;
                    border-color: #86b7fe !important;
                    outline: 0 !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
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
