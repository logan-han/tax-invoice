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
    const [invoiceDetails, setInvoiceDetails] = useState({ invoiceDate: '', invoiceNumber: '', dueDate: '', currency: '' });

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
        <div className="App container my-4">
            <header className="mb-5 text-center">
                <h1 className="display-4 text-primary font-weight-bold">
                    <i className="fas fa-file-invoice-dollar mr-2"></i>
                    Australian Tax Invoice Generator
                </h1>
                <p className="lead text-muted">Create professional tax invoices in minutes</p>
            </header>
            
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <BusinessDetailsForm onChange={handleBusinessDetailsChange} />
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <ClientDetailsForm onChange={handleClientDetailsChange} />
                        </div>
                        <div className="card-body">
                            <InvoiceDetailsForm onChange={handleInvoiceDetailsChange} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <ItemForm 
                                items={items} 
                                onChange={handleItemsChange} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card shadow">
                        <div className="card-body">
                            <InvoicePDF
                                businessDetails={businessDetails}
                                clientDetails={clientDetails}
                                items={items}
                                invoiceDate={invoiceDetails.invoiceDate}
                                invoiceNumber={invoiceDetails.invoiceNumber}
                                dueDate={invoiceDetails.dueDate}
                                bsb={businessDetails.bsb}
                                accountNumber={businessDetails.accountNumber}
                                currency={invoiceDetails.currency}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default App;