# Australian Tax Invoice Generator

![Build and Deploy](https://github.com/logan-han/tax-invoice/actions/workflows/build-and-test.yml/badge.svg?branch=main)
[![codecov](https://codecov.io/gh/logan-han/tax-invoice/graph/badge.svg?token=ubtPrCvIZU)](https://codecov.io/gh/logan-han/tax-invoice)

A stateless React app that makes Australian tax invoices and downloads them as PDF. Try it at
https://invoice.han.life.

Nothing is stored anywhere: the whole invoice lives in the page URL, so a bookmark or the
**Copy share link** button is the save file.

## Features

- Live A4 preview while you type, at several zoom levels.
- GST per line: added on top, included in the price, or GST-free. Totals are in whole cents and
  GST is rounded once per invoice, so subtotal + GST always equals the total.
- Titled "Tax Invoice" when any line carries GST, and "Invoice" when none does.
- ABN and ACN check-digit validation, and formatting for ABN, ACN, BSB and phone numbers.
- Australian address search (Google Places) that keeps unit numbers, plus manual entry.
- Decimal quantities (hours), drag-or-keyboard reordering, and currency symbols for non-AUD
  invoices.
- **Generate PDF** downloads an A4 PDF whose text can be searched and copied. **Print** gives
  the same layout through the browser, where "Save as PDF" makes a vector PDF.

## Privacy

The invoice, bank details included, is held in the URL's query string, so treat share links like
the invoice itself. Google Analytics only receives the page address without that query string
(campaign `utm_*` parameters aside).

## Development

Needs Node 24 (see `.nvmrc`).

```sh
npm ci
npm run dev          # http://localhost:3000
```

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm test`          | Unit tests (Vitest, run on Melbourne time) |
| `npm run test:e2e`  | Playwright end-to-end tests                |
| `npm run lint`      | ESLint                                     |
| `npm run typecheck` | TypeScript, app and config                 |
| `npm run format`    | Prettier                                   |
| `npm run build`     | Production build into `build/`             |

## Deploying your own copy

Address search uses a Google Maps browser key restricted by HTTP referrer, so the default key only
works on this site. Set `VITE_GOOGLE_MAPS_API_KEY` at build time to use your own key with the
Maps JavaScript API and Places API (New) enabled. Without a working key, manual address entry
still works.

`.github/workflows/build-and-test.yml` lints, tests and builds every push and pull request, and
on `main` syncs `build/` to an S3 bucket behind CloudFront using a GitHub OIDC role.
