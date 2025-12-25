export interface BusinessDetails {
  name: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  abn: string;
  acn: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
}

export interface ClientDetails {
  name: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  abn: string;
  acn: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  gst: 'no' | 'add' | 'inclusive';
}

export interface InvoiceDetails {
  invoiceDate: string;
  invoiceNumber: string;
  dueDate: string;
  currency: string;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceResult {
  address_components?: AddressComponent[];
  geometry?: {
    location: google.maps.LatLng;
  };
}
