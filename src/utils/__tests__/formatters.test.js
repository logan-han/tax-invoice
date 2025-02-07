import { formatABN, formatACN, formatBSB } from '../formatters';

test('formats ABN correctly', () => {
    expect(formatABN('12345678901')).toBe('12 345 678 901');
    expect(formatABN('12 345 678 901')).toBe('12 345 678 901');
    expect(formatABN('1234')).toBe('1234');
});

test('formats ACN correctly', () => {
    expect(formatACN('123456789')).toBe('123 456 789');
    expect(formatACN('123 456 789')).toBe('123 456 789');
    expect(formatACN('1234')).toBe('1234');
});

test('formats BSB correctly', () => {
    expect(formatBSB('123456')).toBe('123-456');
    expect(formatBSB('123-456')).toBe('123-456');
    expect(formatBSB('1234')).toBe('1234');
});
