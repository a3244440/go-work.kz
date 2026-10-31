# Ролик «Сайт + SEO + GEO» (30 с, 1080×1920, 30 fps)

Стиль нового сайта: светло-серый фон, чёрные сцены, лаймовый и оранжевый акценты, шрифт Onest.
Сюжет: клиенты больше не гуглят, а спрашивают ИИ → чат с ИИ советует «Ваш бизнес» → то же в ChatGPT, Gemini, Claude →
Сайт + SEO + GEO → кейс ne-ti.kz (ТОП-3 Google) → бесплатный аудит в WhatsApp.

- `geo.html`: анимация, `render(t)`; `?play` для живого просмотра, `?t=8.5` для одного кадра.
- `render.cjs`: каждая сцена кодируется в `sceneN.mp4` (кадры идут в ffmpeg через pipe).
- `mix.py`: звук (SFX ElevenLabs из `../services/sfx-el`, голос Ali «Бисмиллях» и «Ассаламу алейкум», щелчки клавиатуры).

```bash
cd promo/geo
node render.cjs
mkdir -p wav && for f in ../services/sfx-el/*.mp3 ../services/voice-ali/bism2.mp3 ../services/voice-ali/salam2.mp3; do ffmpeg -y -i $f -ar 48000 -ac 1 -c:a pcm_s16le wav/$(basename ${f%.mp3}).wav; done
python3 mix.py
printf "file 'scene%d.mp4'\n" 0 1 2 3 4 5 > list.txt && ffmpeg -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -af loudnorm=I=-16:TP=-1.5:LRA=11 -shortest -movflags +faststart go-work-geo-reel.mp4
```
