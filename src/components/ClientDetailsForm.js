import React, { useState, useEffect } from 'react';
import '../styles.css';
import { formatABN, formatACN, formatPhoneNumber } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';

const ClientDetailsForm = ({ onChange }) => {
    const [clientDetails, setClientDetails] = useState({
        name: '',
        street: '',
        suburb: '',
        state: '',
        postcode: '',
        abn: '',
        acn: '',
        phone: ''
    });

    const [showManualFields, setShowManualFields] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const details = {
            name: queryParams.get('clientName') || '',
            street: queryParams.get('clientStreet') || '',
            suburb: queryParams.get('clientSuburb') || '',
            state:  queryParams.get('clientState') || '',
            postcode: queryParams.get('clientPostcode') || '',
            abn: queryParams.get('clientAbn') || '',
            acn: queryParams.get('clientAcn') || '',
            phone: queryParams.get('clientPhone') || ''
        };
        setClientDetails(details);
    }, []);

    const handlePlaceSelected = (place) => {
        const addressComponents = place.address_components.reduce((acc, component) => {
            const types = component.types;
            if (types.includes('street_number')) {
                acc.street_number = component.long_name;
            } else if (types.includes('route')) {
                acc.route = component.long_name;
            } else if (types.includes('locality')) {
                acc.suburb = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                acc.state = component.short_name;
            } else if (types.includes('postal_code')) {
                acc.postcode = component.long_name;
            }
            return acc;
        }, {});

        setClientDetails((prevDetails) => ({
            ...prevDetails,
            street: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
            suburb: addressComponents.suburb || '',
            state: addressComponents.state || '',
            postcode: addressComponents.postcode || ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'abn') {
            formattedValue = formatABN(value).slice(0, 14);
        } else if (name === 'acn') {
            formattedValue = formatACN(value).slice(0, 11);
        } else if (name === 'postcode') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'phone') {
            formattedValue = formatPhoneNumber(value);
        }
        setClientDetails((prevDetails) => ({
            ...prevDetails,
            [name]: formattedValue
        }));
    };

    useEffect(() => {
        updateURL(clientDetails);
        onChange(clientDetails);
    }, [clientDetails]);

    const updateURL = (details) => {
        const url = new URL(window.location);
        url.searchParams.set('clientName', details.name);
        url.searchParams.set('clientStreet', details.street);
        url.searchParams.set('clientSuburb', details.suburb);
        url.searchParams.set('clientState', details.state);
        url.searchParams.set('clientPostcode', details.postcode);
        url.searchParams.set('clientAbn', details.abn);
        url.searchParams.set('clientAcn', details.acn);
        url.searchParams.set('clientPhone', details.phone);
        window.history.replaceState({}, '', url);
    };

    return (
        <div className="form-container">
            <h2>Client Details</h2>
            <form>
                <div>
                    <label htmlFor="clientName">Client Name</label>
                    <input id="clientName" type="text" name="name" value={clientDetails.name} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="fullAddress">Address</label>
                    <AddressAutocomplete id="fullAddress" onPlaceSelected={handlePlaceSelected} placeholder="Enter the client address" />
                </div>
                <button type="button" onClick={() => setShowManualFields(!showManualFields)} style={{ marginBottom: '10px' }}>
                    {showManualFields ? 'Hide Manual Entry' : 'Enter Manually'}
                </button>
                {showManualFields && (
                    <>
                        <div>
                            <label htmlFor="street">Street</label>
                            <input id="street" type="text" name="street" value={clientDetails.street} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ flex: 1, marginRight: '10px' }}>
                                <label htmlFor="suburb" align="center">Suburb</label>
                                <input id="suburb" type="text" name="suburb" value={clientDetails.suburb} onChange={handleChange} />
                            </div>
                            <div style={{ flex: 0.5, marginRight: '10px' }}>
                                <label htmlFor="state" align="center">State</label>
                                <select id="state" name="state" value={clientDetails.state} onChange={handleChange} className="dropdown">
                                    <option value="">Select State</option>
                                    {AUSTRALIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 0.5 }}>
                                <label htmlFor="postcode" align="center">Postcode</label>
                                <input id="postcode" type="text" name="postcode" value={clientDetails.postcode} onChange={handleChange} />
                            </div>
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor="abn" align="center">ABN</label>
                        <input id="abn" type="text" name="abn" value={clientDetails.abn} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="acn" align="center">ACN</label>
                        <input id="acn" type="text" name="acn" value={clientDetails.acn} onChange={handleChange} />
                    </div>
                </div>
                <div>
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" type="text" name="phone" value={clientDetails.phone} onChange={handleChange} />
                </div>
            </form>
        </div>
    );
};

export default ClientDetailsForm;