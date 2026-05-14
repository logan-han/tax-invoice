import type { PlaceResult } from '../types';

export interface NormalizedAddress {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
}

export const parseAddressFromPlace = (
  place: PlaceResult | null | undefined
): NormalizedAddress | null => {
  if (!place || !place.address_components) return null;

  let streetNumber = '';
  let route = '';
  let suburb = '';
  let state = '';
  let postcode = '';

  for (const component of place.address_components) {
    const types = component.types;
    if (types.includes('street_number')) streetNumber = component.long_name;
    else if (types.includes('route')) route = component.long_name;
    else if (types.includes('locality')) suburb = component.long_name;
    else if (types.includes('administrative_area_level_1')) state = component.short_name;
    else if (types.includes('postal_code')) postcode = component.long_name;
  }

  return {
    street: `${streetNumber} ${route}`.trim(),
    suburb,
    state,
    postcode,
  };
};
