# Промо-ролик go-work.kz (15 сек, 1080×1920, 60 fps)

- `reel.html` — вся анимация, покадрово (`render(t)`). Открыть в браузере с `?play` — живой предпросмотр.
- `render.mjs` — рендер кадров через Playwright: `node render.mjs` → папка `frames/`.
- Сборка видео:
  `ffmpeg -framerate 60 -i frames/f%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart go-work-reel.mp4`
