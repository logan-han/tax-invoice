import { describe, it, expect } from 'vitest';
import { parseAddressFromPlace } from '../address';

describe('parseAddressFromPlace', () => {
  it('returns null when the place is missing or has no address_components', () => {
    expect(parseAddressFromPlace(null)).toBeNull();
    expect(parseAddressFromPlace(undefined)).toBeNull();
    expect(parseAddressFromPlace({})).toBeNull();
  });

  it('joins street_number and route into the street field', () => {
    const result = parseAddressFromPlace({
      address_components: [
        { long_name: '42', short_name: '42', types: ['street_number'] },
        { long_name: 'George St', short_name: 'George St', types: ['route'] },
      ],
    });
    expect(result?.street).toBe('42 George St');
  });

  it('uses short_name for state and long_name for everything else', () => {
    const result = parseAddressFromPlace({
      address_components: [
        { long_name: 'Sydney', short_name: 'SYD', types: ['locality'] },
        {
          long_name: 'New South Wales',
          short_name: 'NSW',
          types: ['administrative_area_level_1'],
        },
        { long_name: '2000', short_name: '2000', types: ['postal_code'] },
      ],
    });
    expect(result).toEqual({
      street: '',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    });
  });

  it('handles partial addresses by leaving missing fields as empty strings', () => {
    const result = parseAddressFromPlace({
      address_components: [
        { long_name: '15', short_name: '15', types: ['street_number'] },
        { long_name: 'Main Rd', short_name: 'Main Rd', types: ['route'] },
      ],
    });
    expect(result).toEqual({
      street: '15 Main Rd',
      suburb: '',
      state: '',
      postcode: '',
    });
  });

  it('ignores component types it does not care about', () => {
    const result = parseAddressFromPlace({
      address_components: [
        { long_name: 'Australia', short_name: 'AU', types: ['country'] },
        { long_name: 'Sydney', short_name: 'SYD', types: ['locality'] },
      ],
    });
    expect(result?.suburb).toBe('Sydney');
    expect(result?.state).toBe('');
  });

  it('trims a lone street_number when there is no route', () => {
    const result = parseAddressFromPlace({
      address_components: [
        { long_name: '7', short_name: '7', types: ['street_number'] },
      ],
    });
    expect(result?.street).toBe('7');
  });
});
