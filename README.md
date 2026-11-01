A website for visualizing Premodern matchup data in a more intuitive way.

https://data.duresscrew.com/

## Data

The data is pulled from both paper and online tournaments. Huge shout out to the Gatherling for making their API publicly available.

## Development

This project is built with Vite and React.
### Browser and responsive tests

Install dependencies and browser binaries with `npm ci` and `npx playwright install --with-deps` (omit `--with-deps` on macOS). Run `npm run test:e2e` to check interactions and responsive layouts. The suite intercepts analytics requests with deterministic fixture data, so it does not require the API. To smoke-test a deployed preview without comparing screenshots (hosting can add its own UI), run `PLAYWRIGHT_BASE_URL=https://your-preview.example npm run test:e2e -- --grep-invert "initial layout screenshot"`.

GitHub Actions runs Chromium, Firefox, and WebKit at phone, tablet, laptop, and desktop viewport sizes. Screenshots from each browser are compared to their own committed Linux baselines; failures upload the Playwright report and traces.

For an intentional visual change, run `npm run test:e2e:update` with Docker running. It uses the same pinned Linux image as CI, installs dependencies in an isolated container, and updates changed snapshots in the checkout. Additional Playwright arguments can be passed after `--`, for example `npm run test:e2e:update -- --project=desktop`. Review the image diffs, then commit the snapshots with the change. The container uses Linux/amd64 to match GitHub's runner; on other architectures this requires Docker emulation.

Without Docker, run the **Generate browser snapshots** GitHub Actions workflow on the branch containing the changes. Download its `browser-snapshots` artifact, extract `browser-snapshots.tar.gz` from the repository root, review the image diffs, and commit the intended changes. The workflow never commits or pushes snapshots. It must first be present on the default branch to be manually dispatched. Screenshots generated directly on other operating systems may differ because of font rendering.
