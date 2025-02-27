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
                    gst: queryParams.get(`itemGst_${i}`) || 'no'
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
            onChange([{ name: '', quantity: 1, price: 0, gst: 'no' }]);
        }
        updateURL(items);
    }, [items, onChange, isFirstLoad]);

    useEffect(() => {
        updateURL(items);
    },[currencyRemark])

    const handleItemChange = (index, event) => {
        const newItems = [...items];
        const { name, value } = event.target;
        newItems[index][name] = value;
        onChange(newItems);
        updateURL(newItems);
    };

    const handleAddItem = () => {
        const newItems = [...items, { name: '', quantity: 1, price: 0, gst: 'no' }];
        onChange(newItems);
        updateURL(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
        updateURL(newItems);
    };

    const handleCurrencyRemarkChange = (event) => {
        const { name, value, type, checked } = event.target;
        onCurrencyRemarkChange({ ...currencyRemark, [name]: type === 'checkbox' ? checked : value });
    };

    const updateURL = (items) => {
        const url = new URL(window.location.href);
        for (let i = 0; i < 10; i++) {
            url.searchParams.delete(`itemName_${i}`);
            url.searchParams.delete(`itemQuantity_${i}`);
            url.searchParams.delete(`itemPrice_${i}`);
            url.searchParams.delete(`itemGst_${i}`);
        }
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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <label className="currency-checkbox" style={{ marginRight: '10px' }}>
                        <input type="checkbox" name="enabled" checked={currencyRemark.enabled} onChange={handleCurrencyRemarkChange} />
                        <span className="checkmark"></span>
                        Add Currency
                    </label>
                    {currencyRemark.enabled && (
                        <input type="text" name="currency" placeholder="Currency" value={currencyRemark.currency} onChange={handleCurrencyRemarkChange} style={{ width: '80px' }} />
                    )}
                </div>
                {items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                        <input type="text" name="name" placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(index, e)} style={{ flex: 2, marginRight: '10px' }} />
                        <input type="number" name="quantity" placeholder="Quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} style={{ flex: 0.5, marginRight: '10px' }} />
                        <div style={{ position: 'relative', flex: 1.5, marginRight: '10px' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '40%', transform: 'translateY(-50%)'}}>$</span>
                            <input type="number" name="price" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, e)} style={{ paddingLeft: '20px' }} />
                        </div>
                        <label style={{ flex: 1, marginRight: '10px', marginBottom: '15px' }}>
                            <select name="gst" value={item.gst} onChange={(e) => handleItemChange(index, e)} className="gst-dropdown">
                                <option value="no">No GST</option>
                                <option value="add">Add GST</option>
                                <option value="inclusive">Incl. GST</option>
                            </select>
                        </label>
                        {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(index)} style={{ padding: '5px 10px', marginBottom: '15px' }}>Remove</button>
                        )}
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
