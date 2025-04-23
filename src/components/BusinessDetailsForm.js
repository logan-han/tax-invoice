import React, { useState, useEffect } from 'react';
import '../styles.scss';
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
                <div className="group">
                    <label htmlFor="businessName">Business Name</label>
                    <input id="businessName" type="text" name="name" value={businessDetails.name} onChange={handleChange} className="form-control" />
                </div>
                <div className="group">
                    <label htmlFor="fullAddress">Address</label>
                    <AddressAutocomplete
                        id="fullAddress"
                        onPlaceSelected={handlePlaceSelected}
                        placeholder="Enter your business address"
                        className="form-control"
                    />
                </div>
                <button type="button" onClick={() => setShowManualFields(!showManualFields)} className="btn btn-primary mb-3">
                    {showManualFields ? 'Hide Manual Entry' : 'Enter Manually'}
                </button>
                {showManualFields && (
                    <>
                        <div className="group">
                            <label htmlFor="street">Street</label>
                            <input id="street" type="text" name="street" value={businessDetails.street} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="row mb-3">
                            <div className="group col-md-6">
                                <label htmlFor="suburb">Suburb</label>
                                <input id="suburb" type="text" name="suburb" value={businessDetails.suburb} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="group col-md-3">
                                <label htmlFor="state">State</label>
                                <select id="state" name="state" value={businessDetails.state} onChange={handleChange} className="form-control form-control-lg text-center">
                                    <option value=""></option>
                                    {AUSTRALIAN_STATES.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="group col-md-3">
                                <label htmlFor="postcode">Postcode</label>
                                <input id="postcode" type="text" name="postcode" value={businessDetails.postcode} onChange={handleChange} className="form-control" />
                            </div>
                        </div>
                    </>
                )}
                <div className="row mb-3">
                    <div className="group col-md-6">
                        <label htmlFor="phone">Phone</label>
                        <input id="phone" type="text" name="phone" value={businessDetails.phone} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="group col-md-6">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="text" name="email" value={businessDetails.email} onChange={handleChange} className="form-control" />
                    </div>
                </div>
                <div className="row mb-3">
                    <div className="group col-md-6">
                        <label htmlFor="abn">ABN</label>
                        <input id="abn" type="text" name="abn" value={businessDetails.abn} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="group col-md-6">
                        <label htmlFor="acn">ACN</label>
                        <input id="acn" type="text" name="acn" value={businessDetails.acn} onChange={handleChange} className="form-control" />
                    </div>
                </div>
                <div className="row mb-3 ">
                    <div className="group col-md-5">
                        <label htmlFor="accountName">Account Name</label>
                        <input id="accountName" type="text" name="accountName" value={businessDetails.accountName} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="group col-md-3">
                        <label htmlFor="bsb">BSB</label>
                        <input id="bsb" type="text" name="bsb" value={businessDetails.bsb} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="group col-md-4">
                        <label htmlFor="accountNumber">Account Number</label>
                        <input id="accountNumber" type="text" name="accountNumber" value={businessDetails.accountNumber} onChange={handleChange} className="form-control" />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BusinessDetailsForm;