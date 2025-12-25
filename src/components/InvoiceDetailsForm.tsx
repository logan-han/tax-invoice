import { useState, useEffect, useCallback, memo, type ChangeEvent } from 'react';
import type { InvoiceDetails } from '../types';

interface InvoiceDetailsFormProps {
  onChange: (details: InvoiceDetails) => void;
}

const InvoiceDetailsForm = memo(function InvoiceDetailsForm({ onChange }: InvoiceDetailsFormProps) {
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];
    setInvoiceDate(dateString);
    setInvoiceNumber(`${dateString.replace(/-/g, '')}-0001`);

    const dueDateObj = new Date(date);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDateString = dueDateObj.toISOString().split('T')[0];
    setDueDate(dueDateString);
  }, []);

  useEffect(() => {
    onChange({ invoiceDate, invoiceNumber, dueDate, currency });
  }, [invoiceDate, invoiceNumber, dueDate, currency, onChange]);

  const handleDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newInvoiceDate = e.target.value;
    setInvoiceDate(newInvoiceDate);

    setInvoiceNumber(`${newInvoiceDate.replace(/-/g, '')}-0001`);

    const newDueDateObj = new Date(newInvoiceDate);
    newDueDateObj.setDate(newDueDateObj.getDate() + 30);
    const newDueDateString = newDueDateObj.toISOString().split('T')[0];
    setDueDate(newDueDateString);
  }, []);

  const handleNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
  }, []);

  const handleDueDateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  }, []);

  return (
    <div className="form-container w-100">
      <h2>Invoice Details</h2>
      <form style={{ maxWidth: '80%', width: '80%' }}>
        <div className="row">
          <div className="group col-md-5">
            <label htmlFor="invoiceDate">Invoice Date</label>
            <input
              id="invoiceDate"
              name="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={handleDateChange}
              className="form-control form-control-lg"
            />
          </div>
          <div className="group col-md-5">
            <label htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="form-control form-control-lg"
            />
          </div>
        </div>
        <div className="row">
          <div className="group col-md-5">
            <label htmlFor="invoiceNumber">Invoice Number</label>
            <input
              id="invoiceNumber"
              name="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={handleNumberChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-5">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={handleCurrencyChange}
              className="form-control form-control-lg"
            >
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
});

export default InvoiceDetailsForm;
