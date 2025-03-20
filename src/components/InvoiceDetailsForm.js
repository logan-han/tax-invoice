import React, { useState, useEffect } from 'react';

const InvoiceDetailsForm = ({ onChange }) => {
    const [invoiceDate, setInvoiceDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('');

    useEffect(() => {
        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        setInvoiceDate(dateString);
        setInvoiceNumber(`${dateString.replace(/-/g, '')}-0001`);
        
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateString = dueDate.toISOString().split('T')[0];
        setDueDate(dueDateString);
    }, []);

    useEffect(() => {
        onChange({ invoiceDate, invoiceNumber, dueDate, currency });
    }, [invoiceDate, invoiceNumber, dueDate, currency]);

    const handleDateChange = (e) => {
        setInvoiceDate(e.target.value);
    };

    const handleNumberChange = (e) => {
        setInvoiceNumber(e.target.value);
    };

    const handleDueDateChange = (e) => {
        setDueDate(e.target.value);
    };

    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
    };

    return (
        <div className="form-container w-100">
            <h2>Invoice Details</h2>
            <form style={{ maxWidth: '80%', width: '80%' }}>
                <div className="row">
                    <div className="group col-md-3">
                        <label htmlFor="invoiceDate">Invoice Date</label>
                        <input id="invoiceDate" type="date" value={invoiceDate} onChange={handleDateChange} className="form-control form-control-lg" />
                    </div>
                    <div className="group col-md-3">
                        <label htmlFor="dueDate">Due Date</label>
                        <input id="dueDate" type="date" value={dueDate} onChange={handleDueDateChange} className="form-control form-control-lg" />
                    </div>
                    <div className="group col-md-3">
                        <label htmlFor="invoiceNumber">Invoice Number</label>
                        <input id="invoiceNumber" type="text" value={invoiceNumber} onChange={handleNumberChange} className="form-control" />
                    </div>
                    <div className="group col-md-2">
                        <label htmlFor="currency">Currency</label>
                        <select id="currency" value={currency} onChange={handleCurrencyChange} className="form-control form-control-lg">
                            <option value="">N/A</option>
                            <option value="AUD">AUD</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                            <option value="CAD">CAD</option>
                            <option value="NZD">NZD</option>
                            <option value="CNY">CNY</option>
                            <option value="INR">INR</option>
                            <option value="SGD">SGD</option>
                        </select>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceDetailsForm;
