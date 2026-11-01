A website for visualizing Premodern matchup data in a more intuitive way.

https://data.duresscrew.com/

## Data

The data is pulled from both paper and online tournaments. Huge shout out to the Gatherling for making their API publicly available.

## Development

This project is built with Vite and React.
### Browser and responsive tests

Install dependencies and browser binaries with `npm ci` and `npx playwright install --with-deps` (omit `--with-deps` on macOS). Run `npm run test:e2e` to check interactions and responsive layouts. The suite intercepts analytics requests with deterministic fixture data, so it does not require the API. To smoke-test a deployed preview without comparing screenshots (hosting can add its own UI), run `PLAYWRIGHT_BASE_URL=https://your-preview.example npm run test:e2e -- --grep-invert "initial layout screenshot"`.

GitHub Actions runs Chromium at phone, tablet, laptop, and desktop sizes, plus desktop Firefox and WebKit. Chromium screenshots are compared to committed Linux baselines; failures upload the Playwright report and traces. To update screenshots consistently, use the pinned Playwright container version from `.github/workflows/e2e.yml`, run `npm ci` and `npx playwright test --update-snapshots`, and review the image diffs before committing them. Screenshots generated on other operating systems may differ because of font rendering.
