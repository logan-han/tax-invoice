import React, { useState, useEffect } from 'react';
import '../styles.scss';
import { formatABN, formatACN } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import PlaceAutocompleteElement from './PlaceAutocompleteElement';

const ClientDetailsForm = ({ onChange }) => {
    const [clientDetails, setClientDetails] = useState({
        name: '',
        street: '',
        suburb: '',
        state: '',
        postcode: '',
        abn: '',
        acn: ''
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
            acn: queryParams.get('clientAcn') || ''
        };
        setClientDetails(details);
    }, []);

    const handlePlaceSelected = (place) => {
        if (!place || !place.address_components) {
            console.error("Place or address components not found:", place);
            return; // Exit if place or address_components are undefined
        }
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
        window.history.replaceState({}, '', url);
    };

    return (
        <div className="form-container">
            <h2>Client Details</h2>
            <form>
                <div className="group">
                    <label htmlFor="clientName">Client Name</label>
                    <input id="clientName" type="text" name="name" value={clientDetails.name} onChange={handleChange} className="form-control" />
                </div>
                <div className="group">
                    <label htmlFor="clientFullAddress">Address</label> {/* Changed id to avoid conflict */}
                    <PlaceAutocompleteElement
                        id="clientFullAddress" // Changed id to avoid conflict
                        onPlaceSelected={handlePlaceSelected}
                        placeholder="Enter the client address"
                        className="form-control" // Add className here
                    />
                </div>
                <button type="button" onClick={() => setShowManualFields(!showManualFields)} className="btn btn-primary mb-3">
                    {showManualFields ? 'Hide Manual Entry' : 'Enter Manually'}
                </button>
                {showManualFields && (
                    <>
                        <div className="group">
                            <label htmlFor="street">Street</label>
                            <input id="street" type="text" name="street" value={clientDetails.street} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="row mb-3">
                            <div className="group col-md-6">
                                <label htmlFor="suburb">Suburb</label>
                                <input id="suburb" type="text" name="suburb" value={clientDetails.suburb} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="group col-md-3">
                                <label htmlFor="state">State</label>
                                <select id="state" name="state" value={clientDetails.state} onChange={handleChange} className="form-control form-control-lg text-center">
                                    <option value=""></option>
                                    {AUSTRALIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="group col-md-3">
                                <label htmlFor="postcode">Postcode</label>
                                <input id="postcode" type="text" name="postcode" value={clientDetails.postcode} onChange={handleChange} className="form-control" />
                            </div>
                        </div>
                    </>
                )}
                <div className="row mb-3">
                    <div className="group col-md-6">
                        <label htmlFor="abn">ABN</label>
                        <input id="abn" type="text" name="abn" value={clientDetails.abn} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="group col-md-6">
                        <label htmlFor="acn">ACN</label>
                        <input id="acn" type="text" name="acn" value={clientDetails.acn} onChange={handleChange} className="form-control" />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ClientDetailsForm;