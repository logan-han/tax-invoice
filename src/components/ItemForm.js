import React, { useState, useEffect } from 'react';

const InvoiceForm = ({ items, onChange, currencyRemark = { enabled: false, currency: 'AUD' }, onCurrencyRemarkChange = () => {} }) => {
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        if (isFirstLoad) {
            const queryParams = new URLSearchParams(window.location.search);
            const storedItems = [];
            for (let i = 0; i < 10; i++) {
                const itemName = queryParams.get(`itemName_${i}`);
                if (!itemName) break;
                storedItems.push({
                    name: itemName,
                    quantity: parseInt(queryParams.get(`itemQuantity_${i}`)) || 1,
                    price: parseFloat(queryParams.get(`itemPrice_${i}`)) || 0,
                    gst: queryParams.get(`itemGst_${i}`) === 'true'
                });
            }
            const storedCurrencyRemark = {
                enabled: queryParams.get(`currencyRemarkEnabled`) === 'true',
                currency: queryParams.get(`currencyRemarkCurrency`) || 'AUD'
            };
            if (storedItems.length > 0) {
                onChange(storedItems);
            }
            onCurrencyRemarkChange(storedCurrencyRemark);
            setIsFirstLoad(false);
        }
    }, [onChange, onCurrencyRemarkChange, isFirstLoad]);

    useEffect(() => {
        if (!isFirstLoad && items.length === 0) {
            onChange([{ name: '', quantity: 1, price: 0, gst: false }]);
        }
        updateURL(items); // Update URL when items change
    }, [items, onChange, isFirstLoad]);

    useEffect(() => {
        updateURL(items);
    },[currencyRemark])

    const handleItemChange = (index, event) => {
        const newItems = [...items];
        const { name, value, type, checked } = event.target;
        newItems[index][name] = type === 'checkbox' ? checked : value;
        onChange(newItems);
        updateURL(newItems); // Update URL when an item changes
    };

    const handleAddItem = () => {
        const newItems = [...items, { name: '', quantity: 1, price: 0, gst: false }];
        onChange(newItems);
        updateURL(newItems); // Update URL when an item is added
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
        updateURL(newItems); // Update URL when an item is removed
    };

    const handleCurrencyRemarkChange = (event) => {
        const { name, value, type, checked } = event.target;
        onCurrencyRemarkChange({ ...currencyRemark, [name]: type === 'checkbox' ? checked : value });
    };

    const updateURL = (items) => {
        const url = new URL(window.location.href);
        // remove previous item in the query
        for (let i = 0; i < 10; i++) {
            url.searchParams.delete(`itemName_${i}`);
            url.searchParams.delete(`itemQuantity_${i}`);
            url.searchParams.delete(`itemPrice_${i}`);
            url.searchParams.delete(`itemGst_${i}`);
        }
        // Add current items in query
        items.forEach((item, index) => {
            url.searchParams.set(`itemName_${index}`, item.name);
            url.searchParams.set(`itemQuantity_${index}`, item.quantity);
            url.searchParams.set(`itemPrice_${index}`, item.price);
            url.searchParams.set(`itemGst_${index}`, item.gst);
        });
        url.searchParams.set(`currencyRemarkEnabled`, currencyRemark.enabled);
        url.searchParams.set(`currencyRemarkCurrency`, currencyRemark.currency);

        window.history.replaceState({}, '', url);
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
