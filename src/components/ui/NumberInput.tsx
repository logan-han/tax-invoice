import { useState, type InputHTMLAttributes } from 'react';

interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value: number;
  onValueChange: (value: number) => void;
}

/** Number field that keeps what is typed ("", "7.") while focused instead of snapping to 0. */
export default function NumberInput({ value, onValueChange, onBlur, ...rest }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={draft ?? (value === 0 ? '' : String(value))}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = parseFloat(e.target.value);
        onValueChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
