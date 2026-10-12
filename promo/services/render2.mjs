import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const K = JSON.parse(fs.readFileSync('warp.json'));
const warp = r => { for (let i = 1; i < K.length; i++) if (r <= K[i][1]) { const [s0, r0] = K[i-1], [s1, r1] = K[i]; return s0 + (r - r0) / (r1 - r0) * (s1 - s0); } return K[K.length-1][0]; };
const FPS = 60, N = Math.round(48.6 * FPS), W = 4;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
const t0 = Date.now();
await Promise.all([...Array(W)].map(async (_, w) => {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + process.cwd() + '/gw2.html');
  await p.waitForFunction(() => window.READY);
  for (let f = w; f < N; f += W) {
    await p.evaluate(t => render(t), warp(f / FPS));
    await p.screenshot({ path: 'frames2/f' + String(f).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 96 });
  }
}));
console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
await b.close();
