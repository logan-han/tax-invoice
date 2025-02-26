import React, { useState, useEffect } from 'react';

const InvoiceForm = ({ items, onChange, currencyRemark = { enabled: false, currency: 'AUD' }, onCurrencyRemarkChange = () => {} }) => {
    useEffect(() => {
        if (items.length === 0) {
            onChange([{ name: '', quantity: 1, price: 0, gst: false }]);
        }
    }, [items, onChange]);

    const handleItemChange = (index, event) => {
        const newItems = [...items];
        const { name, value, type, checked } = event.target;
        newItems[index][name] = type === 'checkbox' ? checked : value;
        onChange(newItems);
    };

    const handleAddItem = () => {
        onChange([...items, { name: '', quantity: 1, price: 0, gst: false }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    const handleCurrencyRemarkChange = (event) => {
        const { name, value, type, checked } = event.target;
        onCurrencyRemarkChange({ ...currencyRemark, [name]: type === 'checkbox' ? checked : value });
    };

    return (
        <div>
            <h2>Items</h2>
            <form>
                <label>
                    <input type="checkbox" name="enabled" checked={currencyRemark.enabled} onChange={handleCurrencyRemarkChange} />
                    Add Currency
                </label>
                {currencyRemark.enabled && (
                    <div style={{ marginBottom: '20px' }}>
                        <input type="text" name="currency" placeholder="Currency" value={currencyRemark.currency} onChange={handleCurrencyRemarkChange} />
                    </div>
                )}
                {items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                        <input type="text" name="name" placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(index, e)} />
                        <input type="number" name="quantity" placeholder="Quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} />
                        <input type="number" name="price" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, e)} />
                        <label>
                            <input type="checkbox" name="gst" checked={item.gst} onChange={(e) => handleItemChange(index, e)} />
                            Add GST
                        </label>
                        <button type="button" onClick={() => handleRemoveItem(index)}>Remove Item</button>
                    </div>
                ))}
                <div style={{ marginTop: '20px' }}>
                    <button type="button" onClick={handleAddItem}>Add Item</button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;