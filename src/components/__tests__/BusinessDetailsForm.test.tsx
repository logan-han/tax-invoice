import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BusinessDetailsForm from '../BusinessDetailsForm';
import type { BusinessDetails } from '../../types';

// Mock AddressAutocomplete component
vi.mock('../AddressAutocomplete', () => ({
  default: ({ onPlaceSelected, placeholder, id }: { onPlaceSelected: (place: unknown) => void; placeholder?: string; id: string }) => (
    <input
      id={id}
      data-testid="address-autocomplete"
      placeholder={placeholder}
      onChange={(e) => {
        if (e.target.value === 'trigger-place') {
          onPlaceSelected({
            address_components: [
              { long_name: '123', short_name: '123', types: ['street_number'] },
              { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
              { long_name: 'Sydney', short_name: 'Sydney', types: ['locality'] },
              { long_name: 'NSW', short_name: 'NSW', types: ['administrative_area_level_1'] },
              { long_name: '2000', short_name: '2000', types: ['postal_code'] },
            ],
          });
        } else if (e.target.value === 'trigger-invalid') {
          onPlaceSelected(null);
        } else if (e.target.value === 'trigger-no-components') {
          onPlaceSelected({});
        } else if (e.target.value === 'trigger-partial') {
          // Address with only street number and route (no suburb, state, postcode)
          onPlaceSelected({
            address_components: [
              { long_name: '456', short_name: '456', types: ['street_number'] },
              { long_name: 'Test Ave', short_name: 'Test Ave', types: ['route'] },
            ],
          });
        }
      }}
    />
  ),
}));

describe('BusinessDetailsForm', () => {
  const mockOnChange = vi.fn();

  const emptyBusinessDetails: BusinessDetails = {
    name: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
    phone: '',
    email: '',
    abn: '',
    acn: '',
    accountName: '',
    bsb: '',
    accountNumber: '',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    });
    window.history.replaceState = vi.fn();
  });

  it('renders the form with all fields', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('ABN')).toBeInTheDocument();
    expect(screen.getByLabelText('ACN')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
    expect(screen.getByLabelText('BSB')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Number')).toBeInTheDocument();
  });

  it('calls onChange when business name is entered', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText('Business Name');
    fireEvent.change(nameInput, { target: { value: 'Test Business', name: 'name' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.name).toBe('Test Business');
  });

  it('formats ABN correctly', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const abnInput = screen.getByLabelText('ABN') as HTMLInputElement;
    fireEvent.change(abnInput, { target: { value: '12345678901', name: 'abn' } });

    expect(abnInput.value).toBe('12 345 678 901');
  });

  it('formats ACN correctly', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const acnInput = screen.getByLabelText('ACN') as HTMLInputElement;
    fireEvent.change(acnInput, { target: { value: '123456789', name: 'acn' } });

    expect(acnInput.value).toBe('123 456 789');
  });

  it('formats BSB correctly', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const bsbInput = screen.getByLabelText('BSB') as HTMLInputElement;
    fireEvent.change(bsbInput, { target: { value: '123456', name: 'bsb' } });

    expect(bsbInput.value).toBe('123-456');
  });

  it('formats phone number correctly', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '0412345678', name: 'phone' } });

    expect(phoneInput.value).toBe('0412 345 678');
  });

  it('restricts postcode to 4 digits', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    // Show manual fields first
    fireEvent.click(screen.getByText('Enter Manually'));

    const postcodeInput = screen.getByLabelText('Postcode') as HTMLInputElement;
    fireEvent.change(postcodeInput, { target: { value: '200012', name: 'postcode' } });

    expect(postcodeInput.value).toBe('2000');
  });

  it('shows manual entry fields when button is clicked', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Enter Manually'));

    expect(screen.getByLabelText('Street')).toBeInTheDocument();
    expect(screen.getByLabelText('Suburb')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Postcode')).toBeInTheDocument();
  });

  it('hides manual entry fields when button is clicked again', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));
    expect(screen.getByLabelText('Street')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Manual Entry'));
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
  });

  it('populates fields when place is selected from autocomplete', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-place' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('123 Main St');
    expect(lastCall.suburb).toBe('Sydney');
    expect(lastCall.state).toBe('NSW');
    expect(lastCall.postcode).toBe('2000');
  });

  it('accepts value prop for controlled mode', () => {
    const value: BusinessDetails = {
      ...emptyBusinessDetails,
      name: 'Controlled Business',
      email: 'test@example.com',
    };

    render(<BusinessDetailsForm onChange={mockOnChange} value={value} />);

    expect(screen.getByLabelText('Business Name')).toHaveValue('Controlled Business');
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
  });

  it('updates when value prop changes', () => {
    const { rerender } = render(
      <BusinessDetailsForm onChange={mockOnChange} value={{ ...emptyBusinessDetails, name: 'First' }} />
    );

    expect(screen.getByLabelText('Business Name')).toHaveValue('First');

    rerender(
      <BusinessDetailsForm onChange={mockOnChange} value={{ ...emptyBusinessDetails, name: 'Second' }} />
    );

    expect(screen.getByLabelText('Business Name')).toHaveValue('Second');
  });

  it('shows manual fields when value has address data', () => {
    const value: BusinessDetails = {
      ...emptyBusinessDetails,
      street: '123 Test St',
    };

    render(<BusinessDetailsForm onChange={mockOnChange} value={value} />);

    expect(screen.getByLabelText('Street')).toBeInTheDocument();
  });

  it('has state dropdown with Australian states', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const stateSelect = screen.getByLabelText('State');
    expect(stateSelect).toBeInTheDocument();

    const options = stateSelect.querySelectorAll('option');
    expect(options.length).toBe(9); // Empty + 8 states
  });

  it('handles invalid place selection gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-invalid' } });

    expect(consoleSpy).toHaveBeenCalledWith('Place or address components not found:', null);
    consoleSpy.mockRestore();
  });

  it('handles place without address_components gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-no-components' } });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles partial address with missing components', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-partial' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('456 Test Ave');
    expect(lastCall.suburb).toBe('');
    expect(lastCall.state).toBe('');
    expect(lastCall.postcode).toBe('');
  });

  it('allows changing state via dropdown', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const stateSelect = screen.getByLabelText('State');
    fireEvent.change(stateSelect, { target: { value: 'QLD', name: 'state' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.state).toBe('QLD');
  });

  it('allows entering street manually', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const streetInput = screen.getByLabelText('Street');
    fireEvent.change(streetInput, { target: { value: '789 Manual St', name: 'street' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('789 Manual St');
  });

  it('allows entering suburb manually', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const suburbInput = screen.getByLabelText('Suburb');
    fireEvent.change(suburbInput, { target: { value: 'Brisbane', name: 'suburb' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.suburb).toBe('Brisbane');
  });

  it('allows entering account number', () => {
    render(<BusinessDetailsForm onChange={mockOnChange} />);

    const accountNumberInput = screen.getByLabelText('Account Number');
    fireEvent.change(accountNumberInput, { target: { value: '12345678', name: 'accountNumber' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.accountNumber).toBe('12345678');
  });
});
