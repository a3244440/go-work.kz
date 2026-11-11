import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const FPS = 60, N = Math.round(29.6 * FPS), W = 4;
fs.mkdirSync('frames', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
await Promise.all([...Array(W)].map(async (_, w) => {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + process.cwd() + '/price.html'); await p.waitForFunction(() => window.READY);
  for (let f = w; f < N; f += W) { await p.evaluate(t => render(t), f / FPS); await p.screenshot({ path: 'frames/f' + String(f).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 94 }); }
}));
console.log('done', N); await b.close();
