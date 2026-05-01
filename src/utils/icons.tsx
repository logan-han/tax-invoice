import type { ReactElement } from 'react';

const svg = (d: string, stroke = 1.5): ReactElement => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
);

export const I = {
  plus: svg('M10 4v12M4 10h12'),
  x: svg('M5 5l10 10M15 5L5 15'),
  grip: svg('M8 5h.01M8 10h.01M8 15h.01M12 5h.01M12 10h.01M12 15h.01', 2.2),
  download: svg('M10 3v10m0 0l-4-4m4 4l4-4M4 17h12'),
  chev: svg('M5 8l5 5 5-5'),
  copy: svg('M7 7h8v10H7zM5 5h8v2M5 5v10h2'),
  check: svg('M4 10l4 4 8-8'),
  print: svg('M5 9V3h10v6M5 15H3v-4h14v4h-2M5 13h10v5H5z'),
};
