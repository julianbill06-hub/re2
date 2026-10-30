// node render.js <scene.html> <outdir> <startFrame> <endFrame> [frame,frame,...]
const { chromium } = require('playwright');
(async () => {
  const [html, out, a, b, list] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + html);
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
  const frames = list ? list.split(',').map(Number) : [...Array(+b - +a).keys()].map(i => i + +a);
  for (const f of frames) {
    await page.evaluate(t => window.setT(t), f / 30);
    await page.screenshot({ path: `${out}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await browser.close();
})();
