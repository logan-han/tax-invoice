import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import Section from './ui/Section';
import Segmented from './ui/Segmented';
import NumberInput from './ui/NumberInput';
import { I } from '../utils/icons';
import { calculateTotals, formatMoney, lineTotal } from '../utils/money';
import { blankItem } from '../utils/urlState';
import type { InvoiceItem } from '../types';

interface ItemFormProps {
  items: InvoiceItem[];
  currency: string;
  onChange: (items: InvoiceItem[]) => void;
}

const GST_OPTIONS = [
  { value: 'no' as const, label: 'No' },
  { value: 'add' as const, label: '+10%' },
  { value: 'inclusive' as const, label: 'Incl.' },
];

const moveItem = (items: InvoiceItem[], from: number, to: number): InvoiceItem[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

const ItemForm = memo(function ItemForm({ items, currency, onChange }: ItemFormProps) {
  const rows = useRef(new Map<string, HTMLTableRowElement>());
  const latest = useRef({ items, onChange });
  const awaitingRender = useRef(false);
  const stopDrag = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // A drag step waits for the previous one to reach the DOM so row positions are current.
  useLayoutEffect(() => {
    latest.current = { items, onChange };
    awaitingRender.current = false;
  }, [items, onChange]);

  useEffect(() => () => stopDrag.current?.(), []);

  const updateItem = useCallback(
    (index: number, patch: Partial<InvoiceItem>) => {
      onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    },
    [items, onChange]
  );

  const handleAddItem = useCallback(() => {
    onChange([...items, blankItem()]);
  }, [items, onChange]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length || to === from) return false;
      onChange(moveItem(items, from, to));
      setAnnouncement(`Item moved to position ${to + 1} of ${items.length}`);
      return true;
    },
    [items, onChange]
  );

  const handleGripKeyDown = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    move(index, e.key === 'ArrowUp' ? index - 1 : index + 1);
  };

  // Follows the pointer on window: reordering moves the grip's own row in the DOM, which drops
  // any pointer capture on it.
  const handleGripPointerDown = (id: string) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    stopDrag.current?.();
    setDragging(id);

    // Swap with a neighbour once the pointer passes the middle of its row.
    const onMove = (event: globalThis.PointerEvent) => {
      if (awaitingRender.current) return;
      const { items: current, onChange: emit } = latest.current;
      const from = current.findIndex((item) => item.id === id);
      if (from < 0) return;
      const rectAt = (i: number) => {
        const item = current[i];
        return item && rows.current.get(item.id)?.getBoundingClientRect();
      };
      const above = rectAt(from - 1);
      const below = rectAt(from + 1);
      let to = from;
      if (above && event.clientY < above.top + above.height / 2) to = from - 1;
      else if (below && event.clientY > below.top + below.height / 2) to = from + 1;
      if (to === from) return;
      awaitingRender.current = true;
      emit(moveItem(current, from, to));
      setAnnouncement(`Item moved to position ${to + 1} of ${current.length}`);
    };

    const stop = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      stopDrag.current = null;
      setDragging(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    stopDrag.current = stop;
  };

  const totals = useMemo(() => calculateTotals(items), [items]);
  const money = (amount: number) => formatMoney(amount, currency);
  const canReorder = items.length > 1;

  return (
    <Section
      n={4}
      title="Line items"
      meta={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
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
      <div role="group" aria-label="Invoice line items">
        <table className={`items-table${dragging ? ' is-dragging' : ''}`}>
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
            {items.map((item, index) => (
              <tr
                key={item.id}
                ref={(el) => {
                  if (el) rows.current.set(item.id, el);
                  else rows.current.delete(item.id);
                }}
                className={`items-row${dragging === item.id ? ' is-dragging' : ''}`}
                role="group"
                aria-label={`Item ${index + 1}`}
              >
                <td>
                  {canReorder && (
                    <button
                      type="button"
                      className="grip"
                      aria-label={`Reorder item ${index + 1}`}
                      title="Drag, or use the arrow keys, to reorder"
                      onKeyDown={handleGripKeyDown(index)}
                      onPointerDown={handleGripPointerDown(item.id)}
                    >
                      {I.grip}
                    </button>
                  )}
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
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                  />
                </td>
                <td>
                  <label htmlFor={`item-qty-${index}`} className="visually-hidden">
                    Item {index + 1} Quantity
                  </label>
                  <NumberInput
                    id={`item-qty-${index}`}
                    className="input mono"
                    name="quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onValueChange={(quantity) => updateItem(index, { quantity })}
                    min="0"
                    step="any"
                    style={{ textAlign: 'right' }}
                  />
                </td>
                <td>
                  <label htmlFor={`item-price-${index}`} className="visually-hidden">
                    Item {index + 1} Price
                  </label>
                  <NumberInput
                    id={`item-price-${index}`}
                    className="input mono"
                    name="price"
                    placeholder="Price"
                    value={item.price}
                    onValueChange={(price) => updateItem(index, { price })}
                    step="0.01"
                    style={{ textAlign: 'right' }}
                  />
                </td>
                <td>
                  <Segmented
                    value={item.gst}
                    options={GST_OPTIONS}
                    onChange={(gst) => updateItem(index, { gst })}
                    ariaLabel={`Item ${index + 1} GST`}
                    name="gst"
                  />
                </td>
                <td className="line-total">{money(lineTotal(item))}</td>
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
            ))}
          </tbody>
        </table>
        <div className="visually-hidden" aria-live="polite">
          {announcement}
        </div>
        <div className="items-footer">
          <button type="button" className="btn sm" onClick={handleAddItem}>
            {I.plus} Add another item
          </button>
          <div className="totals" aria-label="Totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>GST (10%)</span>
              <span>{money(totals.gst)}</span>
            </div>
            <div className="totals-row grand">
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
});

export default ItemForm;
