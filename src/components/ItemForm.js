import React, { useState, useEffect } from 'react';

const ItemForm = ({ items, onChange }) => {
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
            if (storedItems.length > 0) {
                onChange(storedItems);
            }
            setIsFirstLoad(false);
        }
    }, [onChange, isFirstLoad]);

    useEffect(() => {
        if (!isFirstLoad && items.length === 0) {
            onChange([{ name: '', quantity: 1, price: 0, gst: 'no' }]);
        }
        updateURL(items);
    }, [items, onChange, isFirstLoad]);

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
        window.history.replaceState({}, '', url);
    };

    return (
        <div className="w-100 d-flex justify-content-center">
            <div style={{ width: '80%' }}>
                <h2>Items</h2>
                <form style={{ maxWidth: '100%', width: '100%' }}>
                    {items.map((item, index) => (
                        <div key={index} className="row mb-3">
                            <div className="col-md-5">
                                <input type="text" name="name" placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(index, e)} className="form-control" />
                            </div>
                            <div className="col-md-2">
                                <input type="number" name="quantity" placeholder="Quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="form-control" />
                            </div>
                            <div className="col-md-2">
                                <input type="number" name="price" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, e)} className="form-control pl-4" />
                            </div>
                            <div className="col-md-2">
                                <select name="gst" value={item.gst} onChange={(e) => handleItemChange(index, e)} className="form-control gst-dropdown form-control-lg">
                                    <option value="no">No GST</option>
                                    <option value="add">Add GST</option>
                                    <option value="inclusive">Incl. GST</option>
                                </select>
                            </div>
                            {items.length > 1 && (
                                <div className="col-md-1">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="btn btn-danger">Remove</button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="mt-3">
                        <button type="button" onClick={handleAddItem} className="btn btn-primary">Add Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemForm;
