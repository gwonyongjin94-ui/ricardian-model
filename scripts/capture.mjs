// Capture README screenshots and the demo GIF from a local dev server.
// Uses the locally installed Google Chrome (override with CHROME_PATH), so no browser download is needed.
//
//   npm run capture

import { writeFileSync, mkdirSync } from 'node:fs'
import gifenc from 'gifenc'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import { createServer } from 'vite'

// gifenc is CommonJS, so pull the named exports off the default import.
const { GIFEncoder, applyPalette, quantize } = gifenc

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = 'docs'
const PORT = 5199

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

mkdirSync(OUT, { recursive: true })
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })

async function open(lang, { width = 1440, height = 900, scale = 2 } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: 'light',
  })
  await context.addInitScript((l) => localStorage.setItem('ricardian-lang', l), lang)
  const page = await context.newPage()
  await page.goto(`http://localhost:${PORT}/`)
  await page.evaluate(() => document.fonts.ready)
  // Let the map zoom and the trade arrows settle.
  await sleep(1200)
  return page
}

const preset = async (page, id) => {
  await page.selectOption('header select', id)
  await sleep(900)
}

const clickText = (page, text) => page.getByRole('button', { name: text, exact: true }).click()

/** Set a range input's value the way a user drag would. */
const slide = (page, value) =>
  page.evaluate((v) => {
    const range = [...document.querySelectorAll('aside input[type=range]')].pop()
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(range, String(v))
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)

// 1. Main view, Korean and English.
{
  const page = await open('ko')
  await page.screenshot({ path: `${OUT}/screenshot-ko.png` })
  await page.locator('main > div').first().screenshot({ path: `${OUT}/charts-ko.png` })
  await page.locator('#learn-explain').screenshot({ path: `${OUT}/explanation-ko.png` })
  await page.context().close()
}
{
  const page = await open('en')
  await preset(page, 'korea-vietnam')
  await page.screenshot({ path: `${OUT}/screenshot-en.png` })
  await page.context().close()
}

// 2. Learn mode at the "what does A export?" quiz, answered.
{
  const page = await open('ko')
  await clickText(page, '🎓 학습 모드')
  for (let i = 0; i < 5; i++) {
    await clickText(page, '다음 →')
    await sleep(150)
  }
  await page.locator('[role=dialog]').getByRole('button', { name: /직물/ }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(1500)
  await page.screenshot({ path: `${OUT}/learn-mode-ko.png` })
  await page.context().close()
}

// 3. Demo GIF: switch countries, then sweep the world price by hand.
{
  const width = 1200
  const height = 830
  const page = await open('ko', { width, height, scale: 1 })
  const frames = []
  const grab = async (n = 1, gap = 0) => {
    for (let i = 0; i < n; i++) {
      frames.push(PNG.sync.read(await page.screenshot()).data)
      if (gap) await sleep(gap)
    }
  }

  await grab(6, 60)
  await page.selectOption('header select', 'korea-vietnam')
  await grab(14, 30)
  await grab(5, 60)
  await clickText(page, '직접 설정')
  await sleep(200)
  for (let v = 500; v <= 1000; v += 50) {
    await slide(page, v)
    await grab()
  }
  for (let v = 1000; v >= 0; v -= 50) {
    await slide(page, v)
    await grab()
  }
  for (let v = 0; v <= 500; v += 50) {
    await slide(page, v)
    await grab()
  }
  await clickText(page, '시장균형')
  await grab(6, 60)
  await page.context().close()

  // One palette for every frame keeps colours stable and the file small.
  const sample = new Uint8Array(frames.filter((_, i) => i % 6 === 0).flatMap((f) => [...f]))
  const palette = quantize(sample, 256)
  const gif = GIFEncoder()
  for (const rgba of frames) gif.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay: 90 })
  gif.finish()
  writeFileSync(`${OUT}/demo.gif`, gif.bytes())
  console.log(`demo.gif: ${frames.length} frames`)
}

await browser.close()
await server.close()
