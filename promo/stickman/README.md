# Stickman Shorts — мотивационные ролики-метафоры (1080×1920, 30 fps)

Светящиеся стикмены на чёрном фоне, одна метафора на сцену, синтезированный саундтрек.
Подробный гайд по стилю и API — в скилле `.claude/skills/stickman-shorts/SKILL.md`.

```bash
cd promo/stickman
node render.mjs ep01                 # кадры → ep01.mp4, ep01.json
python3 music.py ep01                # ep01.wav
ffmpeg -y -i ep01.mp4 -i ep01.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out.mp4 && mv out.mp4 ep01.mp4
```

Эпизоды:
- `ep01` «Начни сегодня»: Мечтать/Делать · Идеальный момент · Корни · Страх · 1% каждый день.
