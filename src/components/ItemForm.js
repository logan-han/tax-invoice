import React, { useState } from 'react';

const InvoiceForm = ({ items, onChange }) => {
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

    return (
        <div>
            <h2>Items</h2>
            <form>
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