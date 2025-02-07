import React, { useState, useEffect } from 'react';

const InvoiceDetailsForm = ({ onChange }) => {
    const [invoiceDate, setInvoiceDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        const date = new Date();
        const dateString = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        setInvoiceDate(dateString);
        setInvoiceNumber(`${dateString.replace(/-/g, '')}-0001`);
        
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateString = `${dueDate.getDate().toString().padStart(2, '0')}-${(dueDate.getMonth() + 1).toString().padStart(2, '0')}-${dueDate.getFullYear()}`;
        setDueDate(dueDateString);
    }, []);

    useEffect(() => {
        onChange({ invoiceDate, invoiceNumber, dueDate });
    }, [invoiceDate, invoiceNumber, dueDate]);

    const handleDateChange = (e) => {
        setInvoiceDate(e.target.value);
    };

    const handleNumberChange = (e) => {
        setInvoiceNumber(e.target.value);
    };

    const handleDueDateChange = (e) => {
        setDueDate(e.target.value);
    };

    return (
        <div className="form-container">
            <h2>Invoice Details</h2>
            <form>
                <div>
                    <label htmlFor="invoiceDate">Invoice Date:</label>
                    <input id="invoiceDate" type="text" value={invoiceDate} onChange={handleDateChange} />
                </div>
                <div>
                    <label htmlFor="invoiceNumber">Invoice Number:</label>
                    <input id="invoiceNumber" type="text" value={invoiceNumber} onChange={handleNumberChange} />
                </div>
                <div>
                    <label htmlFor="dueDate">Due Date:</label>
                    <input id="dueDate" type="text" value={dueDate} onChange={handleDueDateChange} />
                </div>
            </form>
        </div>
    );
};

export default InvoiceDetailsForm;
