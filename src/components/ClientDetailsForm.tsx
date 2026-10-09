import { useCallback, memo, type ChangeEvent } from 'react';
import { formatField } from '../utils/formatters';
import { identifierError } from '../utils/validators';
import AddressFields from './AddressFields';
import Section from './ui/Section';
import Field from './ui/Field';
import type { ClientDetails } from '../types';

interface ClientDetailsFormProps {
  value: ClientDetails;
  /** Receives only the fields that changed. */
  onChange: (patch: Partial<ClientDetails>) => void;
}

const ClientDetailsForm = memo(function ClientDetailsForm({
  value,
  onChange,
}: ClientDetailsFormProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value: raw } = e.target;
      onChange({ [name]: formatField(name, raw) });
    },
    [onChange]
  );

  const abnError = identifierError('abn', value.abn);
  const acnError = identifierError('acn', value.acn);

  return (
    <Section n={2} title="Bill to" meta={value.name || 'Client details'}>
      <div className="field-grid">
        <Field label="Client name" htmlFor="client-name" span={6}>
          <input
            id="client-name"
            className="input"
            type="text"
            name="name"
            value={value.name}
            onChange={handleChange}
          />
        </Field>
        <Field label="ABN" htmlFor="client-abn" error={abnError} span={3} compact>
          <input
            id="client-abn"
            className="input mono"
            type="text"
            name="abn"
            inputMode="numeric"
            value={value.abn}
            onChange={handleChange}
            aria-invalid={abnError ? true : undefined}
            aria-describedby={abnError && 'client-abn-error'}
          />
        </Field>
        <Field label="ACN" htmlFor="client-acn" hint="optional" error={acnError} span={3} compact>
          <input
            id="client-acn"
            className="input mono"
            type="text"
            name="acn"
            inputMode="numeric"
            value={value.acn}
            onChange={handleChange}
            aria-invalid={acnError ? true : undefined}
            aria-describedby={acnError && 'client-acn-error'}
          />
        </Field>
        <AddressFields
          idPrefix="client"
          value={value}
          placeholder="Search an address…"
          onChange={handleChange}
          onAddressSelected={onChange}
        />
      </div>
    </Section>
  );
});

export default ClientDetailsForm;
