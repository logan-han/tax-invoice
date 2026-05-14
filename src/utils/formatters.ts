export const formatABN = (value: string): string => {
  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return value;
};

export const formatACN = (value: string): string => {
  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return value;
};

export const formatBSB = (value: string): string => {
  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return value;
};

export const formatPhoneNumber = (value: string): string => {
  const cleaned = ('' + value).replace(/\D/g, '');
  if (value.startsWith('+')) {
    return value;
  }
  if (cleaned.startsWith('04')) {
    const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
  } else {
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
  }
  return value;
};

const FIELD_FORMATTERS: Record<string, (v: string) => string> = {
  abn: (v) => formatABN(v).slice(0, 14),
  acn: (v) => formatACN(v).slice(0, 11),
  bsb: (v) => formatBSB(v).slice(0, 7),
  postcode: (v) => v.replace(/\D/g, '').slice(0, 4),
  phone: (v) => formatPhoneNumber(v),
};

export const formatField = (name: string, value: string): string =>
  FIELD_FORMATTERS[name]?.(value) ?? value;
