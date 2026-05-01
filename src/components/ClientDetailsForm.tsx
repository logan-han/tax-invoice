import { useState, useEffect, useCallback, useRef, memo, type ChangeEvent } from 'react';
import { formatABN, formatACN } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';
import Section from './ui/Section';
import Field from './ui/Field';
import { I } from '../utils/icons';
import type { ClientDetails, PlaceResult } from '../types';

interface ClientDetailsFormProps {
  onChange: (details: ClientDetails) => void;
  value?: ClientDetails;
}

const emptyClientDetails: ClientDetails = {
  name: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  abn: '',
  acn: '',
};

const ClientDetailsForm = memo(function ClientDetailsForm({
  onChange,
  value,
}: ClientDetailsFormProps) {
  const [clientDetails, setClientDetails] = useState<ClientDetails>(value || emptyClientDetails);
  const [showManualFields, setShowManualFields] = useState(false);
  const hasAppliedInitialValue = useRef(false);

  useEffect(() => {
    if (value) {
      setClientDetails(value);
      if (
        !hasAppliedInitialValue.current &&
        (value.street || value.suburb || value.state || value.postcode)
      ) {
        setShowManualFields(true);
      }
      hasAppliedInitialValue.current = true;
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const details: ClientDetails = {
      name: queryParams.get('clientName') || '',
      street: queryParams.get('clientStreet') || '',
      suburb: queryParams.get('clientSuburb') || '',
      state: queryParams.get('clientState') || '',
      postcode: queryParams.get('clientPostcode') || '',
      abn: queryParams.get('clientAbn') || '',
      acn: queryParams.get('clientAcn') || '',
    };
    setClientDetails(details);
    if (details.street || details.suburb || details.state || details.postcode) {
      setShowManualFields(true);
    }
  }, [value]);

  const updateURL = useCallback((details: ClientDetails) => {
    const url = new URL(window.location.href);
    url.searchParams.set('clientName', details.name);
    url.searchParams.set('clientStreet', details.street);
    url.searchParams.set('clientSuburb', details.suburb);
    url.searchParams.set('clientState', details.state);
    url.searchParams.set('clientPostcode', details.postcode);
    url.searchParams.set('clientAbn', details.abn);
    url.searchParams.set('clientAcn', details.acn);
    window.history.replaceState({}, '', url);
  }, []);

  const emitChange = useCallback(
    (details: ClientDetails) => {
      if (!value) {
        updateURL(details);
      }
      onChange(details);
    },
    [onChange, updateURL, value]
  );

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

      setClientDetails((prev) => {
        const next = {
          ...prev,
          street: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
          suburb: addressComponents.suburb || '',
          state: addressComponents.state || '',
          postcode: addressComponents.postcode || '',
        };
        emitChange(next);
        return next;
      });
    },
    [emitChange]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'abn') {
      formattedValue = formatABN(value).slice(0, 14);
    } else if (name === 'acn') {
      formattedValue = formatACN(value).slice(0, 11);
    } else if (name === 'postcode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    setClientDetails((prev) => {
      const next = { ...prev, [name]: formattedValue };
      emitChange(next);
      return next;
    });
  }, [emitChange]);

  const toggleManualFields = useCallback(() => {
    setShowManualFields((prev) => !prev);
  }, []);

  return (
    <Section n={2} title="Bill to" meta={clientDetails.name || 'Client details'}>
      <div className="field-grid">
        <Field label="Client name" htmlFor="client-name" span={6}>
          <input
            id="client-name"
            className="input"
            type="text"
            name="name"
            value={clientDetails.name}
            onChange={handleChange}
          />
        </Field>
        <Field label="ABN" htmlFor="client-abn" span={3} compact>
          <input
            id="client-abn"
            className="input mono"
            type="text"
            name="abn"
            value={clientDetails.abn}
            onChange={handleChange}
          />
        </Field>
        <Field label="ACN" htmlFor="client-acn" hint="optional" span={3} compact>
          <input
            id="client-acn"
            className="input mono"
            type="text"
            name="acn"
            value={clientDetails.acn}
            onChange={handleChange}
          />
        </Field>
        <Field label="Address" htmlFor="client-address" span={9}>
          <div className="address-wrap">
            <AddressAutocomplete
              id="client-address"
              onPlaceSelected={handlePlaceSelected}
              placeholder="Search an address…"
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
            <Field label="Street" htmlFor="client-street" span={8}>
              <input
                id="client-street"
                className="input"
                type="text"
                name="street"
                value={clientDetails.street}
                onChange={handleChange}
              />
            </Field>
            <Field label="Suburb" htmlFor="client-suburb" span={5}>
              <input
                id="client-suburb"
                className="input"
                type="text"
                name="suburb"
                value={clientDetails.suburb}
                onChange={handleChange}
              />
            </Field>
            <Field label="State" htmlFor="client-state" span={3}>
              <select
                id="client-state"
                className="select"
                name="state"
                value={clientDetails.state}
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
            <Field label="Postcode" htmlFor="client-postcode" span={4}>
              <input
                id="client-postcode"
                className="input mono"
                type="text"
                name="postcode"
                value={clientDetails.postcode}
                onChange={handleChange}
              />
            </Field>
          </>
        )}
      </div>
    </Section>
  );
});

export default ClientDetailsForm;
