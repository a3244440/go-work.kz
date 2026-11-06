/* Stickman engine — минималистичные мотивационные ролики: светящиеся стикмены на чёрном фоне.
   Классический скрипт (без модулей), чтобы работать по file:// в Playwright.
   Всё рисуется детерминированно функцией от времени: render(t). */
(function () {
  const W = 1080, H = 1920;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    lin: t => t,
    in: t => t * t * t,
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  // прогресс 0..1 на отрезке [a,b] с плавностью
  const seg = (t, a, b, e = E.inOut) => e(clamp((t - a) / (b - a)));
  // детерминированный шум
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- цвет ---------- */
  function rgb(c) {
    if (Array.isArray(c)) return c;
    const h = c.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const mixC = (a, b, t) => { a = rgb(a); b = rgb(b); return [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], t))); };
  const css = (c, a = 1) => { c = rgb(c); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const shade = (c, k) => mixC(c, [0, 0, 0], k);

  const PAL = { white: '#f4f4f4', grey: '#8a8a8a', gold: '#f2a516', red: '#e5261f', green: '#2fd04d', dim: '#3a3a3a' };

  /* ---------- позы ----------
     Углы в радианах от вертикали вниз, «+» — вперёд (туда, куда смотрит фигура).
     lean — наклон корпуса, head — наклон головы (− вверх/назад),
     aN/aF — плечо ближней/дальней руки, fN/fF — сгиб локтя (+ вперёд),
     tN/tF — бедро, kN/kF — сгиб колена (+ голень назад), hip — высота таза над землёй (в ростах), если не задана — ставим на ногу. */
  const POSE = {
    stand: { lean: 0, head: 0, aN: .1, fN: .12, aF: -.08, fF: .12, tN: .04, kN: .02, tF: -.04, kF: .02 },
    slump: { lean: .32, head: .45, aN: .3, fN: .05, aF: .22, fF: .05, tN: .1, kN: .2, tF: -.02, kF: .18 },
    lookUp: { lean: -.12, head: -.55, aN: .05, fN: .1, aF: -.1, fF: .1, tN: .05, kN: .03, tF: -.05, kF: .03 },
    lookDown: { lean: .18, head: .55, aN: .15, fN: .2, aF: .05, fF: .2, tN: .02, kN: .05, tF: -.03, kF: .05 },
    scared: { lean: -.25, head: .35, aN: .7, fN: 1.3, aF: .5, fF: 1.4, tN: -.2, kN: .25, tF: -.35, kF: .3 },
    sitHug: { lean: .18, head: .55, aN: .45, fN: 1.0, aF: .35, fF: 1.1, tN: 2.6, kN: 2.25, tF: 2.5, kF: 2.1, hip: .02 },
    sitLook: { lean: -.2, head: -.55, aN: -.55, fN: .15, aF: -.7, fF: .15, tN: 2.45, kN: 1.9, tF: 2.25, kF: 1.75, hip: .02 },
    crouch: { lean: .45, head: -.1, aN: -.5, fN: .4, aF: -.4, fF: .4, tN: 1.0, kN: 1.7, tF: .8, kF: 1.6 },
    jump: { lean: .2, head: -.1, aN: 2.4, fN: .2, aF: 2.2, fF: .2, tN: .5, kN: 1.2, tF: -.1, kF: .5 },
    reach: { lean: -.08, head: -.6, aN: 3.0, fN: 0, aF: .2, fF: .2, tN: .04, kN: 0, tF: -.06, kF: 0 },
    cheer: { lean: -.06, head: -.25, aN: 2.7, fN: .1, aF: -2.7, fF: -.1, tN: .15, kN: 0, tF: -.15, kF: 0 },
    water: { lean: .08, head: .35, aN: 1.15, fN: .15, aF: .2, fF: .3, tN: .06, kN: .03, tF: -.06, kF: .03 },
    lookBackUp: { lean: -.28, head: -.75, aN: .3, fN: .5, aF: -.25, fF: .4, tN: -.12, kN: .1, tF: .2, kF: .08 },
  };
  const KEYS = Object.keys(POSE.stand);
  // смешивание поз; hip смешивается через вес hipW (0 — стоит на ногах, 1 — таз на заданной высоте)
  function mix(p, q, t) {
    const o = {};
    for (const k of KEYS) o[k] = lerp(p[k] ?? POSE.stand[k], q[k] ?? POSE.stand[k], t);
    const wa = p.hip !== undefined ? (p.hipW ?? 1) : 0, wb = q.hip !== undefined ? (q.hipW ?? 1) : 0;
    if (wa || wb) { o.hip = lerp(p.hip ?? q.hip, q.hip ?? p.hip, t); o.hipW = lerp(wa, wb, t); }
    return o;
  }
  // цикл ходьбы/бега, ph — фаза в радианах
  function walk(ph, amp = 1, run = 0) {
    const s = Math.sin(ph), c = Math.cos(ph);
    const A = (.42 + run * .25) * amp;
    return {
      lean: .05 + run * .3, head: -.05 * run,
      tN: s * A, tF: -s * A,
      kN: .12 + Math.max(0, c) * (.55 + run * .8) * amp, kF: .12 + Math.max(0, -c) * (.55 + run * .8) * amp,
      aN: -s * A * (.8 + run * .6), aF: s * A * (.8 + run * .6),
      fN: .3 + run * 1.0, fF: .3 + run * 1.0,
    };
  }

  /* ---------- фигура ---------- */
  const B = { head: .08, neck: .025, torso: .3, thigh: .235, shin: .235, upper: .165, fore: .155, limb: .055, torsoW: .088 };

  function joints(p, s, dir) {
    const v = (a, L) => [Math.sin(a) * L * dir * s, Math.cos(a) * L * s]; // вниз по углу
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
    const hip = [0, 0];
    const top = [Math.sin(p.lean) * B.torso * dir * s, -Math.cos(p.lean) * B.torso * s];
    const sh = [top[0] * .9, top[1] * .9];
    const ha = p.lean + p.head;
    const headC = add(top, [Math.sin(ha) * (B.neck + B.head) * dir * s, -Math.cos(ha) * (B.neck + B.head) * s]);
    const kneeN = add(hip, v(p.tN, B.thigh)), footN = add(kneeN, v(p.tN - p.kN, B.shin));
    const kneeF = add(hip, v(p.tF, B.thigh)), footF = add(kneeF, v(p.tF - p.kF, B.shin));
    const elN = add(sh, v(p.aN, B.upper)), handN = add(elN, v(p.aN + p.fN, B.fore));
    const elF = add(sh, v(p.aF, B.upper)), handF = add(elF, v(p.aF + p.fF, B.fore));
    return { hip, top, sh, headC, kneeN, footN, kneeF, footF, elN, handN, elF, handF };
  }

  /* fig(ctx, {x, y (земля), s (рост в px), dir (1 вправо / −1 влево), pose, color, alpha, glow})
     Возвращает мировые координаты суставов (для реквизита в руках). */
  function fig(ctx, o) {
    const s = o.s || 300, dir = o.dir || 1, p = Object.assign({}, POSE.stand, o.pose || {});
    const j = joints(p, s, dir);
    const lowest = Math.max(j.footN[1], j.footF[1]);
    const hipY = p.hip !== undefined ? lerp(-lowest, -p.hip * s, p.hipW ?? 1) : -lowest;
    const ox = o.x, oy = o.y + hipY;
    const W2 = pt => [ox + pt[0], oy + pt[1]];
    const col = rgb(o.color || PAL.white), far = shade(col, .5), alpha = o.alpha ?? 1, glow = o.glow ?? 1;
    const lw = B.limb * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const limb = (pts, c, w) => {
      const a = W2(pts[0]), b = W2(pts[pts.length - 1]);
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, css(c)); g.addColorStop(1, css(shade(c, .28)));
      ctx.strokeStyle = g; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(...a); for (let i = 1; i < pts.length; i++) ctx.lineTo(...W2(pts[i])); ctx.stroke();
    };
    ctx.shadowColor = css(col, .45 * glow); ctx.shadowBlur = 38 * glow * s / 300;
    limb([j.sh, j.elF, j.handF], far, lw);
    limb([j.hip, j.kneeF, j.footF], far, lw);
    limb([j.hip, j.top], col, B.torsoW * s);
    limb([j.hip, j.kneeN, j.footN], col, lw);
    limb([j.sh, j.elN, j.handN], col, lw);
    // голова с объёмом
    const hc = W2(j.headC), r = B.head * s;
    const g = ctx.createRadialGradient(hc[0] - r * .35 * dir, hc[1] - r * .4, r * .1, hc[0], hc[1], r);
    g.addColorStop(0, css(mixC(col, [255, 255, 255], .5))); g.addColorStop(1, css(shade(col, .2)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hc[0], hc[1], r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const out = {}; for (const k in j) out[k] = W2(j[k]);
    out.headR = r; return out;
  }

  /* ---------- текст ---------- */
  const FONT = '"Manrope", "Helvetica Neue", Arial, sans-serif';
  function text(ctx, str, x, y, o = {}) {
    const size = o.size || 46, a = o.alpha ?? 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `${o.weight || 700} ${size}px ${o.font || FONT}`;
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
    const c = o.color || PAL.white;
    ctx.shadowColor = css(c, .55 * (o.glow ?? 1)); ctx.shadowBlur = (o.glow ?? 1) * size * .45;
    ctx.fillStyle = css(c);
    const lines = String(str).split('\n');
    const lh = size * (o.lh || 1.25);
    lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
    ctx.restore();
  }
  // текст, появляющийся с подъёмом
  function caption(ctx, str, x, y, t, t0, t1, o = {}) {
    const a = seg(t, t0, t0 + .45, E.out) * (t1 === undefined ? 1 : 1 - seg(t, t1, t1 + .35));
    text(ctx, str, x, y + (1 - seg(t, t0, t0 + .6, E.out)) * 18, Object.assign({}, o, { alpha: a * (o.alpha ?? 1) }));
  }

  /* ---------- примитивы ---------- */
  function line(ctx, pts, o = {}) {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.strokeStyle = css(o.color || PAL.grey); ctx.lineWidth = o.w || 6;
    ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
    if (o.glow) { ctx.shadowColor = css(o.color || PAL.grey, .6); ctx.shadowBlur = o.glow; }
    ctx.beginPath(); ctx.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]); ctx.stroke();
    ctx.restore();
  }
  // объёмный блок/ступень
  function block(ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    const c = o.color || '#9a9a9a';
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, css(mixC(c, [255, 255, 255], .25))); g.addColorStop(1, css(shade(c, .65)));
    ctx.fillStyle = g;
    ctx.shadowColor = css(c, .35); ctx.shadowBlur = o.glow ?? 24;
    const r = Math.min(8, w / 6, h / 6);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.restore();
  }
  function star(ctx, x, y, r, t, o = {}) {
    ctx.save();
    const c = o.color || PAL.white;
    const tw = 1 + .12 * Math.sin(t * 5);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4 * tw);
    g.addColorStop(0, css(c, .55 * (o.alpha ?? 1))); g.addColorStop(1, css(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4 * tw, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = css(c); ctx.shadowColor = css(c); ctx.shadowBlur = r * 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5 + (o.rot || 0), rr = i % 2 ? r * .45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function glowDot(ctx, x, y, r, c, a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(c, a)); g.addColorStop(1, css(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  /* ---------- фон и пост ---------- */
  function background(ctx, t, o = {}) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (o.spot !== false) {
      const g = ctx.createRadialGradient(W / 2, H * .45, 50, W / 2, H * .45, H * .7);
      g.addColorStop(0, `rgba(40,40,40,${o.spot ?? .55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // пылинки
    for (let i = 0; i < 46; i++) {
      const x = (hash(i) * W + t * 6 * (hash(i + 9) - .5)) % W;
      const y = (hash(i + 3) * H - t * 10 * hash(i + 5) + H) % H;
      ctx.fillStyle = `rgba(255,255,255,${.05 + .12 * hash(i + 7) * (.6 + .4 * Math.sin(t * 2 + i))})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  function watermark(ctx, label) {
    text(ctx, label, W / 2, 1610, { size: 22, weight: 800, color: '#3a3a3a', glow: 0, spacing: 3 });
  }
  function fade(ctx, a) {
    if (a <= 0) return;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`; ctx.fillRect(0, 0, W, H);
  }

  /* ---------- монтаж сцен ----------
     scenes: [{dur, draw(ctx, t, dur)}]. Между сценами — затемнение. */
  function timeline(scenes, fadeLen = .35) {
    let acc = 0;
    const list = scenes.map(s => { const o = Object.assign({ start: acc }, s); acc += s.dur; return o; });
    return {
      total: acc, list,
      draw(ctx, T, o = {}) {
        const sc = list.find(s => T < s.start + s.dur) || list[list.length - 1];
        const t = T - sc.start;
        background(ctx, T, sc.bg || {});
        sc.draw(ctx, t, sc.dur);
        if (o.watermark) watermark(ctx, o.watermark);
        fade(ctx, Math.max(1 - t / fadeLen, (t - (sc.dur - fadeLen)) / fadeLen));
      },
    };
  }

  window.SM = { W, H, clamp, lerp, E, seg, hash, rgb, mixC, css, shade, PAL, POSE, mix, walk, B, fig, text, caption, line, block, star, glowDot, background, watermark, fade, timeline };
})();
