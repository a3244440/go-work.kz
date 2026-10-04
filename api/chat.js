// Vercel Serverless Function: POST /api/chat
// Нужна переменная окружения ANTHROPIC_API_KEY (Vercel → Settings → Environment Variables).
// Без ключа сайт продолжит работать — чат переключится на встроенные ответы.

const SYSTEM = `Ты — ИИ-ассистент GO-WORK.KZ (Алихан Сейилбек). Услуги: сайты и платформы с ИИ для бизнеса в Казахстане,
SEO-продвижение в Google и Яндекс, контекстная реклама (Яндекс.Директ, Google Ads), ИИ-чат-боты для сайта и WhatsApp.
Главное предложение — бесплатный аудит сайта за 24 часа в WhatsApp.
Правила: отвечай кратко (до 90 слов), дружелюбно, на языке клиента (русский или казахский).
Не называй конкретные цены и не обещай гарантированные позиции — говори, что точную оценку даст аудит.
Не выдумывай кейсы и цифры клиентов. Задавай уточняющий вопрос о нише и городе.
Когда уместно, мягко предлагай получить бесплатный аудит в WhatsApp.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI not configured' });

  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (!messages.length || messages[0].role !== 'user') return res.status(400).json({ error: 'Bad request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: 400,
        system: SYSTEM,
        messages,
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' });
    const data = await r.json();
    const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
