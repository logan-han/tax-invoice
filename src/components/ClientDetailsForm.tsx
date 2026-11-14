import { useCallback, memo, type ChangeEvent } from 'react';
import { formatField } from '../utils/formatters';
import AddressFields from './AddressFields';
import IdentifierField from './IdentifierField';
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
        <IdentifierField kind="abn" idPrefix="client" value={value.abn} onChange={handleChange} />
        <IdentifierField
          kind="acn"
          idPrefix="client"
          hint="optional"
          value={value.acn}
          onChange={handleChange}
        />
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
