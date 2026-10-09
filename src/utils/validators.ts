const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const ACN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 1];

const digitsOf = (value: string): number[] => value.replace(/\D/g, '').split('').map(Number);

/** ATO check: subtract 1 from the first digit, weight and sum, divisible by 89. */
export const isValidAbn = (value: string): boolean => {
  const digits = digitsOf(value);
  if (digits.length !== 11) return false;
  digits[0] -= 1;
  return digits.reduce((sum, d, i) => sum + d * ABN_WEIGHTS[i], 0) % 89 === 0;
};

/** ASIC check: weighted sum of the first 8 digits, complement mod 10 is the 9th digit. */
export const isValidAcn = (value: string): boolean => {
  const digits = digitsOf(value);
  if (digits.length !== 9) return false;
  const sum = digits.slice(0, 8).reduce((acc, d, i) => acc + d * ACN_WEIGHTS[i], 0);
  return (10 - (sum % 10)) % 10 === digits[8];
};

/** Error text for an ABN/ACN field, or undefined while it is empty or still being typed. */
export const identifierError = (kind: 'abn' | 'acn', value: string): string | undefined => {
  const length = value.replace(/\D/g, '').length;
  if (kind === 'abn') {
    return length === 11 && !isValidAbn(value) ? 'Not a valid ABN' : undefined;
  }
  return length === 9 && !isValidAcn(value) ? 'Not a valid ACN' : undefined;
};
