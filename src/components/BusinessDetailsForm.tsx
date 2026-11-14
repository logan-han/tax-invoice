import { useCallback, memo, type ChangeEvent } from 'react';
import { formatField } from '../utils/formatters';
import AddressFields from './AddressFields';
import IdentifierField from './IdentifierField';
import Section from './ui/Section';
import Field from './ui/Field';
import type { BusinessDetails } from '../types';

interface BusinessDetailsFormProps {
  value: BusinessDetails;
  /** Receives only the fields that changed. */
  onChange: (patch: Partial<BusinessDetails>) => void;
}

const BusinessDetailsForm = memo(function BusinessDetailsForm({
  value,
  onChange,
}: BusinessDetailsFormProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value: raw } = e.target;
      onChange({ [name]: formatField(name, raw) });
    },
    [onChange]
  );

  const meta = value.abn ? `ABN ${value.abn}` : 'Your details';

  return (
    <Section n={1} title="Your business" meta={meta}>
      <div className="field-grid">
        <Field label="Business name" htmlFor="business-name" span={9}>
          <input
            id="business-name"
            className="input"
            type="text"
            name="name"
            value={value.name}
            onChange={handleChange}
          />
        </Field>
        <Field label="Phone" htmlFor="business-phone" span={3} compact>
          <input
            id="business-phone"
            className="input mono"
            type="tel"
            name="phone"
            value={value.phone}
            onChange={handleChange}
          />
        </Field>
        <Field label="Email" htmlFor="business-email" span={6} compact>
          <input
            id="business-email"
            className="input"
            type="email"
            name="email"
            value={value.email}
            onChange={handleChange}
          />
        </Field>
        <IdentifierField
          kind="abn"
          idPrefix="business"
          hint="11 digits"
          value={value.abn}
          onChange={handleChange}
        />
        <IdentifierField
          kind="acn"
          idPrefix="business"
          hint="optional"
          value={value.acn}
          onChange={handleChange}
        />
        <AddressFields
          idPrefix="business"
          value={value}
          placeholder="Search an Australian address…"
          onChange={handleChange}
          onAddressSelected={onChange}
        />
      </div>
      <div className="divider" />
      <div className="field-grid">
        <Field label="Account name" htmlFor="business-accountName" span={6}>
          <input
            id="business-accountName"
            className="input"
            type="text"
            name="accountName"
            value={value.accountName}
            onChange={handleChange}
          />
        </Field>
        <Field label="BSB" htmlFor="business-bsb" span={2} compact>
          <input
            id="business-bsb"
            className="input mono"
            type="text"
            name="bsb"
            inputMode="numeric"
            value={value.bsb}
            onChange={handleChange}
          />
        </Field>
        <Field label="Account number" htmlFor="business-accountNumber" span={4} compact>
          <input
            id="business-accountNumber"
            className="input mono"
            type="text"
            name="accountNumber"
            inputMode="numeric"
            value={value.accountNumber}
            onChange={handleChange}
          />
        </Field>
      </div>
    </Section>
  );
});

export default BusinessDetailsForm;
