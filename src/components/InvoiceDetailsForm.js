import React, { useState, useEffect } from 'react';

const InvoiceDetailsForm = ({ onChange }) => {
    const [invoiceDate, setInvoiceDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [dueDate, setDueDate] = useState('');

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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor="invoiceDate" align="center">Invoice Date</label>
                        <input id="invoiceDate" type="date" value={invoiceDate} onChange={handleDateChange} className="date-picker" />
                    </div>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor="dueDate" align="center">Due Date</label>
                        <input id="dueDate" type="date" value={dueDate} onChange={handleDueDateChange} className="date-picker" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="invoiceNumber" align="center">Invoice Number</label>
                        <input id="invoiceNumber" type="text" value={invoiceNumber} onChange={handleNumberChange} style={{ width: '100%' }} />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceDetailsForm;
