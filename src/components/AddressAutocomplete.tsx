import { useEffect, useRef, memo } from 'react';
import type { PlaceResult } from '../types';

interface AddressAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  id: string;
  className?: string;
}

const AddressAutocomplete = memo(function AddressAutocomplete({
  onPlaceSelected,
  placeholder,
  id,
  className,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const callbackRef = useRef(onPlaceSelected);

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

      const handlePlaceSelection = async (place: google.maps.places.Place) => {
        try {
          await place.fetchFields({ fields: ['addressComponents', 'location'] });

          const addressComponents =
            place.addressComponents?.map((component) => ({
              long_name: component.longText || '',
              short_name: component.shortText || '',
              types: component.types || [],
            })) || [];

          const legacyPlace: PlaceResult = {
            address_components: addressComponents,
            geometry: place.location
              ? {
                  location: place.location,
                }
              : undefined,
          };

          callbackRef.current(legacyPlace);
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
      };

      placeAutocomplete.addEventListener('gmp-placeselect', async (event) => {
        const place = event.place as
          | google.maps.places.Place
          | undefined;
        if (place) {
          await handlePlaceSelection(place);
        }
      });

      placeAutocomplete.addEventListener('gmp-select', async (event) => {
        const placePrediction = event.placePrediction as
          | google.maps.places.PlacePrediction
          | undefined;
        if (placePrediction && typeof placePrediction.toPlace === 'function') {
          const place = placePrediction.toPlace();
          await handlePlaceSelection(place);
        }
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(placeAutocomplete);
      }
      autocompleteRef.current = placeAutocomplete;

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

    const container = containerRef.current;
    return () => {
      if (autocompleteRef.current && container) {
        container.innerHTML = '';
        autocompleteRef.current = null;
      }
    };
  }, [id, placeholder]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ padding: 0, border: 'none' }}
      aria-label={placeholder || 'Address autocomplete'}
    />
  );
});

export default AddressAutocomplete;
