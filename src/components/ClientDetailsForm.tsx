import { useState, useEffect, useCallback, memo, type ChangeEvent } from 'react';
import '../styles.scss';
import { formatABN, formatACN } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';
import type { ClientDetails, PlaceResult } from '../types';

interface ClientDetailsFormProps {
  onChange: (details: ClientDetails) => void;
}

const ClientDetailsForm = memo(function ClientDetailsForm({ onChange }: ClientDetailsFormProps) {
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
    abn: '',
    acn: '',
  });

  const [showManualFields, setShowManualFields] = useState(false);

  useEffect(() => {
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
  }, []);

  const handlePlaceSelected = useCallback((place: PlaceResult) => {
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

    setClientDetails((prevDetails) => ({
      ...prevDetails,
      street: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
      suburb: addressComponents.suburb || '',
      state: addressComponents.state || '',
      postcode: addressComponents.postcode || '',
    }));
  }, []);

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
    setClientDetails((prevDetails) => ({
      ...prevDetails,
      [name]: formattedValue,
    }));
  }, []);

  useEffect(() => {
    updateURL(clientDetails);
    onChange(clientDetails);
  }, [clientDetails, onChange]);

  const updateURL = (details: ClientDetails) => {
    const url = new URL(window.location.href);
    url.searchParams.set('clientName', details.name);
    url.searchParams.set('clientStreet', details.street);
    url.searchParams.set('clientSuburb', details.suburb);
    url.searchParams.set('clientState', details.state);
    url.searchParams.set('clientPostcode', details.postcode);
    url.searchParams.set('clientAbn', details.abn);
    url.searchParams.set('clientAcn', details.acn);
    window.history.replaceState({}, '', url);
  };

  const toggleManualFields = useCallback(() => {
    setShowManualFields((prev) => !prev);
  }, []);

  return (
    <div className="form-container">
      <h2>Client Details</h2>
      <form>
        <div className="group">
          <label htmlFor="client-name">Client Name</label>
          <input
            id="client-name"
            type="text"
            name="name"
            value={clientDetails.name}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="group">
          <label htmlFor="client-address">Address</label>
          <AddressAutocomplete
            id="client-address"
            onPlaceSelected={handlePlaceSelected}
            placeholder="Enter the client address"
            className="form-control"
          />
        </div>
        <button
          type="button"
          onClick={toggleManualFields}
          className="btn btn-primary mb-3"
          aria-expanded={showManualFields}
        >
          {showManualFields ? 'Hide Manual Entry' : 'Enter Manually'}
        </button>
        {showManualFields && (
          <>
            <div className="group">
              <label htmlFor="client-street">Street</label>
              <input
                id="client-street"
                type="text"
                name="street"
                value={clientDetails.street}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="row mb-3">
              <div className="group col-md-6">
                <label htmlFor="client-suburb">Suburb</label>
                <input
                  id="client-suburb"
                  type="text"
                  name="suburb"
                  value={clientDetails.suburb}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="group col-md-3">
                <label htmlFor="client-state">State</label>
                <select
                  id="client-state"
                  name="state"
                  value={clientDetails.state}
                  onChange={handleChange}
                  className="form-control form-control-lg text-center"
                >
                  <option value=""></option>
                  {AUSTRALIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="group col-md-3">
                <label htmlFor="client-postcode">Postcode</label>
                <input
                  id="client-postcode"
                  type="text"
                  name="postcode"
                  value={clientDetails.postcode}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          </>
        )}
        <div className="row mb-3">
          <div className="group col-md-6">
            <label htmlFor="client-abn">ABN</label>
            <input
              id="client-abn"
              type="text"
              name="abn"
              value={clientDetails.abn}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-6">
            <label htmlFor="client-acn">ACN</label>
            <input
              id="client-acn"
              type="text"
              name="acn"
              value={clientDetails.acn}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </form>
    </div>
  );
});

export default ClientDetailsForm;
