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
        <div className="form-container w-100">
            <h2>Invoice Details</h2>
            <form style={{ maxWidth: '80%', width: '80%' }}>
                <div className="row">
                    <div className="group col-md-4">
                        <label htmlFor="invoiceDate">Invoice Date</label>
                        <input id="invoiceDate" type="date" value={invoiceDate} onChange={handleDateChange} className="form-control form-control-lg" />
                    </div>
                    <div className="group col-md-4">
                        <label htmlFor="dueDate">Due Date</label>
                        <input id="dueDate" type="date" value={dueDate} onChange={handleDueDateChange} className="form-control form-control-lg" />
                    </div>
                    <div className="group col-md-4">
                        <label htmlFor="invoiceNumber">Invoice Number</label>
                        <input id="invoiceNumber" type="text" value={invoiceNumber} onChange={handleNumberChange} className="form-control" />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InvoiceDetailsForm;
