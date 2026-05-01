import { useState, useEffect, useCallback, useRef, memo, type ChangeEvent } from 'react';
import { formatABN, formatACN, formatBSB, formatPhoneNumber } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';
import Section from './ui/Section';
import Field from './ui/Field';
import { I } from '../utils/icons';
import type { BusinessDetails, PlaceResult } from '../types';

interface BusinessDetailsFormProps {
  onChange: (details: BusinessDetails) => void;
  value?: BusinessDetails;
}

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

const BusinessDetailsForm = memo(function BusinessDetailsForm({
  onChange,
  value,
}: BusinessDetailsFormProps) {
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(
    value || emptyBusinessDetails
  );
  const [showManualFields, setShowManualFields] = useState(false);
  const hasAppliedInitialValue = useRef(false);

  useEffect(() => {
    if (value) {
      setBusinessDetails(value);
      if (
        !hasAppliedInitialValue.current &&
        (value.street || value.suburb || value.state || value.postcode)
      ) {
        setShowManualFields(true);
      }
      hasAppliedInitialValue.current = true;
    }
  }, [value]);

  const handlePlaceSelected = useCallback(
    (place: PlaceResult) => {
      if (!place || !place.address_components) {
        console.error('Place or address components not found:', place);
        return;
      }

      interface AddressAccumulator {
        street_number?: string;
        route?: string;
        suburb?: string;
        state?: string;
        postcode?: string;
      }

      const addressComponents = place.address_components.reduce<AddressAccumulator>(
        (acc, component) => {
          const types = component.types;
          if (types.includes('street_number')) {
            acc.street_number = component.long_name;
          } else if (types.includes('route')) {
            acc.route = component.long_name;
          } else if (types.includes('locality')) {
            acc.suburb = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            acc.state = component.short_name;
          } else if (types.includes('postal_code')) {
            acc.postcode = component.long_name;
          }
          return acc;
        },
        {}
      );

      setBusinessDetails((prev) => {
        const next = {
          ...prev,
          street: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
          suburb: addressComponents.suburb || '',
          state: addressComponents.state || '',
          postcode: addressComponents.postcode || '',
        };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value: v } = e.target;
      let formattedValue = v;
      if (name === 'abn') {
        formattedValue = formatABN(v).slice(0, 14);
      } else if (name === 'acn') {
        formattedValue = formatACN(v).slice(0, 11);
      } else if (name === 'bsb') {
        formattedValue = formatBSB(v).slice(0, 7);
      } else if (name === 'postcode') {
        formattedValue = v.replace(/\D/g, '').slice(0, 4);
      } else if (name === 'phone') {
        formattedValue = formatPhoneNumber(v);
      }
      setBusinessDetails((prev) => {
        const next = { ...prev, [name]: formattedValue };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const toggleManualFields = useCallback(() => {
    setShowManualFields((prev) => !prev);
  }, []);

  const meta = businessDetails.abn ? `ABN ${businessDetails.abn}` : 'Your details';

  return (
    <Section n={1} title="Your business" meta={meta}>
      <div className="field-grid">
        <Field label="Business name" htmlFor="business-name" span={9}>
          <input
            id="business-name"
            className="input"
            type="text"
            name="name"
            value={businessDetails.name}
            onChange={handleChange}
          />
        </Field>
        <Field label="Phone" htmlFor="business-phone" span={3} compact>
          <input
            id="business-phone"
            className="input mono"
            type="text"
            name="phone"
            value={businessDetails.phone}
            onChange={handleChange}
          />
        </Field>
        <Field label="Email" htmlFor="business-email" span={6} compact>
          <input
            id="business-email"
            className="input"
            type="email"
            name="email"
            value={businessDetails.email}
            onChange={handleChange}
          />
        </Field>
        <Field label="ABN" htmlFor="business-abn" hint="11 digits" span={3} compact>
          <input
            id="business-abn"
            className="input mono"
            type="text"
            name="abn"
            value={businessDetails.abn}
            onChange={handleChange}
          />
        </Field>
        <Field label="ACN" htmlFor="business-acn" hint="optional" span={3} compact>
          <input
            id="business-acn"
            className="input mono"
            type="text"
            name="acn"
            value={businessDetails.acn}
            onChange={handleChange}
          />
        </Field>
        <Field label="Address" htmlFor="business-address" span={9}>
          <div className="address-wrap">
            <AddressAutocomplete
              id="business-address"
              onPlaceSelected={handlePlaceSelected}
              placeholder="Search an Australian address…"
              className="input"
            />
          </div>
        </Field>
        <div className="field col-3 field--action">
          <button
            type="button"
            onClick={toggleManualFields}
            className="btn ghost sm"
            aria-expanded={showManualFields}
            aria-label={showManualFields ? 'Hide manual entry' : 'Enter address manually'}
          >
            {showManualFields ? 'Hide manual' : 'Manual address'} {I.chev}
          </button>
        </div>
        {showManualFields && (
          <>
            <Field label="Street" htmlFor="business-street" span={8}>
              <input
                id="business-street"
                className="input"
                type="text"
                name="street"
                value={businessDetails.street}
                onChange={handleChange}
              />
            </Field>
            <Field label="Suburb" htmlFor="business-suburb" span={5}>
              <input
                id="business-suburb"
                className="input"
                type="text"
                name="suburb"
                value={businessDetails.suburb}
                onChange={handleChange}
              />
            </Field>
            <Field label="State" htmlFor="business-state" span={3}>
              <select
                id="business-state"
                className="select"
                name="state"
                value={businessDetails.state}
                onChange={handleChange}
              >
                <option value=""></option>
                {AUSTRALIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Postcode" htmlFor="business-postcode" span={4}>
              <input
                id="business-postcode"
                className="input mono"
                type="text"
                name="postcode"
                value={businessDetails.postcode}
                onChange={handleChange}
              />
            </Field>
          </>
        )}
      </div>
      <div className="divider" />
      <div className="field-grid">
        <Field label="Account name" htmlFor="business-accountName" span={6}>
          <input
            id="business-accountName"
            className="input"
            type="text"
            name="accountName"
            value={businessDetails.accountName}
            onChange={handleChange}
          />
        </Field>
        <Field label="BSB" htmlFor="business-bsb" span={2} compact>
          <input
            id="business-bsb"
            className="input mono"
            type="text"
            name="bsb"
            value={businessDetails.bsb}
            onChange={handleChange}
          />
        </Field>
        <Field label="Account number" htmlFor="business-accountNumber" span={4} compact>
          <input
            id="business-accountNumber"
            className="input mono"
            type="text"
            name="accountNumber"
            value={businessDetails.accountNumber}
            onChange={handleChange}
          />
        </Field>
      </div>
    </Section>
  );
});

export default BusinessDetailsForm;
