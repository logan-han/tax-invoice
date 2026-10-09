export const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

export type AustralianState = (typeof AUSTRALIAN_STATES)[number];

export const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'NZD', 'CNY', 'INR', 'SGD'];

export const DEFAULT_PAYMENT_TERMS_DAYS = 30;
