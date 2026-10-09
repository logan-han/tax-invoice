import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  /** Replaces the hint; give the input aria-describedby={`${htmlFor}-error`}. */
  error?: string;
  children: ReactNode;
  span?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  compact?: boolean;
}

export default function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  span = 12,
  compact = false,
}: FieldProps) {
  return (
    <div className={`field col-${span}${compact ? ' field--compact' : ''}`}>
      <div className="field-label">
        <label htmlFor={htmlFor}>{label}</label>
        {error ? (
          <span className="field-hint field-hint--error" id={htmlFor && `${htmlFor}-error`}>
            {error}
          </span>
        ) : (
          hint && <span className="field-hint">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
