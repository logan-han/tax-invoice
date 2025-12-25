import { useState, useEffect, useCallback, memo, type ChangeEvent } from 'react';
import type { InvoiceItem } from '../types';

const MAX_URL_ITEMS = 10;

interface ItemFormProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
}

const generateItemId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const ItemForm = memo(function ItemForm({ items, onChange }: ItemFormProps) {
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (isFirstLoad) {
      const queryParams = new URLSearchParams(window.location.search);
      const storedItems: InvoiceItem[] = [];
      for (let i = 0; i < MAX_URL_ITEMS; i++) {
        const itemName = queryParams.get(`itemName_${i}`);
        if (!itemName) break;
        storedItems.push({
          id: generateItemId(),
          name: itemName,
          quantity: parseInt(queryParams.get(`itemQuantity_${i}`) || '1', 10) || 1,
          price: parseFloat(queryParams.get(`itemPrice_${i}`) || '0') || 0,
          gst: (queryParams.get(`itemGst_${i}`) as InvoiceItem['gst']) || 'add',
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
      onChange([{ id: generateItemId(), name: '', quantity: 1, price: 0, gst: 'add' }]);
    }
    updateURL(items);
  }, [items, onChange, isFirstLoad]);

  const handleItemChange = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const newItems = [...items];
      const { name, value } = event.target;

      if (name === 'quantity') {
        newItems[index] = { ...newItems[index], quantity: parseInt(value, 10) || 0 };
      } else if (name === 'price') {
        newItems[index] = { ...newItems[index], price: parseFloat(value) || 0 };
      } else if (name === 'gst') {
        newItems[index] = { ...newItems[index], gst: value as InvoiceItem['gst'] };
      } else if (name === 'name') {
        newItems[index] = { ...newItems[index], name: value };
      }

      onChange(newItems);
      updateURL(newItems);
    },
    [items, onChange]
  );

  const handleAddItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: generateItemId(),
      name: '',
      quantity: 1,
      price: 0,
      gst: 'add',
    };
    const newItems = [...items, newItem];
    onChange(newItems);
    updateURL(newItems);
  }, [items, onChange]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
      updateURL(newItems);
    },
    [items, onChange]
  );

  const updateURL = (itemsList: InvoiceItem[]) => {
    const url = new URL(window.location.href);
    for (let i = 0; i < MAX_URL_ITEMS; i++) {
      url.searchParams.delete(`itemName_${i}`);
      url.searchParams.delete(`itemQuantity_${i}`);
      url.searchParams.delete(`itemPrice_${i}`);
      url.searchParams.delete(`itemGst_${i}`);
    }
    itemsList.forEach((item, index) => {
      url.searchParams.set(`itemName_${index}`, item.name);
      url.searchParams.set(`itemQuantity_${index}`, String(item.quantity));
      url.searchParams.set(`itemPrice_${index}`, String(item.price));
      url.searchParams.set(`itemGst_${index}`, item.gst);
    });
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="w-100 d-flex justify-content-center">
      <div style={{ width: '80%' }}>
        <h2>Invoice Items</h2>
        <form
          style={{ maxWidth: '100%', width: '100%' }}
          role="group"
          aria-label="Invoice line items"
        >
          <div className="row mb-2">
            <div className="col-md-5">
              <label className="form-label fw-semibold">Item Description</label>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Quantity</label>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Price</label>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">GST</label>
            </div>
          </div>
          {items.map((item, index) => (
            <div
              key={item.id}
              className="row mb-3"
              role="group"
              aria-label={`Item ${index + 1}`}
            >
              <div className="col-md-5">
                <label htmlFor={`item-name-${index}`} className="visually-hidden">
                  Item {index + 1} Description
                </label>
                <input
                  id={`item-name-${index}`}
                  type="text"
                  name="name"
                  placeholder="Description"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, e)}
                  className="form-control"
                />
              </div>
              <div className="col-md-2">
                <label htmlFor={`item-qty-${index}`} className="visually-hidden">
                  Item {index + 1} Quantity
                </label>
                <input
                  id={`item-qty-${index}`}
                  type="number"
                  name="quantity"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, e)}
                  className="form-control"
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <label htmlFor={`item-price-${index}`} className="visually-hidden">
                  Item {index + 1} Price
                </label>
                <input
                  id={`item-price-${index}`}
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, e)}
                  className="form-control pl-4"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-2">
                <label htmlFor={`item-gst-${index}`} className="visually-hidden">
                  Item {index + 1} GST
                </label>
                <select
                  id={`item-gst-${index}`}
                  name="gst"
                  value={item.gst}
                  onChange={(e) => handleItemChange(index, e)}
                  className="form-control gst-dropdown form-control-lg"
                >
                  <option value="no">No GST</option>
                  <option value="add">Add GST</option>
                  <option value="inclusive">Incl. GST</option>
                </select>
              </div>
              {items.length > 1 && (
                <div className="col-md-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="btn btn-outline-danger"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleAddItem}
              className="btn btn-primary"
              aria-label="Add new invoice item"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ItemForm;
