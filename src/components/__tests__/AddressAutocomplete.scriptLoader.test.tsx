import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const SCRIPT_ID = 'google-maps-places-api';

const removeScript = () => {
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) existing.remove();
};

const loadComponent = async () => {
  const mod = await import('../AddressAutocomplete');
  return mod.default;
};

describe('AddressAutocomplete script loader', () => {
  beforeEach(() => {
    vi.resetModules();
    cleanup();
    removeScript();
    delete (window as unknown as { google?: unknown }).google;
  });

  afterEach(() => {
    cleanup();
    removeScript();
    delete (window as unknown as { google?: unknown }).google;
  });

  it('injects the Maps loader script on first mount', async () => {
    const AddressAutocomplete = await loadComponent();
    render(<AddressAutocomplete id="addr" onPlaceSelected={vi.fn()} />);

    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toContain('maps.googleapis.com/maps/api/js');
    expect(script?.src).toContain('libraries=places');
    expect(script?.async).toBe(true);
  });

  it('reuses an existing script tag instead of creating a second one', async () => {
    const preExisting = document.createElement('script');
    preExisting.id = SCRIPT_ID;
    preExisting.src = 'https://maps.googleapis.com/maps/api/js?key=x&libraries=places';
    document.head.appendChild(preExisting);

    const AddressAutocomplete = await loadComponent();
    render(<AddressAutocomplete id="addr" onPlaceSelected={vi.fn()} />);

    const scripts = document.querySelectorAll(`script#${SCRIPT_ID}`);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toBe(preExisting);
  });

  it('logs and recovers when the Maps loader script fails to load', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const AddressAutocomplete = await loadComponent();
    render(<AddressAutocomplete id="addr" onPlaceSelected={vi.fn()} />);

    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
    await act(async () => {
      script.dispatchEvent(new Event('error'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    const [err] = consoleSpy.mock.calls[0];
    expect((err as Error).message).toContain('Google Maps');
    consoleSpy.mockRestore();
  });
});
