import { describe, it, expect } from 'vitest';
import { formatABN, formatACN, formatBSB, formatPhoneNumber } from '../formatters';

describe('formatABN', () => {
  it('formats a valid 11-digit ABN', () => {
    expect(formatABN('12345678901')).toBe('12 345 678 901');
  });

  it('returns the original value for invalid ABN', () => {
    expect(formatABN('123456789')).toBe('123456789');
    expect(formatABN('abc')).toBe('abc');
  });

  it('handles empty string', () => {
    expect(formatABN('')).toBe('');
  });
});

describe('formatACN', () => {
  it('formats a valid 9-digit ACN', () => {
    expect(formatACN('123456789')).toBe('123 456 789');
  });

  it('returns the original value for invalid ACN', () => {
    expect(formatACN('12345678')).toBe('12345678');
    expect(formatACN('abc')).toBe('abc');
  });

  it('handles empty string', () => {
    expect(formatACN('')).toBe('');
  });
});

describe('formatBSB', () => {
  it('formats a valid 6-digit BSB', () => {
    expect(formatBSB('123456')).toBe('123-456');
  });

  it('returns the original value for invalid BSB', () => {
    expect(formatBSB('12345')).toBe('12345');
    expect(formatBSB('abc')).toBe('abc');
  });

  it('handles empty string', () => {
    expect(formatBSB('')).toBe('');
  });
});

describe('formatPhoneNumber', () => {
  it('formats a mobile number starting with 04', () => {
    expect(formatPhoneNumber('0412345678')).toBe('0412 345 678');
  });

  it('formats a landline number', () => {
    expect(formatPhoneNumber('0212345678')).toBe('02 1234 5678');
  });

  it('returns international numbers as-is', () => {
    expect(formatPhoneNumber('+61412345678')).toBe('+61412345678');
  });

  it('returns invalid numbers as-is', () => {
    expect(formatPhoneNumber('123')).toBe('123');
  });

  it('handles empty string', () => {
    expect(formatPhoneNumber('')).toBe('');
  });

  it('returns partial mobile number starting with 04 as-is', () => {
    // Mobile number that starts with 04 but doesn't match full 10-digit pattern
    expect(formatPhoneNumber('041234')).toBe('041234');
    expect(formatPhoneNumber('04123456789')).toBe('04123456789'); // Too many digits
  });

  it('returns partial landline number as-is', () => {
    // Landline number that doesn't match full 10-digit pattern
    expect(formatPhoneNumber('021234')).toBe('021234');
    expect(formatPhoneNumber('02123456789')).toBe('02123456789'); // Too many digits
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhoneNumber('0412-345-678')).toBe('0412 345 678');
    expect(formatPhoneNumber('(02) 1234 5678')).toBe('02 1234 5678');
  });
});
