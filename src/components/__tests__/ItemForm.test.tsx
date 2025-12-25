import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemForm from '../ItemForm';
import type { InvoiceItem } from '../../types';

describe('ItemForm', () => {
  const mockOnChange = vi.fn();

  const createItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
    id: `test-${Date.now()}`,
    name: '',
    quantity: 1,
    price: 0,
    gst: 'no',
    ...overrides,
  });

  beforeEach(() => {
    mockOnChange.mockClear();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    });
    window.history.replaceState = vi.fn();
  });

  it('renders the form with items', () => {
    const items = [createItem({ name: 'Test Item', quantity: 2, price: 100 })];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('shows Add Item button', () => {
    render(<ItemForm items={[createItem()]} onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls onChange when adding an item', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems.length).toBe(2);
  });

  it('shows remove button when multiple items exist', () => {
    const items = [createItem(), createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  it('does not show remove button when only one item exists', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls onChange when removing an item', () => {
    const items = [createItem({ name: 'Item 1' }), createItem({ name: 'Item 2' })];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems.length).toBe(1);
  });

  it('calls onChange when item name is changed', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const nameInput = screen.getByPlaceholderText('Description');
    fireEvent.change(nameInput, { target: { value: 'New Item Name' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onChange when quantity is changed', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const qtyInput = screen.getByPlaceholderText('Qty');
    fireEvent.change(qtyInput, { target: { value: '5' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('has GST dropdown with correct options', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const gstSelect = screen.getByRole('combobox');
    expect(gstSelect).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('No GST');
    expect(options[1]).toHaveTextContent('Add GST');
    expect(options[2]).toHaveTextContent('Incl. GST');
  });

  it('calls onChange when GST is changed', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const gstSelect = screen.getByRole('combobox');
    fireEvent.change(gstSelect, { target: { value: 'inclusive', name: 'gst' } });

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems[0].gst).toBe('inclusive');
  });

  it('calls onChange when price is changed', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const priceInput = screen.getByPlaceholderText('Price');
    fireEvent.change(priceInput, { target: { value: '150', name: 'price' } });

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems[0].price).toBe(150);
  });

  it('reads items from URL parameters on first load', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?itemName_0=URL+Item&itemQuantity_0=5&itemPrice_0=200&itemGst_0=add',
        href: 'http://localhost/?itemName_0=URL+Item&itemQuantity_0=5&itemPrice_0=200&itemGst_0=add'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[0][0];
    expect(newItems[0].name).toBe('URL Item');
    expect(newItems[0].quantity).toBe(5);
    expect(newItems[0].price).toBe(200);
    expect(newItems[0].gst).toBe('add');
  });

  it('creates default item when items become empty', () => {
    const { rerender } = render(<ItemForm items={[createItem()]} onChange={mockOnChange} />);

    // Clear mock and rerender with empty items
    mockOnChange.mockClear();
    rerender(<ItemForm items={[]} onChange={mockOnChange} />);

    // Should create a default item when items are empty after first load
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('updates URL when items change', () => {
    const items = [createItem({ name: 'Test Item' })];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('handles invalid quantity gracefully', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const qtyInput = screen.getByPlaceholderText('Qty');
    fireEvent.change(qtyInput, { target: { value: 'abc', name: 'quantity' } });

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems[0].quantity).toBe(0);
  });

  it('handles invalid price gracefully', () => {
    const items = [createItem()];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const priceInput = screen.getByPlaceholderText('Price');
    fireEvent.change(priceInput, { target: { value: 'abc', name: 'price' } });

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems[0].price).toBe(0);
  });

  it('reads multiple items from URL parameters', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?itemName_0=Item+1&itemQuantity_0=1&itemPrice_0=100&itemGst_0=no&itemName_1=Item+2&itemQuantity_1=2&itemPrice_1=200&itemGst_1=add',
        href: 'http://localhost/?itemName_0=Item+1&itemQuantity_0=1&itemPrice_0=100&itemGst_0=no&itemName_1=Item+2&itemQuantity_1=2&itemPrice_1=200&itemGst_1=add'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[0][0];
    expect(newItems.length).toBe(2);
    expect(newItems[0].name).toBe('Item 1');
    expect(newItems[1].name).toBe('Item 2');
  });

  it('does not read from URL on subsequent renders', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?itemName_0=URL+Item',
        href: 'http://localhost/?itemName_0=URL+Item'
      },
      writable: true,
    });

    const { rerender } = render(<ItemForm items={[]} onChange={mockOnChange} />);
    mockOnChange.mockClear();

    // Rerender with new items - should not read from URL again
    rerender(<ItemForm items={[createItem({ name: 'New Item' })]} onChange={mockOnChange} />);

    // Should not have been called to load from URL
    const calls = mockOnChange.mock.calls;
    const urlLoadCall = calls.find(call => call[0]?.[0]?.name === 'URL Item');
    expect(urlLoadCall).toBeUndefined();
  });

  it('uses default values for missing URL parameters', () => {
    Object.defineProperty(window, 'location', {
      value: {
        // Only name is provided, quantity/price/gst are missing
        search: '?itemName_0=Minimal+Item',
        href: 'http://localhost/?itemName_0=Minimal+Item'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[0][0];
    expect(newItems[0].name).toBe('Minimal Item');
    expect(newItems[0].quantity).toBe(1); // Default
    expect(newItems[0].price).toBe(0); // Default
    expect(newItems[0].gst).toBe('add'); // Default
  });

  it('handles invalid quantity in URL parameters', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?itemName_0=Item&itemQuantity_0=abc',
        href: 'http://localhost/?itemName_0=Item&itemQuantity_0=abc'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[0][0];
    expect(newItems[0].quantity).toBe(1); // Falls back to default
  });

  it('handles invalid price in URL parameters', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?itemName_0=Item&itemPrice_0=invalid',
        href: 'http://localhost/?itemName_0=Item&itemPrice_0=invalid'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[0][0];
    expect(newItems[0].price).toBe(0); // Falls back to default
  });

  it('handles changing item name via input', () => {
    const items = [createItem({ name: 'Original' })];
    render(<ItemForm items={items} onChange={mockOnChange} />);

    const nameInput = screen.getByPlaceholderText('Description');
    fireEvent.change(nameInput, { target: { value: 'Updated Name', name: 'name' } });

    expect(mockOnChange).toHaveBeenCalled();
    const newItems = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(newItems[0].name).toBe('Updated Name');
  });

  it('does not load from URL when no items in URL', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost/'
      },
      writable: true,
    });

    render(<ItemForm items={[]} onChange={mockOnChange} />);

    // First call should be to create a default item, not to load from URL
    const firstCall = mockOnChange.mock.calls[0][0];
    expect(firstCall.length).toBe(1);
    expect(firstCall[0].name).toBe('');
  });
});
