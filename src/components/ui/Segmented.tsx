import { useRef, type KeyboardEvent } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
  name?: string;
}

export default function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  name,
}: SegmentedProps<T>) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusAt = (index: number) => {
    const wrapped = (index + options.length) % options.length;
    buttonsRef.current[wrapped]?.focus();
    onChange(options[wrapped].value);
  };

  const handleKey = (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAt(options.length - 1);
    }
  };

  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? 'on' : ''}
            data-value={opt.value}
            data-name={name}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKey(i)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
