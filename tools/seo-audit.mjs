// Проверка SEO / GEO / AEO всех страниц сайта: node tools/seo-audit.mjs
// Ошибки (exit 1): нет title/description/canonical/H1, дубли title, битый JSON-LD, битые внутренние ссылки,
// страница не в sitemap, нет llms.txt. Предупреждения: длина title/description, нет короткого ответа или FAQ.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKIP = new Set(['node_modules', 'promo', '.git', 'tools', 'api', 'assets']);
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (f.name === 'index.html') files.push(p);
  }
})(ROOT);

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const errors = [], warns = [], titles = new Map();
const urlOf = (f) => '/' + path.relative(ROOT, path.dirname(f)).split(path.sep).filter(Boolean).map((x) => x + '/').join('');
let withAnswer = 0, withFaq = 0;

for (const f of files) {
  const url = urlOf(f), h = fs.readFileSync(f, 'utf8');
  const get = (re) => (h.match(re) || [])[1];
  const title = get(/<title>([^<]*)<\/title>/), desc = get(/<meta name="description" content="([^"]*)"/);
  if (!title) errors.push(`${url}: нет <title>`); else {
    if (titles.has(title)) errors.push(`${url}: title совпадает с ${titles.get(title)}`); titles.set(title, url);
    if (title.length > 75) warns.push(`${url}: длинный title (${title.length})`);
  }
  if (!desc) errors.push(`${url}: нет meta description`); else if (desc.length < 70 || desc.length > 190) warns.push(`${url}: description ${desc.length} символов`);
  if (!/<link rel="canonical"/.test(h)) errors.push(`${url}: нет canonical`);
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${url}: H1 на странице: ${h1}`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { errors.push(`${url}: битый JSON-LD`); }
  }
  if (/data-aeo/.test(h)) withAnswer++;
  if (/"FAQPage"/.test(h)) withFaq++;
  for (const m of h.matchAll(/href="(\/[^"#?]*)/g)) {
    const u = m[1];
    if (/\.(css|js|png|jpg|ico|webmanifest|svg|txt|xml|pdf)$/.test(u)) { if (!fs.existsSync(path.join(ROOT, u))) errors.push(`${url}: нет файла ${u}`); continue; }
    if (!fs.existsSync(path.join(ROOT, u, 'index.html')) && !fs.existsSync(path.join(ROOT, u))) errors.push(`${url}: битая ссылка ${u}`);
  }
  if (url !== '/' && !sitemap.includes(`https://go-work.kz${url}<`) && !/404/.test(url)) errors.push(`${url}: нет в sitemap.xml`);
}
for (const f of ['llms.txt', 'llms-full.txt', 'robots.txt']) if (!fs.existsSync(path.join(ROOT, f))) errors.push(`нет ${f}`);
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) if (!robots.includes(bot)) warns.push(`robots.txt: нет правила для ${bot}`);

const uniq = (a) => [...new Set(a)];
console.log(`Страниц: ${files.length} · с коротким ответом (AEO): ${withAnswer} · с FAQPage: ${withFaq}`);
if (warns.length) console.log(`\nПредупреждения (${warns.length}):\n` + uniq(warns).slice(0, 40).join('\n'));
if (errors.length) { console.log(`\nОшибки (${errors.length}):\n` + uniq(errors).slice(0, 60).join('\n')); process.exit(1); }
console.log('\nОшибок нет ✓');
