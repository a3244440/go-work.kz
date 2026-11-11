import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const ts = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/price.html'); await p.waitForFunction(() => window.READY);
for (const t of ts) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `/tmp/claude-0/-home-user-go-work-kz/026390ad-f798-55f0-b08d-425bc9a92ae6/scratchpad/pz_${t}.jpg`, type: 'jpeg', quality: 80 }); }
await b.close();
