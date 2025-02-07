import React, { useState, useEffect } from 'react';
import '../styles.css';
import { formatABN, formatACN, formatBSB } from '../utils/formatters'; // Import the common functions
import { AUSTRALIAN_STATES } from '../utils/constants'; // Import the common constants

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'abn') {
            formattedValue = formatABN(value).slice(0, 14); // ABN max length with spaces
        } else if (name === 'acn') {
            formattedValue = formatACN(value).slice(0, 11); // ACN max length with spaces
        } else if (name === 'bsb') {
            formattedValue = formatBSB(value).slice(0, 7); // BSB max length with dash
        } else if (name === 'postcode') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4); // Postcode max length
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
                    <label htmlFor="businessName">Business Name:</label>
                    <input id="businessName" type="text" name="name" value={businessDetails.name} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="street">Street:</label>
                    <input id="street" type="text" name="street" value={businessDetails.street} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="suburb">Suburb:</label>
                    <input id="suburb" type="text" name="suburb" value={businessDetails.suburb} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="state">State:</label>
                    <select id="state" name="state" value={businessDetails.state} onChange={handleChange} className="dropdown">
                        <option value="">Select State</option>
                        {AUSTRALIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="postcode">Postcode:</label>
                    <input id="postcode" type="text" name="postcode" value={businessDetails.postcode} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="phone">Phone:</label>
                    <input id="phone" type="text" name="phone" value={businessDetails.phone} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input id="email" type="text" name="email" value={businessDetails.email} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="abn">ABN:</label>
                    <input id="abn" type="text" name="abn" value={businessDetails.abn} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="acn">ACN:</label>
                    <input id="acn" type="text" name="acn" value={businessDetails.acn} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="accountName">Account Name:</label>
                    <input id="accountName" type="text" name="accountName" value={businessDetails.accountName} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="bsb">BSB:</label>
                    <input id="bsb" type="text" name="bsb" value={businessDetails.bsb} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="accountNumber">Account Number:</label>
                    <input id="accountNumber" type="text" name="accountNumber" value={businessDetails.accountNumber} onChange={handleChange} />
                </div>
            </form>
        </div>
    );
};

export default BusinessDetailsForm;