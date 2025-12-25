import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientDetailsForm from '../ClientDetailsForm';

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
              { long_name: '456', short_name: '456', types: ['street_number'] },
              { long_name: 'Client St', short_name: 'Client St', types: ['route'] },
              { long_name: 'Melbourne', short_name: 'Melbourne', types: ['locality'] },
              { long_name: 'VIC', short_name: 'VIC', types: ['administrative_area_level_1'] },
              { long_name: '3000', short_name: '3000', types: ['postal_code'] },
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
              { long_name: '789', short_name: '789', types: ['street_number'] },
              { long_name: 'Test Rd', short_name: 'Test Rd', types: ['route'] },
            ],
          });
        }
      }}
    />
  ),
}));

describe('ClientDetailsForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'http://localhost/' },
      writable: true,
    });
    window.history.replaceState = vi.fn();
  });

  it('renders the form with all fields', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    expect(screen.getByLabelText('Client Name')).toBeInTheDocument();
    expect(screen.getByLabelText('ABN')).toBeInTheDocument();
    expect(screen.getByLabelText('ACN')).toBeInTheDocument();
    expect(screen.getByText('Enter Manually')).toBeInTheDocument();
  });

  it('calls onChange when client name is entered', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText('Client Name');
    fireEvent.change(nameInput, { target: { value: 'Test Client', name: 'name' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.name).toBe('Test Client');
  });

  it('formats ABN correctly', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const abnInput = screen.getByLabelText('ABN') as HTMLInputElement;
    fireEvent.change(abnInput, { target: { value: '98765432109', name: 'abn' } });

    expect(abnInput.value).toBe('98 765 432 109');
  });

  it('formats ACN correctly', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const acnInput = screen.getByLabelText('ACN') as HTMLInputElement;
    fireEvent.change(acnInput, { target: { value: '987654321', name: 'acn' } });

    expect(acnInput.value).toBe('987 654 321');
  });

  it('restricts postcode to 4 digits', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const postcodeInput = screen.getByLabelText('Postcode') as HTMLInputElement;
    fireEvent.change(postcodeInput, { target: { value: '300012', name: 'postcode' } });

    expect(postcodeInput.value).toBe('3000');
  });

  it('shows manual entry fields when button is clicked', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Enter Manually'));

    expect(screen.getByLabelText('Street')).toBeInTheDocument();
    expect(screen.getByLabelText('Suburb')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Postcode')).toBeInTheDocument();
  });

  it('hides manual entry fields when button is clicked again', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));
    expect(screen.getByLabelText('Street')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Manual Entry'));
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
  });

  it('populates fields when place is selected from autocomplete', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-place' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('456 Client St');
    expect(lastCall.suburb).toBe('Melbourne');
    expect(lastCall.state).toBe('VIC');
    expect(lastCall.postcode).toBe('3000');
  });

  it('handles invalid place selection gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-invalid' } });

    expect(consoleSpy).toHaveBeenCalledWith('Place or address components not found:', null);
    consoleSpy.mockRestore();
  });

  it('handles place without address_components gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-no-components' } });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('has state dropdown with Australian states', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const stateSelect = screen.getByLabelText('State');
    expect(stateSelect).toBeInTheDocument();

    const options = stateSelect.querySelectorAll('option');
    expect(options.length).toBe(9); // Empty + 8 states
  });

  it('allows changing state via dropdown', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const stateSelect = screen.getByLabelText('State');
    fireEvent.change(stateSelect, { target: { value: 'QLD', name: 'state' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.state).toBe('QLD');
  });

  it('allows entering street manually', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const streetInput = screen.getByLabelText('Street');
    fireEvent.change(streetInput, { target: { value: '789 Manual St', name: 'street' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('789 Manual St');
  });

  it('allows entering suburb manually', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Enter Manually'));

    const suburbInput = screen.getByLabelText('Suburb');
    fireEvent.change(suburbInput, { target: { value: 'Brisbane', name: 'suburb' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.suburb).toBe('Brisbane');
  });

  it('reads URL parameters on mount', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?clientName=URL+Client&clientStreet=URL+Street',
        href: 'http://localhost/?clientName=URL+Client&clientStreet=URL+Street'
      },
      writable: true,
    });

    render(<ClientDetailsForm onChange={mockOnChange} />);

    expect(screen.getByLabelText('Client Name')).toHaveValue('URL Client');
    // Street field should be visible because URL params include address data
    expect(screen.getByLabelText('Street')).toHaveValue('URL Street');
  });

  it('updates URL when client details change', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText('Client Name');
    fireEvent.change(nameInput, { target: { value: 'URL Test', name: 'name' } });

    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('handles partial address with missing components', () => {
    render(<ClientDetailsForm onChange={mockOnChange} />);

    const autocomplete = screen.getByTestId('address-autocomplete');
    fireEvent.change(autocomplete, { target: { value: 'trigger-partial' } });

    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall.street).toBe('789 Test Rd');
    expect(lastCall.suburb).toBe('');
    expect(lastCall.state).toBe('');
    expect(lastCall.postcode).toBe('');
  });
});
