import { chromium } from 'playwright';
const FPS = 60, N = 15 * FPS, W = 4;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
const t0 = Date.now();
await Promise.all([...Array(W)].map(async (_, w) => {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + process.cwd() + '/reel.html');
  await p.waitForFunction(() => window.READY);
  for (let f = w; f < N; f += W) {
    await p.evaluate(t => render(t), f / FPS);
    await p.screenshot({ path: 'frames/f' + String(f).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 96 });
  }
}));
console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
await b.close();
