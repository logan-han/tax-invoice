import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientDetailsForm from '../ClientDetailsForm';
import type { ClientDetails } from '../../types';

// Stands in for the Google widget: typing a trigger word "selects" a place.
vi.mock('../AddressAutocomplete', () => ({
  default: ({
    onPlaceSelected,
    placeholder,
    id,
  }: {
    onPlaceSelected: (place: unknown) => void;
    placeholder?: string;
    id: string;
  }) => (
    <input
      id={id}
      data-testid="address-autocomplete"
      placeholder={placeholder}
      onChange={(e) => {
        if (e.target.value === 'trigger-place') {
          onPlaceSelected({
            address_components: [
              { long_name: '2', short_name: '2', types: ['subpremise'] },
              { long_name: '456', short_name: '456', types: ['street_number'] },
              { long_name: 'Collins St', short_name: 'Collins St', types: ['route'] },
              { long_name: 'Melbourne', short_name: 'Melbourne', types: ['locality'] },
              { long_name: 'Victoria', short_name: 'VIC', types: ['administrative_area_level_1'] },
              { long_name: '3000', short_name: '3000', types: ['postal_code'] },
            ],
          });
        } else if (e.target.value === 'trigger-invalid') {
          onPlaceSelected(null);
        }
      }}
    />
  ),
}));

const emptyClient: ClientDetails = {
  name: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  abn: '',
  acn: '',
};

function Harness({
  initial = emptyClient,
  onChange,
}: {
  initial?: ClientDetails;
  onChange: (patch: Partial<ClientDetails>) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ClientDetailsForm
      value={value}
      onChange={(patch) => {
        onChange(patch);
        setValue((prev) => ({ ...prev, ...patch }));
      }}
    />
  );
}

describe('ClientDetailsForm', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('renders the client fields', () => {
    render(<Harness onChange={onChange} />);

    expect(screen.getByLabelText('Client name')).toBeInTheDocument();
    expect(screen.getByLabelText('ABN')).toBeInTheDocument();
    expect(screen.getByLabelText('ACN')).toBeInTheDocument();
    expect(screen.getByTestId('address-autocomplete')).toHaveAttribute(
      'placeholder',
      'Search an address…'
    );
  });

  it('sends only the field that changed and shows the name in the header', () => {
    render(<Harness onChange={onChange} />);
    expect(screen.getByText('Client details')).toBeInTheDocument();

    type('Client name', 'Client Corp');

    expect(onChange).toHaveBeenCalledWith({ name: 'Client Corp' });
    expect(screen.getByLabelText('Client name')).toHaveValue('Client Corp');
    expect(screen.getAllByText('Client Corp').length).toBeGreaterThan(0);
  });

  it('formats and checks the ABN and ACN', () => {
    render(<Harness onChange={onChange} />);

    type('ABN', '12345678901');
    type('ACN', '000000019');

    expect(screen.getByLabelText('ABN')).toHaveValue('12 345 678 901');
    expect(screen.getByText('Not a valid ABN')).toBeInTheDocument();
    expect(screen.getByLabelText('ACN')).toHaveValue('000 000 019');
    expect(screen.queryByText('Not a valid ACN')).not.toBeInTheDocument();
  });

  it('fills the address, unit number included, from a selected place', () => {
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByTestId('address-autocomplete'), {
      target: { value: 'trigger-place' },
    });

    expect(onChange).toHaveBeenCalledWith({
      street: '2/456 Collins St',
      suburb: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
    });

    fireEvent.click(screen.getByRole('button', { name: /enter address manually/i }));
    expect(screen.getByLabelText('Street')).toHaveValue('2/456 Collins St');
  });

  it('ignores a place without an address', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByTestId('address-autocomplete'), {
      target: { value: 'trigger-invalid' },
    });

    expect(onChange).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('edits the address by hand', () => {
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter address manually/i }));

    type('Street', '1 Smith St');
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'WA' } });
    type('Postcode', '6000x');

    expect(onChange).toHaveBeenCalledWith({ street: '1 Smith St' });
    expect(onChange).toHaveBeenCalledWith({ state: 'WA' });
    expect(screen.getByLabelText('Postcode')).toHaveValue('6000');
  });

  it('opens the manual fields when it starts with an address', () => {
    render(<Harness onChange={onChange} initial={{ ...emptyClient, suburb: 'Hobart' }} />);
    expect(screen.getByLabelText('Suburb')).toHaveValue('Hobart');
  });

  it('keeps the manual fields closed when it starts without one', () => {
    render(<Harness onChange={onChange} initial={{ ...emptyClient, name: 'No Address' }} />);
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
  });

  it('never touches the URL itself', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    render(<Harness onChange={onChange} />);
    type('Client name', 'Quiet');
    expect(replaceState).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });
});
