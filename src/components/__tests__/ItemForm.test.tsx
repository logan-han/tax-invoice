import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ItemForm from '../ItemForm';
import type { InvoiceItem } from '../../types';

const makeItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id: overrides.id ?? `item-${Math.random()}`,
  name: '',
  quantity: 1,
  price: 0,
  gst: 'add',
  ...overrides,
});

function Harness({
  initial,
  currency = '',
  onChange,
}: {
  initial: InvoiceItem[];
  currency?: string;
  onChange: (items: InvoiceItem[]) => void;
}) {
  const [items, setItems] = useState(initial);
  return (
    <ItemForm
      items={items}
      currency={currency}
      onChange={(next) => {
        onChange(next);
        setItems(next);
      }}
    />
  );
}

const names = () =>
  screen.getAllByPlaceholderText('Description').map((el) => (el as HTMLInputElement).value);

const totalsRow = (label: string) =>
  within(screen.getByLabelText('Totals')).getByText(label).nextElementSibling?.textContent;

describe('ItemForm', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it('renders a row per item', () => {
    render(
      <Harness
        onChange={onChange}
        initial={[makeItem({ name: 'Design' }), makeItem({ name: 'Build' })]}
      />
    );
    expect(names()).toEqual(['Design', 'Build']);
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('adds a blank line from either add button', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ name: 'First' })]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add new invoice item' }));
    fireEvent.click(screen.getByRole('button', { name: /add another item/i }));

    expect(names()).toEqual(['First', '', '']);
    const ids = onChange.mock.lastCall?.[0].map((i: InvoiceItem) => i.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('removes a line, but never the last one', () => {
    render(
      <Harness onChange={onChange} initial={[makeItem({ name: 'A' }), makeItem({ name: 'B' })]} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove item 1' }));
    expect(names()).toEqual(['B']);
    expect(screen.queryByRole('button', { name: /remove item/i })).not.toBeInTheDocument();
  });

  it('edits the description', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ id: 'a' })]} />);
    fireEvent.change(screen.getByLabelText('Item 1 Description'), {
      target: { value: 'Consulting' },
    });
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'a', name: 'Consulting' }),
    ]);
  });

  it('accepts fractional quantities such as hours', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ price: 100, gst: 'no' })]} />);
    fireEvent.change(screen.getByLabelText('Item 1 Quantity'), { target: { value: '7.5' } });

    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ quantity: 7.5 })]);
    expect(screen.getAllByText('$750.00').length).toBeGreaterThan(0);
  });

  it('edits the price', () => {
    render(<Harness onChange={onChange} initial={[makeItem()]} />);
    fireEvent.change(screen.getByLabelText('Item 1 Price'), { target: { value: '99.95' } });
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ price: 99.95 })]);
  });

  it('treats an empty or invalid number as zero but leaves the field empty while typing', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ quantity: 3, price: 10 })]} />);
    const qty = screen.getByLabelText('Item 1 Quantity');

    fireEvent.change(qty, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ quantity: 0 })]);
    expect(qty).toHaveValue(null);

    fireEvent.change(screen.getByLabelText('Item 1 Price'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ price: 0 })]);
  });

  it('shows a zero price as an empty field once it loses focus', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ price: 5 })]} />);
    const price = screen.getByLabelText('Item 1 Price');

    fireEvent.change(price, { target: { value: '0' } });
    expect(price).toHaveValue(0);
    fireEvent.blur(price);
    expect(price).toHaveValue(null);
  });

  it('switches GST mode with the segmented control', () => {
    render(<Harness onChange={onChange} initial={[makeItem({ gst: 'add' })]} />);
    const group = screen.getByRole('radiogroup', { name: 'Item 1 GST' });
    const options = within(group).getAllByRole('radio');

    expect(options.map((o) => o.textContent)).toEqual(['No', '+10%', 'Incl.']);
    expect(options[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(options[2]);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ gst: 'inclusive' })]);
    expect(within(group).getByRole('radio', { name: 'Incl.' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('shows line amounts including GST and whole-cent totals', () => {
    render(
      <Harness
        onChange={onChange}
        initial={[
          makeItem({ quantity: 5, price: 100, gst: 'add' }),
          makeItem({ quantity: 1, price: 99, gst: 'inclusive' }),
          makeItem({ quantity: 2, price: 10, gst: 'no' }),
        ]}
      />
    );

    expect(screen.getByText('$550.00')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(totalsRow('Subtotal')).toBe('$610.00');
    expect(totalsRow('GST (10%)')).toBe('$59.00');
    expect(totalsRow('Total')).toBe('$669.00');
  });

  it('formats amounts in the chosen currency', () => {
    render(
      <Harness
        onChange={onChange}
        currency="EUR"
        initial={[makeItem({ quantity: 1, price: 1000, gst: 'no' })]}
      />
    );
    expect(totalsRow('Total')).toBe('€1,000.00');
  });

  describe('reordering', () => {
    const threeItems = () => [
      makeItem({ id: 'a', name: 'A' }),
      makeItem({ id: 'b', name: 'B' }),
      makeItem({ id: 'c', name: 'C' }),
    ];

    it('has no handle when there is nothing to reorder', () => {
      render(<Harness onChange={onChange} initial={[makeItem()]} />);
      expect(screen.queryByRole('button', { name: /reorder item/i })).not.toBeInTheDocument();
    });

    it('moves a line with the arrow keys and announces it', () => {
      render(<Harness onChange={onChange} initial={threeItems()} />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder item 1' }), {
        key: 'ArrowDown',
      });
      expect(names()).toEqual(['B', 'A', 'C']);
      expect(screen.getByText('Item moved to position 2 of 3')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder item 3' }), {
        key: 'ArrowUp',
      });
      expect(names()).toEqual(['B', 'C', 'A']);
    });

    it('does nothing past either end or for other keys', () => {
      render(<Harness onChange={onChange} initial={threeItems()} />);

      fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder item 1' }), {
        key: 'ArrowUp',
      });
      fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder item 3' }), {
        key: 'ArrowDown',
      });
      fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder item 2' }), { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    // Rows are 40px tall, stacked from y=0, in their current order.
    const layOutRows = () =>
      screen.getAllByRole('group', { name: /^Item \d$/ }).forEach((row, i) => {
        row.getBoundingClientRect = () => ({ top: i * 40, height: 40 }) as DOMRect;
      });

    it('drags a line past its neighbours', () => {
      render(<Harness onChange={onChange} initial={threeItems()} />);
      layOutRows();

      const handle = screen.getByRole('button', { name: 'Reorder item 1' });
      fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 20 });
      expect(screen.getAllByRole('group', { name: /^Item \d$/ })[0]).toHaveClass('is-dragging');

      fireEvent.pointerMove(window, { pointerId: 1, clientY: 50 });
      expect(names()).toEqual(['A', 'B', 'C']); // not past the middle of B yet

      fireEvent.pointerMove(window, { pointerId: 1, clientY: 65 });
      expect(names()).toEqual(['B', 'A', 'C']);

      layOutRows();
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 105 });
      expect(names()).toEqual(['B', 'C', 'A']);

      fireEvent.pointerUp(window, { pointerId: 1 });
      expect(screen.getAllByRole('group', { name: /^Item \d$/ })[2]).not.toHaveClass('is-dragging');

      layOutRows();
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 0 });
      expect(names()).toEqual(['B', 'C', 'A']);
    });

    it('keeps dragging when moving the row drops pointer capture', () => {
      const fourItems = [...threeItems(), makeItem({ id: 'd', name: 'D' })];
      render(<Harness onChange={onChange} initial={fourItems} />);
      layOutRows();

      const handle = screen.getByRole('button', { name: 'Reorder item 1' });
      fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 20 });
      for (const y of [65, 105, 145]) {
        fireEvent.lostPointerCapture(handle, { pointerId: 1 });
        fireEvent.pointerMove(window, { pointerId: 1, clientY: y });
        layOutRows();
      }
      fireEvent.pointerUp(window, { pointerId: 1 });

      expect(names()).toEqual(['B', 'C', 'D', 'A']);
    });

    it('waits for each step to render before taking the next', () => {
      // A parent that never re-renders: only the first step can be taken.
      render(<ItemForm items={threeItems()} currency="" onChange={onChange} />);
      layOutRows();

      const handle = screen.getByRole('button', { name: 'Reorder item 1' });
      fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 20 });
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 65 });
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 105 });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('stops listening once unmounted mid-drag', () => {
      const { unmount } = render(<Harness onChange={onChange} initial={threeItems()} />);
      layOutRows();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Reorder item 1' }), {
        button: 0,
        pointerId: 1,
      });
      unmount();

      fireEvent.pointerMove(window, { pointerId: 1, clientY: 200 });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores drags that start with another mouse button', () => {
      render(<Harness onChange={onChange} initial={threeItems()} />);
      const handle = screen.getByRole('button', { name: 'Reorder item 1' });

      fireEvent.pointerDown(handle, { button: 2, pointerId: 1 });
      fireEvent.pointerMove(window, { pointerId: 1, clientY: 500 });

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
