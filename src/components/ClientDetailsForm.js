import React, { useState, useEffect } from 'react';
import '../styles.css';
import { formatABN, formatACN } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';

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
                <div>
                    <label htmlFor="clientName">Client Name:</label>
                    <input id="clientName" type="text" name="name" value={clientDetails.name} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="street">Street:</label>
                    <input id="street" type="text" name="street" value={clientDetails.street} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="suburb">Suburb:</label>
                    <input id="suburb" type="text" name="suburb" value={clientDetails.suburb} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="state">State:</label>
                    <select id="state" name="state" value={clientDetails.state} onChange={handleChange} className="dropdown">
                        <option value="">Select State</option>
                        {AUSTRALIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="postcode">Postcode:</label>
                    <input id="postcode" type="text" name="postcode" value={clientDetails.postcode} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="abn">ABN:</label>
                    <input id="abn" type="text" name="abn" value={clientDetails.abn} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="acn">ACN:</label>
                    <input id="acn" type="text" name="acn" value={clientDetails.acn} onChange={handleChange} />
                </div>
            </form>
        </div>
    );
};

export default ClientDetailsForm;