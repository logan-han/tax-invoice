import type { ChangeEvent } from 'react';
import Field from './ui/Field';
import { identifierError } from '../utils/validators';

interface IdentifierFieldProps {
  kind: 'abn' | 'acn';
  /** Prefix for the element id, e.g. "business" gives "business-abn". */
  idPrefix: string;
  value: string;
  hint?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** ABN or ACN input; a failed check digit replaces the hint and describes the input. */
export default function IdentifierField({
  kind,
  idPrefix,
  value,
  hint,
  onChange,
}: IdentifierFieldProps) {
  const id = `${idPrefix}-${kind}`;
  const error = identifierError(kind, value);

  return (
    <Field label={kind.toUpperCase()} htmlFor={id} hint={hint} error={error} span={3} compact>
      <input
        id={id}
        className="input mono"
        type="text"
        name={kind}
        inputMode="numeric"
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && `${id}-error`}
      />
    </Field>
  );
}
