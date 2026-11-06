// Рендер эпизода в кадры и MP4.
//   node render.mjs ep01               → frames/ep01/*.jpg + ep01.mp4 (со звуком, если есть ep01.wav)
//   node render.mjs ep01 --stills 1,4,8 → stills/ep01_<t>.png (быстрая проверка кадров)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ep = process.argv[2] || 'ep01';
const si = process.argv.indexOf('--stills');
const FPS = 30, WORKERS = 4;
const b = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const open = async () => {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + join(DIR, ep + '.html'));
  await p.waitForFunction(() => window.READY);
  return p;
};

if (si > 0) {
  mkdirSync(join(DIR, 'stills'), { recursive: true });
  const p = await open();
  for (const t of process.argv[si + 1].split(',').map(Number)) {
    await p.evaluate(t => render(t), t);
    await p.screenshot({ path: join(DIR, 'stills', `${ep}_${t}.png`) });
  }
  await b.close();
  process.exit(0);
}

const pages = await Promise.all([...Array(WORKERS)].map(open));
const total = await pages[0].evaluate(() => window.TOTAL);
const scenes = await pages[0].evaluate(() => window.SCENES);
writeFileSync(join(DIR, ep + '.json'), JSON.stringify({ total, scenes }));
const N = Math.ceil(total * FPS), out = join(DIR, 'frames', ep);
mkdirSync(out, { recursive: true });
const t0 = Date.now();
await Promise.all(pages.map(async (p, w) => {
  for (let f = w; f < N; f += WORKERS) {
    await p.evaluate(t => render(t), f / FPS);
    await p.screenshot({ path: join(out, 'f' + String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 94 });
  }
}));
console.log('кадров:', N, 'за', ((Date.now() - t0) / 1000).toFixed(1), 'с');
await b.close();

const wav = join(DIR, ep + '.wav');
const args = ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(out, 'f%04d.jpg')];
if (existsSync(wav)) args.push('-i', wav, '-c:a', 'aac', '-b:a', '256k', '-shortest');
args.push('-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(DIR, ep + '.mp4'));
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('готово:', ep + '.mp4');
