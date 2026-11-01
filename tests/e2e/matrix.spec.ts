import { expect, test, type Page } from '@playwright/test'

const archetypes = ['Goblins', 'Sligh', 'Mono Blue Dreadnought', 'Elves', 'Enchantress', 'The Rock', 'Landstill', 'Replenish', 'Stasis', 'Survival Rock', 'Reanimator', 'Terrageddon']
const records = archetypes.map((archetype, i) => ({ archetype, wins: 200 - i * 5, losses: 100 + i, draws: 0, total_matches: 300 - i * 4, win_rate: 60 }))
const matrix = Object.fromEntries(archetypes.map((hero, i) => [hero, Object.fromEntries(archetypes.map((villain, j) => [villain, { wins: 40 + i, losses: 30 + j, draws: 0 }]))]))

async function mockApi(page: Page) {
  await page.route('**/analysis/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/archetype-matrix')) {
      await route.fulfill({ json: { archetypes, matrix, time_frame: url.searchParams.get('time_frame') || 'all_time', start_date: url.searchParams.get('start_date'), end_date: url.searchParams.get('end_date') } })
    } else if (url.pathname.endsWith('/win-loss-records')) {
      await route.fulfill({ json: records })
    } else {
      await route.abort()
    }
  })
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.locator('table')).toBeVisible()
})

test('matrix fits the viewport and scrolls to the final column', async ({ page }) => {
  const table = page.locator('table')
  const geometry = await table.evaluate(t => {
    const scroller = t.parentElement!
    scroller.scrollLeft = scroller.scrollWidth
    const last = t.querySelector('thead tr')!.lastElementChild!
    const background = scroller.querySelector<HTMLElement>('[aria-hidden="true"]')!
    return { pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, scrollWidth: scroller.scrollWidth, tableWidth: t.getBoundingClientRect().width, backgroundWidth: background.getBoundingClientRect().width, lastRight: last.getBoundingClientRect().right, scrollRight: scroller.getBoundingClientRect().right }
  })
  expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth)
  expect(Math.abs(geometry.scrollWidth - geometry.tableWidth)).toBeLessThanOrEqual(2)
  expect(geometry.backgroundWidth).toBeGreaterThanOrEqual(geometry.tableWidth - 1)
  expect(Math.abs(geometry.lastRight - geometry.scrollRight)).toBeLessThanOrEqual(3)
  await table.evaluate(t => { t.parentElement!.scrollLeft = 0; t.parentElement!.scrollTop = 400 })
  await expect(page.getByRole('columnheader', { name: 'Archetype' })).toBeVisible()
})

test('sort, filter and matrix view remain usable', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'phone' || testInfo.project.name === 'small-phone') await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await page.getByRole('button', { name: 'Sort', exact: true }).click()
  await page.getByText('A to Z', { exact: true }).click()
  await expect(page.locator('tbody tr').first().locator('td').first()).toContainText('Elves')
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await page.getByLabel('Select All').uncheck()
  await expect(page.getByText('No archetypes to show for the selected filters.')).toBeVisible()
  await page.getByLabel('Goblins', { exact: true }).check()
  await page.getByLabel('Sligh', { exact: true }).check()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.getByRole('button', { name: 'Display Options', exact: true }).click()
  await page.getByLabel('Filtered vs Filtered').check()
  await expect(page.locator('thead th')).toHaveCount(3)
})

test('time and venue changes request the selected filters', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'phone' || testInfo.project.name === 'small-phone') await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await page.getByRole('button', { name: 'Time Period', exact: true }).click()
  const timeRequest = page.waitForRequest(r => r.url().includes('/analysis/archetype-matrix') && r.url().includes('time_frame=3_months'))
  await page.getByLabel('3 Months').check()
  await timeRequest
  await expect(page.locator('h3')).toContainText('3 Months')
  await page.getByRole('button', { name: 'Venue', exact: true }).click()
  const venueRequest = page.waitForRequest(r => r.url().includes('/analysis/archetype-matrix') && r.url().includes('venues=PAPER'))
  await page.getByLabel('Paper', { exact: true }).check()
  await venueRequest
  await page.getByRole('button', { name: 'Percentage Filter', exact: true }).click()
  const frequencyRequest = page.waitForRequest(r => r.url().includes('/analysis/archetype-matrix') && r.url().includes('min_percentage=4'))
  await page.getByLabel('Minimum Frequency').fill('4')
  await frequencyRequest
  await page.getByLabel('Custom Range').check()
  await page.getByLabel('Start Date').fill('2024-01-01')
  const dateRequest = page.waitForRequest(r => r.url().includes('/analysis/archetype-matrix') && r.url().includes('start_date=2024-01-01') && r.url().includes('end_date=2024-12-31'))
  await page.getByLabel('End Date').fill('2024-12-31')
  await dateRequest
  await expect(page.locator('h3')).toContainText('Custom Range')
})

test('initial layout screenshot', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'firefox' || testInfo.project.name === 'webkit', 'Visual baselines use Chromium')
  await expect(page).toHaveScreenshot('matrix.png', { animations: 'disabled' })
})
