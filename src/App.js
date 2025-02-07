import React, { useState, useEffect } from 'react';
import BusinessDetailsForm from './components/BusinessDetailsForm';
import ClientDetailsForm from './components/ClientDetailsForm';
import ItemForm from './components/ItemForm';
import InvoicePDF from './components/InvoicePDF';
import InvoiceDetailsForm from './components/InvoiceDetailsForm';

function App() {
    const [businessDetails, setBusinessDetails] = useState({});
    const [clientDetails, setClientDetails] = useState({});
    const [items, setItems] = useState([]);
    const [invoiceDetails, setInvoiceDetails] = useState({ invoiceDate: '', invoiceNumber: '', dueDate: '' });

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const business = JSON.parse(queryParams.get('business') || '{}');
        const client = JSON.parse(queryParams.get('client') || '{}');
        const items = JSON.parse(queryParams.get('items') || '[]');
        setBusinessDetails(business);
        setClientDetails(client);
        setItems(items);
    }, []);

    const handleBusinessDetailsChange = (details) => {
        setBusinessDetails(details);
        updateUrl(details, clientDetails, items, invoiceDetails);
    };

    const handleClientDetailsChange = (details) => {
        setClientDetails(details);
        updateUrl(businessDetails, details, items, invoiceDetails);
    };

    const handleItemsChange = (newItems) => {
        setItems(newItems);
        updateUrl(businessDetails, clientDetails, newItems, invoiceDetails);
    };

    const handleInvoiceDetailsChange = (details) => {
        setInvoiceDetails(details);
        updateUrl(businessDetails, clientDetails, items, details);
    };

    const updateUrl = (business, client, items, invoice) => {
        const url = new URL(window.location);
        url.searchParams.set('business', JSON.stringify(business));
        url.searchParams.set('client', JSON.stringify(client));
        url.searchParams.set('items', JSON.stringify(items));
        url.searchParams.set('invoice', JSON.stringify(invoice));
        window.history.replaceState({}, '', url);
    };

    return (
        <div className="App">
            <h1>Australian Tax Invoice Generator</h1>
            <BusinessDetailsForm onChange={handleBusinessDetailsChange} />
            <ClientDetailsForm onChange={handleClientDetailsChange} />
            <InvoiceDetailsForm onChange={handleInvoiceDetailsChange} />
            <ItemForm items={items} onChange={handleItemsChange} />
            <div style={{ marginBottom: '20px' }}></div>
            <InvoicePDF
                businessDetails={businessDetails}
                clientDetails={clientDetails}
                items={items}
                invoiceDate={invoiceDetails.invoiceDate}
                invoiceNumber={invoiceDetails.invoiceNumber}
                dueDate={invoiceDetails.dueDate}
                bsb={businessDetails.bsb}
                accountNumber={businessDetails.accountNumber}
            />
        </div>
    );
}

export default App;