import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BusinessDetailsForm from '../BusinessDetailsForm';
import type { BusinessDetails } from '../../types';

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
              { long_name: '123', short_name: '123', types: ['street_number'] },
              { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
              { long_name: 'Sydney', short_name: 'Sydney', types: ['locality'] },
              {
                long_name: 'New South Wales',
                short_name: 'NSW',
                types: ['administrative_area_level_1'],
              },
              { long_name: '2000', short_name: '2000', types: ['postal_code'] },
            ],
          });
        } else if (e.target.value === 'trigger-invalid') {
          onPlaceSelected(null);
        } else if (e.target.value === 'trigger-no-components') {
          onPlaceSelected({});
        }
      }}
    />
  ),
}));

const emptyBusiness: BusinessDetails = {
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

// Holds the value like App does, merging each patch the form sends.
function Harness({
  initial = emptyBusiness,
  onChange,
}: {
  initial?: BusinessDetails;
  onChange: (patch: Partial<BusinessDetails>) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <BusinessDetailsForm
      value={value}
      onChange={(patch) => {
        onChange(patch);
        setValue((prev) => ({ ...prev, ...patch }));
      }}
    />
  );
}

describe('BusinessDetailsForm', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('renders the form with all fields', () => {
    render(<Harness onChange={onChange} />);

    expect(screen.getByLabelText('Business name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('ABN')).toBeInTheDocument();
    expect(screen.getByLabelText('ACN')).toBeInTheDocument();
    expect(screen.getByLabelText('Account name')).toBeInTheDocument();
    expect(screen.getByLabelText('BSB')).toBeInTheDocument();
    expect(screen.getByLabelText('Account number')).toBeInTheDocument();
  });

  it('sends only the field that changed', () => {
    render(<Harness onChange={onChange} />);
    type('Business name', 'Acme Pty Ltd');

    expect(onChange).toHaveBeenCalledWith({ name: 'Acme Pty Ltd' });
    expect(screen.getByLabelText('Business name')).toHaveValue('Acme Pty Ltd');
  });

  it.each([
    ['ABN', '51824753556', '51 824 753 556'],
    ['ACN', '000000019', '000 000 019'],
    ['BSB', '063000', '063-000'],
    ['Phone', '0412345678', '0412 345 678'],
    ['Account number', '12345678', '12345678'],
  ])('formats %s as it is typed', (label, typed, shown) => {
    render(<Harness onChange={onChange} />);
    type(label, typed);
    expect(screen.getByLabelText(label)).toHaveValue(shown);
  });

  it('flags an ABN that fails the ATO check', () => {
    render(<Harness onChange={onChange} />);
    type('ABN', '12345678901');

    const abn = screen.getByLabelText('ABN');
    expect(screen.getByText('Not a valid ABN')).toBeInTheDocument();
    expect(abn).toHaveAttribute('aria-invalid', 'true');
    expect(abn).toHaveAccessibleDescription('Not a valid ABN');
  });

  it('accepts a valid ABN and keeps the digit hint', () => {
    render(<Harness onChange={onChange} />);
    type('ABN', '51824753556');

    expect(screen.queryByText('Not a valid ABN')).not.toBeInTheDocument();
    expect(screen.getByText('11 digits')).toBeInTheDocument();
    expect(screen.getByLabelText('ABN')).not.toHaveAttribute('aria-invalid');
  });

  it('flags an ACN that fails the ASIC check', () => {
    render(<Harness onChange={onChange} />);
    type('ACN', '123456789');
    expect(screen.getByText('Not a valid ACN')).toBeInTheDocument();
  });

  it('shows the ABN in the section header', () => {
    render(<Harness onChange={onChange} initial={{ ...emptyBusiness, abn: '51 824 753 556' }} />);
    expect(screen.getByText('ABN 51 824 753 556')).toBeInTheDocument();
  });

  it('shows and hides the manual address fields', () => {
    render(<Harness onChange={onChange} />);
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /enter address manually/i }));
    expect(screen.getByLabelText('Street')).toBeInTheDocument();
    expect(screen.getByLabelText('Suburb')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Postcode')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide manual entry/i }));
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
  });

  it('edits the address by hand', () => {
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter address manually/i }));

    type('Street', '1 George St');
    type('Suburb', 'Brisbane');
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'QLD' } });
    type('Postcode', '40001234');

    expect(onChange).toHaveBeenCalledWith({ street: '1 George St' });
    expect(onChange).toHaveBeenCalledWith({ suburb: 'Brisbane' });
    expect(onChange).toHaveBeenCalledWith({ state: 'QLD' });
    expect(screen.getByLabelText('Postcode')).toHaveValue('4000');
  });

  it('lists the Australian states and territories', () => {
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /enter address manually/i }));

    const options = Array.from(screen.getByLabelText('State').querySelectorAll('option'));
    expect(options.map((o) => o.value)).toEqual([
      '',
      'NSW',
      'VIC',
      'QLD',
      'WA',
      'SA',
      'TAS',
      'ACT',
      'NT',
    ]);
  });

  it('fills the address from a selected place without opening the manual fields', () => {
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByTestId('address-autocomplete'), {
      target: { value: 'trigger-place' },
    });

    expect(onChange).toHaveBeenCalledWith({
      street: '123 Main St',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    });
    expect(screen.queryByLabelText('Street')).not.toBeInTheDocument();
  });

  it.each(['trigger-invalid', 'trigger-no-components'])(
    'ignores a place without an address (%s)',
    (trigger) => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<Harness onChange={onChange} />);
      fireEvent.change(screen.getByTestId('address-autocomplete'), {
        target: { value: trigger },
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    }
  );

  it('shows the values it is given', () => {
    const { rerender } = render(
      <BusinessDetailsForm value={{ ...emptyBusiness, name: 'First' }} onChange={onChange} />
    );
    expect(screen.getByLabelText('Business name')).toHaveValue('First');

    rerender(
      <BusinessDetailsForm value={{ ...emptyBusiness, name: 'Second' }} onChange={onChange} />
    );
    expect(screen.getByLabelText('Business name')).toHaveValue('Second');
  });

  it('opens the manual fields when it starts with an address', () => {
    render(<Harness onChange={onChange} initial={{ ...emptyBusiness, street: '1 Test St' }} />);
    expect(screen.getByLabelText('Street')).toHaveValue('1 Test St');
  });
});
