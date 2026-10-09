import { useCallback, useState, type ChangeEvent } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import Field from './ui/Field';
import { I } from '../utils/icons';
import { AUSTRALIAN_STATES } from '../utils/constants';
import { parseAddressFromPlace, type NormalizedAddress } from '../utils/address';
import type { PlaceResult } from '../types';

interface AddressFieldsProps {
  /** Prefix for element ids, e.g. "business" gives "business-street". */
  idPrefix: string;
  value: NormalizedAddress;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAddressSelected: (address: NormalizedAddress) => void;
}

const hasAddress = ({ street, suburb, state, postcode }: NormalizedAddress): boolean =>
  Boolean(street || suburb || state || postcode);

/** Address search plus the manual street/suburb/state/postcode fields behind a toggle. */
export default function AddressFields({
  idPrefix,
  value,
  placeholder,
  onChange,
  onAddressSelected,
}: AddressFieldsProps) {
  // Open on load when the link already carries an address, so it can be checked.
  const [showManualFields, setShowManualFields] = useState(() => hasAddress(value));

  const handlePlaceSelected = useCallback(
    (place: PlaceResult) => {
      const address = parseAddressFromPlace(place);
      if (!address) {
        console.error('Place or address components not found:', place);
        return;
      }
      onAddressSelected(address);
    },
    [onAddressSelected]
  );

  return (
    <>
      <Field label="Address" htmlFor={`${idPrefix}-address`} span={9}>
        <div className="address-wrap">
          <AddressAutocomplete
            id={`${idPrefix}-address`}
            onPlaceSelected={handlePlaceSelected}
            placeholder={placeholder}
            className="input"
          />
        </div>
      </Field>
      <div className="field col-3 field--action">
        <button
          type="button"
          onClick={() => setShowManualFields((prev) => !prev)}
          className="btn ghost sm"
          aria-expanded={showManualFields}
          aria-label={showManualFields ? 'Hide manual entry' : 'Enter address manually'}
        >
          {showManualFields ? 'Hide manual' : 'Manual address'} {I.chev}
        </button>
      </div>
      {showManualFields && (
        <>
          <Field label="Street" htmlFor={`${idPrefix}-street`} span={8}>
            <input
              id={`${idPrefix}-street`}
              className="input"
              type="text"
              name="street"
              value={value.street}
              onChange={onChange}
            />
          </Field>
          <Field label="Suburb" htmlFor={`${idPrefix}-suburb`} span={5}>
            <input
              id={`${idPrefix}-suburb`}
              className="input"
              type="text"
              name="suburb"
              value={value.suburb}
              onChange={onChange}
            />
          </Field>
          <Field label="State" htmlFor={`${idPrefix}-state`} span={3}>
            <select
              id={`${idPrefix}-state`}
              className="select"
              name="state"
              value={value.state}
              onChange={onChange}
            >
              <option value=""></option>
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Postcode" htmlFor={`${idPrefix}-postcode`} span={4}>
            <input
              id={`${idPrefix}-postcode`}
              className="input mono"
              type="text"
              name="postcode"
              inputMode="numeric"
              value={value.postcode}
              onChange={onChange}
            />
          </Field>
        </>
      )}
    </>
  );
}
