# Australian Tax Invoice Generator
![Build and Deploy](https://github.com/logan-han/tax-invoice/actions/workflows/build-and-test.yml/badge.svg?branch=main)
[![codecov](https://codecov.io/gh/logan-han/tax-invoice/graph/badge.svg?token=ubtPrCvIZU)](https://codecov.io/gh/logan-han/tax-invoice)

React based stateless web app generates Australian tax invoice in PDF.

While it's completely stateless, it updates the browser address bar to enable pre-fill via bookmark.

## Config

If you were to deploy your own version of this, update Google Maps API key in App.js

## Google Maps Places API Migration

This project has been updated to use the new `google.maps.places.PlaceAutocompleteElement` API instead of the deprecated `google.maps.places.Autocomplete` API. The migration was necessary due to Google's announcement that as of March 1st, 2025, `google.maps.places.Autocomplete` will not be available to new customers.

The migration involved:
1. Creating a new `PlaceAutocompleteElement` component that directly uses the Google Maps JavaScript API
2. Replacing the `@react-google-maps/api` package's `Autocomplete` component with our custom implementation
3. Updating the tests to work with the new component

For more information about the migration, see:
- [Google Maps Places Migration Overview](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
- [PlaceAutocompleteElement Documentation](https://developers.google.com/maps/documentation/javascript/reference/place-autocomplete-element)

## Try

https://invoice.han.life