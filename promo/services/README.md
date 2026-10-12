# Ролик «Услуги GO-WORK» (34 сек, 1080×1920, 60 fps)

Стиль по референсу: фиолетовый/белый, кинетическая типографика.
- `gw2.html` — анимация (`render(t)`), рендер как в `promo/README.md` с `N = 34 * FPS`.
- `sfx_gw2.py` — мягкие звуки + голос (`bism.wav`, `salam.wav` — Piper TTS, казахская модель issai-high, голос Iseke).
- Сборка: ffmpeg с `-af loudnorm=I=-20:TP=-1.5`.

## Версия с голосом Ali + кинематографичные SFX (ElevenLabs)

- `voice-ali/` — «Бисмиллях» (0.35 с) и «Ассаламу алейкум» (31.75 с), клон голоса Ali.
- `sfx-el/` — whoosh, liquid swoosh, pop, deep boom, shimmer, trash drop (ElevenLabs Sound Effects).
- `mix_ali.py` — микс: эффекты ~11–15 дБ тише голоса, под голосом приглушаются.

```bash
cd promo/services
for f in sfx-el/*.mp3 voice-ali/*.mp3; do ffmpeg -y -i $f -ar 48000 -ac 1 -c:a pcm_s16le ${f%.mp3}.wav; done
python3 mix_ali.py          # → gw2_ali.wav
ffmpeg -framerate 60 -i frames/f%04d.jpg -i gw2_ali.wav -c:v libx264 -crf 21 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-18:TP=-1.5:LRA=11 -shortest go-work-services-ali.mp4
```
