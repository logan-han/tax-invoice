import { useState, useEffect, useCallback, useMemo, memo, type ChangeEvent } from 'react';
import Section from './ui/Section';
import Segmented from './ui/Segmented';
import { I } from '../utils/icons';
import type { InvoiceItem } from '../types';

const MAX_URL_ITEMS = 10;
let itemIdCounter = 0;

interface ItemFormProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
}

const generateItemId = (): string => {
  itemIdCounter += 1;
  return `item-${Date.now()}-${itemIdCounter}`;
};

const GST_OPTIONS = [
  { value: 'no' as const, label: 'No' },
  { value: 'add' as const, label: '+10%' },
  { value: 'inclusive' as const, label: 'Incl.' },
];

const formatCurrency = (amount: number): string => {
  const num = Number(amount) || 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const str = abs.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  return `${sign}$${str}`;
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

  const handleItemChange = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      const newItems = [...items];
      const { name, value } = event.target;
      if (name === 'quantity') {
        newItems[index] = { ...newItems[index], quantity: parseInt(value, 10) || 0 };
      } else if (name === 'price') {
        newItems[index] = { ...newItems[index], price: parseFloat(value) || 0 };
      } else if (name === 'name') {
        newItems[index] = { ...newItems[index], name: value };
      }
      onChange(newItems);
      updateURL(newItems);
    },
    [items, onChange]
  );

  const handleGstChange = useCallback(
    (index: number, next: InvoiceItem['gst']) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], gst: next };
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

  const calc = useMemo(() => {
    let subtotal = 0;
    let gstSum = 0;
    items.forEach((it) => {
      const base = it.gst === 'inclusive' ? it.price / 1.1 : it.price;
      subtotal += base * it.quantity;
      if (it.gst === 'add') gstSum += it.price * it.quantity * 0.1;
      else if (it.gst === 'inclusive') gstSum += it.price * it.quantity * (1 - 1 / 1.1);
    });
    return { subtotal, gst: gstSum, grand: subtotal + gstSum };
  }, [items]);

  const itemCountMeta = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  return (
    <Section
      n={4}
      title="Line items"
      meta={itemCountMeta}
      action={
        <button
          type="button"
          className="btn sm"
          onClick={handleAddItem}
          aria-label="Add new invoice item"
        >
          {I.plus} Add item
        </button>
      }
    >
      <form role="group" aria-label="Invoice line items">
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: 28 }} aria-hidden="true"></th>
              <th>Description</th>
              <th className="num" style={{ width: 70 }}>
                Qty
              </th>
              <th className="num" style={{ width: 110 }}>
                Unit price
              </th>
              <th style={{ width: 160 }}>GST</th>
              <th className="num" style={{ width: 110 }}>
                Amount
              </th>
              <th style={{ width: 28 }} aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const lineTotal =
                item.gst === 'inclusive'
                  ? item.quantity * item.price
                  : item.gst === 'add'
                    ? item.quantity * item.price * 1.1
                    : item.quantity * item.price;
              return (
                <tr
                  key={item.id}
                  className="items-row"
                  role="group"
                  aria-label={`Item ${index + 1}`}
                >
                  <td>
                    <span className="grip" title="Drag to reorder" aria-hidden="true">
                      {I.grip}
                    </span>
                  </td>
                  <td>
                    <label htmlFor={`item-name-${index}`} className="visually-hidden">
                      Item {index + 1} Description
                    </label>
                    <input
                      id={`item-name-${index}`}
                      className="input"
                      type="text"
                      name="name"
                      placeholder="Description"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, e)}
                    />
                  </td>
                  <td>
                    <label htmlFor={`item-qty-${index}`} className="visually-hidden">
                      Item {index + 1} Quantity
                    </label>
                    <input
                      id={`item-qty-${index}`}
                      className="input mono"
                      type="number"
                      name="quantity"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <label htmlFor={`item-price-${index}`} className="visually-hidden">
                      Item {index + 1} Price
                    </label>
                    <input
                      id={`item-price-${index}`}
                      className="input mono"
                      type="number"
                      name="price"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      step="0.01"
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <Segmented
                      value={item.gst}
                      options={GST_OPTIONS}
                      onChange={(next) => handleGstChange(index, next)}
                      ariaLabel={`Item ${index + 1} GST`}
                      name="gst"
                    />
                  </td>
                  <td className="line-total">{formatCurrency(lineTotal)}</td>
                  <td>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn ghost sm row-remove danger-ghost"
                        onClick={() => handleRemoveItem(index)}
                        aria-label={`Remove item ${index + 1}`}
                        title="Remove"
                      >
                        {I.x}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="items-footer">
          <button type="button" className="btn sm" onClick={handleAddItem}>
            {I.plus} Add another item
          </button>
          <div className="totals" aria-label="Totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatCurrency(calc.subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>GST (10%)</span>
              <span>{formatCurrency(calc.gst)}</span>
            </div>
            <div className="totals-row grand">
              <span>Total</span>
              <span>{formatCurrency(calc.grand)}</span>
            </div>
          </div>
        </div>
      </form>
    </Section>
  );
});

export default ItemForm;
