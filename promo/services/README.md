# Ролик «Услуги GO-WORK» (34 сек, 1080×1920, 60 fps)

Стиль по референсу: фиолетовый/белый, кинетическая типографика.
- `gw2.html` — анимация (`render(t)`), рендер как в `promo/README.md` с `N = 34 * FPS`.
- `sfx_gw2.py` — мягкие звуки + голос (`bism.wav`, `salam.wav` — Piper TTS, казахская модель issai-high, голос Iseke).
- Сборка: ffmpeg с `-af loudnorm=I=-20:TP=-1.5`.
