import { useState, useEffect, useCallback, memo, type ChangeEvent } from 'react';
import '../styles.scss';
import { formatABN, formatACN, formatBSB, formatPhoneNumber } from '../utils/formatters';
import { AUSTRALIAN_STATES } from '../utils/constants';
import AddressAutocomplete from './AddressAutocomplete';
import type { BusinessDetails, PlaceResult } from '../types';

interface BusinessDetailsFormProps {
  onChange: (details: BusinessDetails) => void;
}

const BusinessDetailsForm = memo(function BusinessDetailsForm({
  onChange,
}: BusinessDetailsFormProps) {
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
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
  });

  const [showManualFields, setShowManualFields] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const details: BusinessDetails = {
      name: queryParams.get('businessName') || '',
      street: queryParams.get('businessStreet') || '',
      suburb: queryParams.get('businessSuburb') || '',
      state: queryParams.get('businessState') || '',
      postcode: queryParams.get('businessPostcode') || '',
      phone: queryParams.get('businessPhone') || '',
      email: queryParams.get('businessEmail') || '',
      abn: queryParams.get('businessAbn') || '',
      acn: queryParams.get('businessAcn') || '',
      accountName: queryParams.get('businessAccountName') || '',
      bsb: queryParams.get('businessBsb') || '',
      accountNumber: queryParams.get('businessAccountNumber') || '',
    };
    setBusinessDetails(details);

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

    setBusinessDetails((prevDetails) => ({
      ...prevDetails,
      street: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
      suburb: addressComponents.suburb || '',
      state: addressComponents.state || '',
      postcode: addressComponents.postcode || '',
    }));
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let formattedValue = value;
      if (name === 'abn') {
        formattedValue = formatABN(value).slice(0, 14);
      } else if (name === 'acn') {
        formattedValue = formatACN(value).slice(0, 11);
      } else if (name === 'bsb') {
        formattedValue = formatBSB(value).slice(0, 7);
      } else if (name === 'postcode') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
      } else if (name === 'phone') {
        formattedValue = formatPhoneNumber(value);
      }
      setBusinessDetails((prevDetails) => ({
        ...prevDetails,
        [name]: formattedValue,
      }));
    },
    []
  );

  useEffect(() => {
    updateURL(businessDetails);
    onChange(businessDetails);
  }, [businessDetails, onChange]);

  const updateURL = (details: BusinessDetails) => {
    const url = new URL(window.location.href);
    url.searchParams.set('businessName', details.name);
    url.searchParams.set('businessStreet', details.street);
    url.searchParams.set('businessSuburb', details.suburb);
    url.searchParams.set('businessState', details.state);
    url.searchParams.set('businessPostcode', details.postcode);
    url.searchParams.set('businessPhone', details.phone);
    url.searchParams.set('businessEmail', details.email);
    url.searchParams.set('businessAbn', details.abn);
    url.searchParams.set('businessAcn', details.acn);
    url.searchParams.set('businessAccountName', details.accountName);
    url.searchParams.set('businessBsb', details.bsb);
    url.searchParams.set('businessAccountNumber', details.accountNumber);
    window.history.replaceState({}, '', url);
  };

  const toggleManualFields = useCallback(() => {
    setShowManualFields((prev) => !prev);
  }, []);

  return (
    <div className="form-container">
      <h2>Your Business Details</h2>
      <form>
        <div className="group">
          <label htmlFor="business-name">Business Name</label>
          <input
            id="business-name"
            type="text"
            name="name"
            value={businessDetails.name}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="group">
          <label htmlFor="business-address">Address</label>
          <AddressAutocomplete
            id="business-address"
            onPlaceSelected={handlePlaceSelected}
            placeholder="Enter your business address"
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
              <label htmlFor="business-street">Street</label>
              <input
                id="business-street"
                type="text"
                name="street"
                value={businessDetails.street}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="row mb-3">
              <div className="group col-md-6">
                <label htmlFor="business-suburb">Suburb</label>
                <input
                  id="business-suburb"
                  type="text"
                  name="suburb"
                  value={businessDetails.suburb}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="group col-md-3">
                <label htmlFor="business-state">State</label>
                <select
                  id="business-state"
                  name="state"
                  value={businessDetails.state}
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
                <label htmlFor="business-postcode">Postcode</label>
                <input
                  id="business-postcode"
                  type="text"
                  name="postcode"
                  value={businessDetails.postcode}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          </>
        )}
        <div className="row mb-3">
          <div className="group col-md-6">
            <label htmlFor="business-phone">Phone</label>
            <input
              id="business-phone"
              type="text"
              name="phone"
              value={businessDetails.phone}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-6">
            <label htmlFor="business-email">Email</label>
            <input
              id="business-email"
              type="email"
              name="email"
              value={businessDetails.email}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="group col-md-6">
            <label htmlFor="business-abn">ABN</label>
            <input
              id="business-abn"
              type="text"
              name="abn"
              value={businessDetails.abn}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-6">
            <label htmlFor="business-acn">ACN</label>
            <input
              id="business-acn"
              type="text"
              name="acn"
              value={businessDetails.acn}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        <div className="row mb-3 ">
          <div className="group col-md-5">
            <label htmlFor="business-accountName">Account Name</label>
            <input
              id="business-accountName"
              type="text"
              name="accountName"
              value={businessDetails.accountName}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-3">
            <label htmlFor="business-bsb">BSB</label>
            <input
              id="business-bsb"
              type="text"
              name="bsb"
              value={businessDetails.bsb}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="group col-md-4">
            <label htmlFor="business-accountNumber">Account Number</label>
            <input
              id="business-accountNumber"
              type="text"
              name="accountNumber"
              value={businessDetails.accountNumber}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </form>
    </div>
  );
});

export default BusinessDetailsForm;
