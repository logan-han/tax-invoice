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
});
