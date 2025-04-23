import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

const AddressAutocomplete = ({ onPlaceSelected, placeholder, id, className }) => {
    const [autocomplete, setAutocomplete] = useState(null);
    const inputRef = useRef(null);

    const onLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            onPlaceSelected(place);
        } else {
            console.log('Autocomplete is not loaded yet!');
        }
    };

    return (
        <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                componentRestrictions: { country: 'au' },
                fields: ['address_components', 'geometry'],
            }}
        >
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                id={id}
                className={className}
            />
        </Autocomplete>
    );
};

export default AddressAutocomplete;
