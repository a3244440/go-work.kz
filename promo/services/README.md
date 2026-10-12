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

## Версия с полной озвучкой Ali (~48.6 с)

Фразы голоса длиннее исходных сцен, поэтому анимация растянута по времени: `warp.json` — опорные точки
(время сюжета gw2.html → реальное время). `render2.mjs` рендерит кадры в `frames2/`, `mix_vo.py` сводит
голос (`voice-ali/l1…l7`, `bism2`, `salam2`) и SFX, события которых переводятся через тот же warp.

```bash
node render2.mjs
mkdir -p voc && for f in voice-ali/*.mp3; do b=$(basename ${f%.mp3}); ffmpeg -y -i $f -af "highpass=f=85,highpass=f=85" -ar 48000 -ac 1 -c:a pcm_s16le voc/$b.wav; done
python3 mix_vo.py   # → gw2_vo.wav
ffmpeg -framerate 60 -i frames2/f%04d.jpg -i gw2_vo.wav -c:v libx264 -crf 21 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-16:TP=-1.5:LRA=11 -shortest go-work-services-voiceover.mp4
```

## Версия с голосом Ali v4 одним дублем (~39.8 с)

`voice-ali/ali_v4_full.mp3` — вся озвучка одним файлом (ElevenLabs v4). `mix_user.py` режет её по паузам
между фразами и ставит каждую фразу на свою сцену; анимация растянута по `warp_u.json` (`render3.mjs` → `frames3/`).

`mix_user2.py` — дубль 2 (`voice-ali/ali_v4_full_2.mp3`), без реверба на голосе и с EQ для чёткости:
```bash
ffmpeg -i voice-ali/ali_v4_full_2.mp3 -af "highpass=f=90,equalizer=f=220:t=q:w=1.0:g=-4,equalizer=f=450:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.0:g=3.5,highshelf=f=7500:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=2" -ar 48000 -ac 1 voc/ali_v4_full_2_clean.wav
```
