// Рендер ролика: каждая сцена кодируется в свой mp4 (кадры идут в ffmpeg через pipe), потом склейка.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { renameSync } = require('node:fs');
(async () => {
const FPS = 30, W = 1080, H = 1920;
const SCENES = [[0, 3.5], [3.5, 10.2], [10.2, 14.8], [14.8, 20.8], [20.8, 25.6], [25.6, 30]];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto('file://' + process.cwd() + '/geo.html');
await p.evaluate(() => document.fonts.ready);
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : SCENES.map((_, i) => i);
for (const i of only) {
  const [a, z] = SCENES[i];
  const f0 = Math.round(a * FPS), f1 = Math.round(z * FPS);
  const tmp = `scene${i}.tmp.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await p.evaluate((t) => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg failed on scene ' + i);
  renameSync(tmp, `scene${i}.mp4`);
  console.log('scene', i, f1 - f0, 'frames');
}
await b.close();
})();
