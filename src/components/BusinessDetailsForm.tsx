import { useCallback, memo, type ChangeEvent } from 'react';
import { formatField } from '../utils/formatters';
import { identifierError } from '../utils/validators';
import AddressFields from './AddressFields';
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

  const abnError = identifierError('abn', value.abn);
  const acnError = identifierError('acn', value.acn);
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
        <Field
          label="ABN"
          htmlFor="business-abn"
          hint="11 digits"
          error={abnError}
          span={3}
          compact
        >
          <input
            id="business-abn"
            className="input mono"
            type="text"
            name="abn"
            inputMode="numeric"
            value={value.abn}
            onChange={handleChange}
            aria-invalid={abnError ? true : undefined}
            aria-describedby={abnError && 'business-abn-error'}
          />
        </Field>
        <Field label="ACN" htmlFor="business-acn" hint="optional" error={acnError} span={3} compact>
          <input
            id="business-acn"
            className="input mono"
            type="text"
            name="acn"
            inputMode="numeric"
            value={value.acn}
            onChange={handleChange}
            aria-invalid={acnError ? true : undefined}
            aria-describedby={acnError && 'business-acn-error'}
          />
        </Field>
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
