import React, { useEffect, useRef } from 'react';

const AddressAutocomplete = ({ onPlaceSelected, placeholder, id }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'au' },
            fields: ['address_components', 'geometry'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            onPlaceSelected(place);
        });
    }, [onPlaceSelected]);

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            id={id}
        />
    );
};

export default AddressAutocomplete;
