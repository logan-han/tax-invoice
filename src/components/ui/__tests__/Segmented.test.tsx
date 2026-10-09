import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Segmented from '../Segmented';

type Mode = 'one' | 'two' | 'three';
const OPTIONS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
] as const;

const renderSegmented = (value: Mode = 'one', onChange = vi.fn()) => {
  const utils = render(
    <Segmented<Mode>
      value={value}
      options={OPTIONS}
      onChange={onChange}
      ariaLabel="Mode"
      name="mode"
    />
  );
  return { ...utils, onChange };
};

describe('Segmented', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all options with correct selected state', () => {
    renderSegmented('two');

    const group = screen.getByRole('radiogroup', { name: 'Mode' });
    expect(group).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveClass('on');
    expect(radios[1]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
  });

  it('exposes the option value and the name prop via data attributes', () => {
    renderSegmented();
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('data-value', 'one');
    expect(radios[0]).toHaveAttribute('data-name', 'mode');
  });

  it('calls onChange when an option is clicked', () => {
    const { onChange } = renderSegmented('one');
    fireEvent.click(screen.getByRole('radio', { name: 'Three' }));
    expect(onChange).toHaveBeenCalledWith('three');
  });

  it('ArrowRight moves focus to the next option and emits change', () => {
    const { onChange } = renderSegmented('one');
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('two');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('ArrowDown behaves the same as ArrowRight', () => {
    const { onChange } = renderSegmented('one');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('ArrowLeft wraps around to the last option', () => {
    const { onChange } = renderSegmented('one');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('three');
    expect(document.activeElement).toBe(radios[2]);
  });

  it('ArrowUp behaves the same as ArrowLeft', () => {
    const { onChange } = renderSegmented('two');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[1], { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledWith('one');
  });

  it('Home jumps to the first option', () => {
    const { onChange } = renderSegmented('three');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[2], { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('one');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('End jumps to the last option', () => {
    const { onChange } = renderSegmented('one');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('three');
    expect(document.activeElement).toBe(radios[2]);
  });

  it('ignores other keys', () => {
    const { onChange } = renderSegmented('one');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    fireEvent.keyDown(radios[0], { key: ' ' });
    fireEvent.keyDown(radios[0], { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('wraps ArrowRight from the last option back to the first', () => {
    const { onChange } = renderSegmented('three');
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('one');
    expect(document.activeElement).toBe(radios[0]);
  });
});
