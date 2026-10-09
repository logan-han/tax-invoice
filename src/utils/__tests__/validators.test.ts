import { describe, it, expect } from 'vitest';
import { identifierError, isValidAbn, isValidAcn } from '../validators';

describe('isValidAbn', () => {
  it('accepts valid ABNs with or without spaces', () => {
    expect(isValidAbn('51 824 753 556')).toBe(true);
    expect(isValidAbn('51824753556')).toBe(true);
    expect(isValidAbn('53 004 085 616')).toBe(true);
  });

  it('rejects a wrong check sum', () => {
    expect(isValidAbn('12 345 678 901')).toBe(false);
    expect(isValidAbn('51 824 753 557')).toBe(false);
  });

  it('rejects the wrong number of digits', () => {
    expect(isValidAbn('51 824 753 55')).toBe(false);
    expect(isValidAbn('')).toBe(false);
  });
});

describe('isValidAcn', () => {
  it('accepts valid ACNs', () => {
    expect(isValidAcn('000 000 019')).toBe(true);
    expect(isValidAcn('005 499 981')).toBe(true);
    expect(isValidAcn('004085616')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(isValidAcn('000 000 018')).toBe(false);
    expect(isValidAcn('123 456 789')).toBe(false);
  });

  it('rejects the wrong number of digits', () => {
    expect(isValidAcn('000 000 01')).toBe(false);
  });
});

describe('identifierError', () => {
  it('stays quiet while the field is empty or still being typed', () => {
    expect(identifierError('abn', '')).toBeUndefined();
    expect(identifierError('abn', '12 345')).toBeUndefined();
    expect(identifierError('acn', '000 00')).toBeUndefined();
  });

  it('flags a complete number that fails its check', () => {
    expect(identifierError('abn', '12 345 678 901')).toBe('Not a valid ABN');
    expect(identifierError('acn', '123 456 789')).toBe('Not a valid ACN');
  });

  it('passes a complete valid number', () => {
    expect(identifierError('abn', '51 824 753 556')).toBeUndefined();
    expect(identifierError('acn', '000 000 019')).toBeUndefined();
  });
});
