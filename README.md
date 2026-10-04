# go-work.kz

Сайт-портфолио: сайты и платформы с ИИ, SEO в Google и Яндекс, контекстная реклама.

## Структура
- `index.html` — вся страница (hero, услуги, ИИ-чат, портфолио, этапы, FAQ, CTA)
- `assets/css/style.css` — дизайн и анимации
- `assets/js/main.js` — анимации, фильтр портфолио, ИИ-чат, ссылки WhatsApp
- `api/chat.js` — серверная функция ИИ (Vercel + Claude API)

## Что поменять
1. **Номер WhatsApp** — в `assets/js/main.js`, `CONFIG.whatsapp` (например `77011234567`).
2. **Портфолио** — карточки `<article class="work">` в `index.html`. Сейчас там концепты — замените на реальные проекты.

## Деплой (Vercel)
1. Импортируйте репозиторий на vercel.com → Framework: **Other**.
2. Settings → Environment Variables → `ANTHROPIC_API_KEY` (ключ с console.anthropic.com).
3. Settings → Domains → добавьте `go-work.kz` и пропишите DNS у регистратора
   (A-запись `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`).

Без ключа ИИ сайт тоже работает: чат отвечает встроенными ответами и ведёт в WhatsApp.

## Локально
```bash
python3 -m http.server 8000   # статика, чат — встроенные ответы
# или: npx vercel dev          # вместе с /api/chat
```

## SEO-страницы
Генерируются скриптом: `node tools/build-seo.mjs` (данные — `tools/data.mjs`).
- `/uslugi/` и 6 страниц услуг: сайты, ИИ, SEO Google, SEO Яндекс, Google Ads, Яндекс Директ
- 6 × 20 страниц «услуга + город» (`/uslugi/<услуга>/<город>/`)
- `/goroda/` и 20 страниц городов, `/audit/`
- `sitemap.xml` пересобирается автоматически
