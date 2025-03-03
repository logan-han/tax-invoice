import React, { useState, useEffect } from 'react';
import '../styles.css';
import { formatABN, formatACN, formatBSB, formatPhoneNumber } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';

const BusinessDetailsForm = ({ onChange }) => {
    const [businessDetails, setBusinessDetails] = useState({
        name: '',
        street: '',
        suburb: '',
        state: '',
        postcode: '',
        phone: '',
        email: '',
        abn: '',
        acn: '',
        accountName: '',
        bsb: '',
        accountNumber: ''
    });

    const [showManualFields, setShowManualFields] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const details = {
            name: queryParams.get('businessName') || '',
            street: queryParams.get('businessStreet') || '',
            suburb: queryParams.get('businessSuburb') || '',
            state:  queryParams.get('businessState') || '',
            postcode: queryParams.get('businessPostcode') || '',
            phone: queryParams.get('businessPhone') || '',
            email: queryParams.get('businessEmail') || '',
            abn: queryParams.get('businessAbn') || '',
            acn: queryParams.get('businessAcn') || '',
            accountName: queryParams.get('businessAccountName') || '',
            bsb: queryParams.get('businessBsb') || '',
            accountNumber: queryParams.get('businessAccountNumber') || ''
        };
        setBusinessDetails(details);
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

        setBusinessDetails((prevDetails) => ({
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
        } else if (name === 'bsb') {
            formattedValue = formatBSB(value).slice(0, 7);
        } else if (name === 'postcode') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'phone') {
            formattedValue = formatPhoneNumber(value);
        }
        setBusinessDetails((prevDetails) => ({
            ...prevDetails,
            [name]: formattedValue
        }));
    };

    useEffect(() => {
        updateURL(businessDetails);
        onChange(businessDetails);
    }, [businessDetails]);

    const updateURL = (details) => {
        const url = new URL(window.location);
        url.searchParams.set('businessName', details.name);
        url.searchParams.set('businessStreet', details.street);
        url.searchParams.set('businessSuburb', details.suburb);
        url.searchParams.set('businessState', details.state);
        url.searchParams.set('businessPostcode', details.postcode);
        url.searchParams.set('businessPhone', details.phone);
        url.searchParams.set('businessEmail', details.email);
        url.searchParams.set('businessAbn', details.abn);
        url.searchParams.set('businessAcn', details.acn);
        url.searchParams.set('businessAccountName', details.accountName);
        url.searchParams.set('businessBsb', details.bsb);
        url.searchParams.set('businessAccountNumber', details.accountNumber);
        window.history.replaceState({}, '', url);
    };

    return (
        <div className="form-container">
            <h2>Business Details</h2>
            <form>
                <div>
                    <label htmlFor="businessName">Business Name</label>
                    <input id="businessName" type="text" name="name" value={businessDetails.name} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="fullAddress">Address</label>
                    <AddressAutocomplete id="fullAddress" onPlaceSelected={handlePlaceSelected} placeholder="Enter your business address" />
                </div>
                <button type="button" onClick={() => setShowManualFields(!showManualFields)} style={{ marginBottom: '10px' }}>
                    {showManualFields ? 'Hide Manual Entry' : 'Enter Manually'}
                </button>
                {showManualFields && (
                    <>
                        <div>
                            <label htmlFor="street">Street</label>
                            <input id="street" type="text" name="street" value={businessDetails.street} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ flex: 1, marginRight: '10px' }}>
                                <label htmlFor="suburb">Suburb</label>
                                <input id="suburb" type="text" name="suburb" value={businessDetails.suburb} onChange={handleChange} />
                            </div>
                            <div style={{ flex: 0.5, marginRight: '10px' }}>
                                <label htmlFor="state">State</label>
                                <select id="state" name="state" value={businessDetails.state} onChange={handleChange} className="dropdown">
                                    <option value="">Select State</option>
                                    {AUSTRALIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 0.5 }}>
                                <label htmlFor="postcode">Postcode</label>
                                <input id="postcode" type="text" name="postcode" value={businessDetails.postcode} onChange={handleChange} />
                            </div>
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                    <label htmlFor="phone" align="center">Phone</label>
                    <input id="phone" type="text" name="phone" value={businessDetails.phone} onChange={handleChange} />
                </div>
                <div style={{ flex: 1}}>
                    <label htmlFor="email" align="center">Email</label>
                    <input id="email" type="text" name="email" value={businessDetails.email} onChange={handleChange} />
                </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor="abn" align="center">ABN</label>
                        <input id="abn" type="text" name="abn" value={businessDetails.abn} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="acn" align="center">ACN</label>
                        <input id="acn" type="text" name="acn" value={businessDetails.acn} onChange={handleChange} />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 0.5, marginRight: '10px' }}>
                        <label htmlFor="accountName" align="center">Account Name</label>
                        <input id="accountName" type="text" name="accountName" value={businessDetails.accountName} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 0.2, marginRight: '10px' }}>
                        <label htmlFor="bsb" align="center">BSB</label>
                        <input id="bsb" type="text" name="bsb" value={businessDetails.bsb} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 0.3 }}>
                        <label htmlFor="accountNumber" align="center">Account Number</label>
                        <input id="accountNumber" type="text" name="accountNumber" value={businessDetails.accountNumber} onChange={handleChange} />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BusinessDetailsForm;