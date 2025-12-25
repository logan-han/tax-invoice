import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AddressAutocomplete from '../AddressAutocomplete';

describe('AddressAutocomplete', () => {
  const mockOnPlaceSelected = vi.fn();
  let mockPlaceAutocomplete: HTMLElement & {
    id: string;
    setAttribute: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let eventHandlers: Record<string, (event: unknown) => void>;

  beforeEach(() => {
    mockOnPlaceSelected.mockClear();
    eventHandlers = {};
    // Create a real DOM element to act as the PlaceAutocompleteElement
    const element = document.createElement('div');
    // Store original setAttribute before overriding
    const originalSetAttribute = element.setAttribute.bind(element);
    mockPlaceAutocomplete = Object.assign(element, {
      id: '',
      setAttribute: vi.fn((name: string, value: string) => {
        originalSetAttribute(name, value);
      }),
      addEventListener: vi.fn((event: string, handler: (event: unknown) => void) => {
        eventHandlers[event] = handler;
      }),
    });
    // Mock Google Maps API to not initialize (simulate API not loaded)
    delete (window as unknown as { google?: unknown }).google;
  });

  afterEach(() => {
    delete (window as unknown as { google?: unknown }).google;
    // Clean up any style elements added during tests
    const styleElement = document.querySelector('style[data-gmp-autocomplete]');
    if (styleElement) {
      styleElement.remove();
    }
  });

  it('renders a container div with aria-label from placeholder', () => {
    render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
        placeholder="Enter address"
      />
    );

    const container = screen.getByLabelText('Enter address');
    expect(container).toBeInTheDocument();
  });

  it('uses default aria-label when no placeholder provided', () => {
    render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
      />
    );

    const container = screen.getByLabelText('Address autocomplete');
    expect(container).toBeInTheDocument();
  });

  it('applies className to container', () => {
    render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
        className="custom-class"
      />
    );

    const container = screen.getByLabelText('Address autocomplete');
    expect(container).toHaveClass('custom-class');
  });

  it('renders with correct styles', () => {
    render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
      />
    );

    const container = screen.getByLabelText('Address autocomplete');
    expect(container).toHaveStyle({ padding: '0px', border: 'none' });
  });

  it('accepts all required props', () => {
    const { container } = render(
      <AddressAutocomplete
        id="my-custom-id"
        onPlaceSelected={mockOnPlaceSelected}
        placeholder="Custom placeholder"
        className="test-class"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('updates callback ref when onPlaceSelected changes', () => {
    const newCallback = vi.fn();
    const { rerender } = render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
      />
    );

    rerender(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={newCallback}
      />
    );

    // Component should not error when callback changes
    expect(screen.getByLabelText('Address autocomplete')).toBeInTheDocument();
  });

  it('cleans up on unmount without errors', () => {
    const { unmount } = render(
      <AddressAutocomplete
        id="test-autocomplete"
        onPlaceSelected={mockOnPlaceSelected}
      />
    );

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  describe('Google Maps API integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Clear mock call history from previous tests
      mockPlaceAutocomplete.setAttribute.mockClear();
      mockPlaceAutocomplete.addEventListener.mockClear();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('initializes PlaceAutocompleteElement when Google Maps API is available', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);

      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
          placeholder="Enter address"
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockPlaceAutocompleteConstructor).toHaveBeenCalledWith({
        includedRegionCodes: ['au'],
      });
      expect(mockPlaceAutocomplete.setAttribute).toHaveBeenCalledWith('placeholder', 'Enter address');
    });

    it('does not set placeholder attribute when no placeholder provided', async () => {
      // Create a completely isolated mock for this test
      const isolatedElement = document.createElement('div');
      const isolatedSetAttribute = vi.fn();
      const isolatedMock = Object.assign(isolatedElement, {
        id: '',
        setAttribute: isolatedSetAttribute,
        addEventListener: vi.fn(),
      });
      const mockPlaceAutocompleteConstructor = vi.fn(() => isolatedMock);

      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(isolatedSetAttribute).not.toHaveBeenCalled();
    });

    it('retries initialization when Google Maps API is not yet loaded', async () => {
      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      // First attempt - API not loaded
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Now load the API
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      // Second attempt - API now loaded
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockPlaceAutocompleteConstructor).toHaveBeenCalled();
    });

    it('handles gmp-placeselect event with place data', async () => {
      const mockFetchFields = vi.fn().mockResolvedValue(undefined);
      const mockPlace = {
        fetchFields: mockFetchFields,
        addressComponents: [
          { longText: '123', shortText: '123', types: ['street_number'] },
          { longText: 'Main St', shortText: 'Main St', types: ['route'] },
          { longText: 'Sydney', shortText: 'Sydney', types: ['locality'] },
          { longText: 'New South Wales', shortText: 'NSW', types: ['administrative_area_level_1'] },
          { longText: '2000', shortText: '2000', types: ['postal_code'] },
        ],
        location: { lat: () => -33.8688, lng: () => 151.2093 },
      };

      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger the gmp-placeselect event
      await act(async () => {
        await eventHandlers['gmp-placeselect']({ place: mockPlace });
      });

      expect(mockFetchFields).toHaveBeenCalledWith({ fields: ['addressComponents', 'location'] });
      expect(mockOnPlaceSelected).toHaveBeenCalledWith({
        address_components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
          { long_name: 'Sydney', short_name: 'Sydney', types: ['locality'] },
          { long_name: 'New South Wales', short_name: 'NSW', types: ['administrative_area_level_1'] },
          { long_name: '2000', short_name: '2000', types: ['postal_code'] },
        ],
        geometry: {
          location: mockPlace.location,
        },
      });
    });

    it('handles gmp-placeselect event without place', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger event without place
      await act(async () => {
        await eventHandlers['gmp-placeselect']({ place: undefined });
      });

      expect(mockOnPlaceSelected).not.toHaveBeenCalled();
    });

    it('handles gmp-select event with placePrediction', async () => {
      const mockFetchFields = vi.fn().mockResolvedValue(undefined);
      const mockPlace = {
        fetchFields: mockFetchFields,
        addressComponents: [
          { longText: '456', shortText: '456', types: ['street_number'] },
        ],
        location: null,
      };
      const mockPlacePrediction = {
        toPlace: vi.fn(() => mockPlace),
      };

      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger the gmp-select event
      await act(async () => {
        await eventHandlers['gmp-select']({ placePrediction: mockPlacePrediction });
      });

      expect(mockPlacePrediction.toPlace).toHaveBeenCalled();
      expect(mockFetchFields).toHaveBeenCalled();
      expect(mockOnPlaceSelected).toHaveBeenCalledWith({
        address_components: [
          { long_name: '456', short_name: '456', types: ['street_number'] },
        ],
        geometry: undefined,
      });
    });

    it('handles gmp-select event without placePrediction', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger event without placePrediction
      await act(async () => {
        await eventHandlers['gmp-select']({ placePrediction: undefined });
      });

      expect(mockOnPlaceSelected).not.toHaveBeenCalled();
    });

    it('handles gmp-select event with placePrediction without toPlace function', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger event with placePrediction but no toPlace function
      await act(async () => {
        await eventHandlers['gmp-select']({ placePrediction: {} });
      });

      expect(mockOnPlaceSelected).not.toHaveBeenCalled();
    });

    it('handles error during place fetchFields', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockFetchFields = vi.fn().mockRejectedValue(new Error('Fetch error'));
      const mockPlace = {
        fetchFields: mockFetchFields,
        addressComponents: [],
        location: null,
      };

      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Trigger the event with a place that will error
      await act(async () => {
        await eventHandlers['gmp-placeselect']({ place: mockPlace });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching place details:', expect.any(Error));
      expect(mockOnPlaceSelected).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles place without addressComponents', async () => {
      const mockFetchFields = vi.fn().mockResolvedValue(undefined);
      const mockPlace = {
        fetchFields: mockFetchFields,
        addressComponents: undefined,
        location: { lat: () => -33.8688, lng: () => 151.2093 },
      };

      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        await eventHandlers['gmp-placeselect']({ place: mockPlace });
      });

      expect(mockOnPlaceSelected).toHaveBeenCalledWith({
        address_components: [],
        geometry: {
          location: mockPlace.location,
        },
      });
    });

    it('adds autocomplete style to document head', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const styleElement = document.querySelector('style[data-gmp-autocomplete]');
      expect(styleElement).toBeInTheDocument();
    });

    it('does not add duplicate styles', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      render(
        <AddressAutocomplete
          id="test-autocomplete-1"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Create another real DOM element for second instance
      const element2 = document.createElement('div');
      const mockPlaceAutocomplete2 = Object.assign(element2, {
        id: '',
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
      });
      mockPlaceAutocompleteConstructor.mockReturnValue(mockPlaceAutocomplete2);

      render(
        <AddressAutocomplete
          id="test-autocomplete-2"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const styleElements = document.querySelectorAll('style[data-gmp-autocomplete]');
      expect(styleElements.length).toBe(1);
    });

    it('cleans up autocomplete element on unmount', async () => {
      const mockPlaceAutocompleteConstructor = vi.fn(() => mockPlaceAutocomplete);
      (window as unknown as { google: unknown }).google = {
        maps: {
          places: {
            PlaceAutocompleteElement: mockPlaceAutocompleteConstructor,
          },
        },
      };

      const { unmount } = render(
        <AddressAutocomplete
          id="test-autocomplete"
          onPlaceSelected={mockOnPlaceSelected}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const container = screen.getByLabelText('Address autocomplete');
      expect(container.innerHTML).not.toBe('');

      unmount();

      // Container should be cleaned up (unmounted)
      expect(screen.queryByLabelText('Address autocomplete')).not.toBeInTheDocument();
    });
  });
});
