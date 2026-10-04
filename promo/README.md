# Промо-ролик go-work.kz (30 сек, 1080×1920, 60 fps, звуковой дизайн без музыки)

- `reel.html` — анимация покадрово: `render(realTime)`. Сюжет длится 15 с и растянут до 30 с картой времени `KEYS`
  (замедление + паузы), фоновое движение идёт в реальном времени. Открыть с `?play` — живой предпросмотр.
- `render.mjs` — рендер 1800 кадров через Playwright → `frames/`.
- `dumpmap.mjs` — выгружает карту времени в `map.json` (нужна для звука).
- `sfx.py` — синтез всех звуков (whoosh, удары, щелчки, клавиатура, уведомления, блики) на numpy → `sfx.wav`.
- Сборка:
  `ffmpeg -framerate 60 -i frames/f%04d.jpg -i sfx.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart go-work-reel.mp4`
