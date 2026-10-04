"""Синтез звукового дизайна для ролика go-work.kz (без музыки).
События задаются во «времени сюжета» (0–15 с) и переводятся в реальное время (0–30 с) по map.json.
"""
import json, wave, bisect
import numpy as np

SR = 48000
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(42)

MAP = json.load(open('map.json'))  # S(real) с шагом 1 мс


def R(st):
    """время сюжета → реальное время"""
    i = bisect.bisect_left(MAP, st)
    return min(i, len(MAP) - 1) / 1000.0


dry = np.zeros((N, 2))
send = np.zeros((N, 2))


def place(sig, t, gain=1.0, pan=0.0, rev=0.2):
    """sig: моно или стерео; pan -1..1 (или массив для движения)"""
    if sig.ndim == 1:
        p = np.clip(np.asarray(pan, dtype=float), -1, 1)
        if p.ndim == 0:
            p = np.full(len(sig), float(p))
        a = (p + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    i0 = int(t * SR)
    if i0 >= N:
        return
    n = min(len(sig), N - i0)
    dry[i0:i0 + n] += sig[:n] * gain
    send[i0:i0 + n] += sig[:n] * gain * rev


def tt(d):
    return np.arange(int(d * SR)) / SR


def svf(x, fc, q=0.7, mode='bp'):
    """state-variable фильтр с меняющейся частотой среза"""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    damp = 1.0 / q
    low = band = 0.0
    out = np.empty_like(x)
    lo_out = mode == 'lp'
    hi_out = mode == 'hp'
    for i in range(len(x)):
        fi = f[i]
        low += fi * band
        high = x[i] - low - damp * band
        band += fi * high
        out[i] = low if lo_out else (high if hi_out else band)
    return out


def sweep_sine(f0, f1, d, curve='exp'):
    t = tt(d)
    k = t / d
    f = f0 * (f1 / f0) ** k if curve == 'exp' else f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR), f


# ---------- звуки ----------
def whoosh(d=0.6, f0=300, f1=4000, peak=0.6, q=1.4, body=0.35):
    t = tt(d)
    k = t / d
    env = np.where(k < peak, np.sin(np.pi / 2 * np.clip(k / peak, 0, 1)) ** 2, np.clip(np.cos(np.pi / 2 * np.clip((k - peak) / (1 - peak), 0, 1)), 0, 1) ** 1.6)
    fc = f0 * (f1 / f0) ** np.sin(np.pi / 2 * k)
    n = rng.standard_normal(len(t))
    s = svf(n, fc, q, 'bp') * 1.6 + svf(n, fc * 0.35, 0.8, 'lp') * body
    return s * env


def swish(d=0.22, f0=1800, f1=7000):
    return whoosh(d, f0, f1, peak=0.45, q=2.2, body=0.0) * 0.8


def impact(d=1.4, sub=1.0, crack=0.6):
    t = tt(d)
    f = 42 + 95 * np.exp(-t * 16)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2) * sub
    s = np.tanh(s * 2.2) * 0.8
    n = rng.standard_normal(len(t))
    noise = svf(n, 2200 * np.exp(-t * 6) + 200, 0.7, 'lp') * np.exp(-t * 18) * crack
    click = np.zeros(len(t))
    click[:120] = rng.standard_normal(120) * np.exp(-np.arange(120) / 25) * 0.8
    return s + noise + click


def riser(d=1.0):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    s = svf(n, 300 * (7000 / 300) ** k, 3.0, 'bp') * 1.8 * k ** 2
    tone, _ = sweep_sine(160, 980, d)
    tone = tone * k ** 3 * 0.35 * (1 + 0.3 * np.sin(2 * np.pi * (5 + 20 * k) * t))
    fade = np.minimum(1, (d - t) / 0.01)
    return (s + tone) * fade


def pop(f0=900, f1=380, d=0.11):
    s, _ = sweep_sine(f0, f1, d)
    t = tt(d)
    env = np.minimum(1, t / 0.0015) * np.exp(-t / (d / 3.2))
    out = s * env
    out[:60] += rng.standard_normal(60) * np.linspace(0.5, 0, 60)
    return out


def bubble(f0=170, f1=820, d=0.32):
    t = tt(d)
    k = t / d
    f = f0 * (f1 / f0) ** (k ** 0.6) * (1 + 0.06 * np.sin(2 * np.pi * 22 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 7)
    return s * env


def tick(f=3200, d=0.03):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 260)
    s[:40] += rng.standard_normal(40) * np.linspace(0.4, 0, 40)
    return s


def key():
    d = 0.05
    t = tt(d)
    n = rng.standard_normal(len(t))
    hi = svf(n, 2600 + rng.uniform(-500, 500), 1.5, 'bp') * np.exp(-t * 320) * 1.8
    lo = np.sin(2 * np.pi * rng.uniform(170, 230) * t) * np.exp(-t * 160) * 0.5
    return hi + lo


def bell(f, d=1.6, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for mult, amp, dec in [(1, 1, 2.2), (2.0, 0.45 * bright, 3.5), (3.01, 0.22 * bright, 5), (4.2, 0.12 * bright, 8), (5.43, 0.06 * bright, 11)]:
        s += amp * np.sin(2 * np.pi * f * mult * t) * np.exp(-t * dec)
    return s * np.minimum(1, t / 0.002)


def notify(f=1046.5):
    a = bell(f, 1.2, 0.8)
    b = bell(f * 1.5, 1.2, 0.8)
    out = np.zeros(len(a) + int(0.085 * SR))
    out[:len(a)] += a * 0.8
    out[int(0.085 * SR):] += b
    return out * 0.6


def shimmer(d=0.6, density=40):
    out = np.zeros(int((d + 0.1) * SR))
    for _ in range(density):
        f = rng.uniform(3500, 9500)
        gd = rng.uniform(0.02, 0.06)
        t = tt(gd)
        g = np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / gd) ** 2
        i = int(rng.uniform(0, d) * SR)
        out[i:i + len(g)] += g * rng.uniform(0.2, 0.6)
    return out


def mouse_click():
    d = 0.06
    t = tt(d)
    a = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 400)
    b = np.zeros(len(t))
    j = int(0.012 * SR)
    b[j:] = np.sin(2 * np.pi * 1700 * t[:len(t) - j]) * np.exp(-t[:len(t) - j] * 350) * 0.7
    n = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.6
    return a + b + n


def liquid(d=0.9):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    s = svf(n, 150 * (2500 / 150) ** k, 1.2, 'lp') * np.sin(np.pi * k) ** 1.5 * 1.4
    tone = np.sin(2 * np.pi * np.cumsum(70 + 160 * k ** 2) / SR) * np.sin(np.pi * k) * 0.7
    return s + tone


def drone_tail(d=4.0, f=55):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    env = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 1.6)
    return s * env * 0.4


# ---------- события (время сюжета) ----------
def ev(st, sig, gain, pan=0.0, rev=0.2, real_offset=0.0):
    place(sig, R(st) + real_offset, gain, pan, rev)


# 1. Интро
ev(0.0, riser(1.0) * 0.7, 0.35, 0, 0.3, real_offset=-0.0)
ev(0.05, bubble(300, 1400, 0.25), 0.18, 0, 0.4)
ev(0.47, impact(1.8, 1.2, 0.8), 0.95, 0, 0.35)
ev(0.47, shimmer(1.2, 60), 0.18, 0, 0.6)
ev(0.47, whoosh(0.9, 3000, 300, peak=0.08, q=1.0), 0.35, 0, 0.3)
ev(0.62, bell(523.25 * 2, 2.5, 0.6), 0.16, 0, 0.6)
for i in range(10):
    ev(0.72 + i * 0.045, pop(700 + i * 90, 400 + i * 50, 0.07), 0.16, -0.6 + i * 0.13, 0.25)
ev(1.5, whoosh(0.9, 400, 5000, peak=0.55), 0.42, np.linspace(0.3, -0.7, int(0.9 * SR)), 0.25)
ev(1.9, swish(0.35, 900, 4000), 0.22, 0, 0.2)
ev(2.2, pop(1200, 600, 0.09), 0.3, 0.7, 0.2)

# 2. Hero
for i in range(5):
    ev(1.95 + i * 0.085, swish(0.28, 1200 + i * 200, 5000), 0.2, -0.3, 0.2)
ev(2.15, bubble(140, 620, 0.5), 0.45, 0.1, 0.4)
ev(2.15, impact(1.0, 0.6, 0.1), 0.35, 0, 0.3)
ev(2.55, pop(520, 1500, 0.14), 0.32, -0.5, 0.3)
ev(2.62, impact(0.7, 0.5, 0.4), 0.45, -0.3, 0.2)
ev(2.55, swish(0.3, 2000, 6000), 0.14, -0.4, 0.2)
for i, (st, pn) in enumerate([(2.8, -0.6), (3.0, 0.6), (3.2, -0.4)]):
    ev(st, pop(900 + i * 150, 500, 0.12), 0.28, pn, 0.25)
    ev(st, swish(0.2, 2500, 7000), 0.12, pn, 0.1)
# счётчик 0→327
prev = -1
for k in np.linspace(0, 1, 400):
    v = int(327 * (1 - 2 ** (-10 * k)) / 12)
    if v != prev:
        prev = v
        ev(3.0 + k * 0.9, tick(2200 + v * 60), 0.16, -0.6, 0.05)
ev(3.0, swish(0.6, 3000, 9000), 0.08, -0.5, 0.2)
ev(3.9, bell(1318.5, 1.8, 0.8), 0.24, -0.5, 0.45)
ev(3.9, pop(900, 1700, 0.1), 0.16, -0.5, 0.3)
ev(3.55, whoosh(R(4.16) - R(3.55), 180, 900, peak=0.75, q=0.8, body=0.9), 0.16, np.sin(np.linspace(0, 6, int((R(4.16) - R(3.55)) * SR))) * 0.6, 0.4)
ev(4.06, shimmer(R(4.14) - R(4.06), 30), 0.08, 0, 0.6)
# разгон сферы
ev(4.12, riser(R(4.78) - R(4.12)), 0.45, 0, 0.3)
ev(4.25, whoosh(R(4.8) - R(4.25), 200, 3000, peak=0.92, q=1.0, body=0.8), 0.45, 0, 0.3)
ev(4.78, impact(2.2, 1.3, 1.0), 1.0, 0, 0.45)
ev(4.78, shimmer(1.0, 50), 0.15, 0, 0.6)

# 3. Услуги
ev(4.95, swish(0.3, 1500, 6000), 0.2, -0.5, 0.2)
ev(5.0, whoosh(0.45, 800, 5000, peak=0.4), 0.22, -0.3, 0.2)
for i in range(4):
    t0 = 5.1 + i * 0.13
    side = 1 if i % 2 else -1
    d = 0.55
    ev(t0 - 0.05, whoosh(d, 500, 4500, peak=0.55), 0.32, np.linspace(side * 0.9, side * 0.1, int(d * SR)), 0.2)
    ev(t0 + 0.3, pop(700 + i * 160, 420 + i * 60, 0.12), 0.3, side * 0.3, 0.25)
for i in range(4):
    ev(6.1 + i * 0.1, shimmer(0.25, 12), 0.12, -0.6 + i * 0.4, 0.4)
ev(6.82, whoosh(0.6, 600, 6000, peak=0.5), 0.35, np.linspace(-0.2, 0.9, int(0.6 * SR)), 0.25)
ev(6.92, whoosh(R(7.5) - R(6.92), 250, 2000, peak=0.6, q=0.9, body=0.6), 0.35, 0, 0.3)
ev(6.92, bubble(220, 900, 0.6), 0.22, 0, 0.4)

# 4. Чат
ev(7.15, swish(0.3, 1500, 6000), 0.18, -0.4, 0.2)
ev(7.3, pop(600, 900, 0.1), 0.18, 0, 0.3)
ev(7.55, notify(1046.5), 0.5, -0.3, 0.35)
ev(7.55, pop(800, 450, 0.1), 0.22, -0.3, 0.2)
TYPE_N = len('Кофейня в Алматы, хочу больше гостей ☕')
for i in range(TYPE_N):
    if i % 2 == 0 or i % 5 == 3:
        ev(7.9 + 0.6 * i / TYPE_N, key(), 0.22 * rng.uniform(0.7, 1.0), rng.uniform(-0.15, 0.15), 0.1)
ev(8.55, mouse_click(), 0.4, 0.4, 0.15)
ev(8.56, swish(0.3, 1500, 7000), 0.28, np.linspace(0.4, 0.2, int(0.3 * SR)), 0.2)
ev(8.62, pop(500, 900, 0.12), 0.32, 0.4, 0.25)
for j in range(3):
    ev(8.85 + j * 0.1, tick(1500 + j * 200, 0.03), 0.06, -0.3, 0.2)
ev(9.22, notify(1174.7), 0.5, -0.3, 0.35)
for i in range(0, 100, 4):
    ev(9.3 + 0.65 * (1 - (1 - i / 100) ** 0.33), tick(4200 + rng.uniform(-300, 300), 0.02), 0.035, -0.3, 0.05)
ev(9.9, pop(700, 1600, 0.14), 0.35, -0.2, 0.3)
ev(9.95, shimmer(0.4, 18), 0.12, -0.2, 0.4)
ev(10.2, whoosh(R(10.72) - R(10.2), 300, 6000, peak=0.5, q=1.1, body=0.6), 0.6, 0, 0.3)
ev(10.2, riser(R(10.45) - R(10.2)), 0.2, 0, 0.2)

# 5. Результат
ev(10.42, impact(0.9, 0.7, 0.3), 0.5, 0, 0.3)
prev = -1
for k in np.linspace(0, 1, 500):
    v = int(327 * (1 - 2 ** (-10 * k)) / 9)
    if v != prev:
        prev = v
        ev(10.38 + k * 1.05, tick(1800 + v * 55), 0.18, 0, 0.05)
ev(11.43, bell(1318.5, 1.8, 1.0), 0.32, 0, 0.45)
ev(11.43, pop(600, 1400, 0.12), 0.22, 0, 0.2)
ev(10.43, swish(0.4, 600, 3000), 0.2, 0, 0.2)
NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5, 1568.0]
for i, f in enumerate(NOTES):
    ev(10.58 + i * 0.055, pop(f * 1.5, f, 0.1), 0.2, -0.8 + i * 0.2, 0.3)
ev(10.83, sweep_sine(500, 2200, R(11.53) - R(10.83))[0] * np.hanning(int((R(11.53) - R(10.83)) * SR)), 0.06, np.linspace(-0.7, 0.7, int((R(11.53) - R(10.83)) * SR)), 0.4)
ev(11.48, pop(1500, 2400, 0.1), 0.25, 0.7, 0.4)
for i in range(3):
    ev(11.08 + i * 0.09, pop(800 + i * 200, 1300 + i * 200, 0.11), 0.26, -0.6 + i * 0.6, 0.25)
ev(11.03, whoosh(R(12.6) - R(11.03), 300, 2500, peak=0.3, q=1.2, body=0.4), 0.3, np.linspace(0.9, -0.9, int((R(12.6) - R(11.03)) * SR)), 0.25)

# 6. Финал
ev(12.38, pop(1100, 500, 0.1), 0.25, 0.7, 0.2)
ev(12.45, riser(R(12.98) - R(12.45)), 0.4, 0.5, 0.3)
ev(12.5, liquid(R(13.0) - R(12.5)), 0.55, np.linspace(0.7, 0, int((R(13.0) - R(12.5)) * SR)), 0.35)
ev(12.98, impact(2.0, 1.2, 0.7), 0.95, 0, 0.45)
ev(12.98, whoosh(0.7, 4000, 300, peak=0.1), 0.3, 0, 0.3)
for i in range(3):
    ev(13.3 + i * 0.09, swish(0.3, 1300 + i * 300, 6000), 0.2, -0.3 + i * 0.3, 0.2)
ev(13.32, pop(600, 1500, 0.15), 0.32, -0.3, 0.3)
ev(13.42, swish(0.4, 2000, 8000), 0.18, 0.2, 0.2)
ev(13.45, whoosh(R(14.05) - R(13.45), 400, 4500, peak=0.6), 0.32, np.linspace(-0.7, 0, int((R(14.05) - R(13.45)) * SR)), 0.25)
ev(14.05, pop(500, 1200, 0.16), 0.32, 0, 0.35)
ev(14.05, bell(783.99, 2.0, 0.6), 0.18, 0, 0.5)
ev(13.8, shimmer(0.6, 30), 0.14, 0, 0.5)
ev(13.9, swish(R(14.28) - R(13.9), 600, 2500), 0.12, np.linspace(0.8, 0.2, int((R(14.28) - R(13.9)) * SR)), 0.1)
ev(14.33, mouse_click(), 0.55, 0.15, 0.2)
ev(14.33, impact(0.8, 0.5, 0.2), 0.45, 0.1, 0.3)
for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    ev(14.36, bell(f, 1.8, 0.7), 0.17, -0.4 + i * 0.27, 0.5, real_offset=i * 0.07)
ev(14.34, shimmer(1.2, 70), 0.2, 0, 0.6)
ev(14.6, shimmer(0.7, 25), 0.12, 0, 0.5)
place(drone_tail(3.6, 55), R(14.33), 0.35, 0, 0.3)

# ---------- реверберация и мастер ----------
ir_len = int(1.6 * SR)
t = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], axis=1) * np.exp(-t * 3.6)[:, None]
ir[: int(0.012 * SR)] = 0  # pre-delay
ir /= np.sqrt((ir ** 2).sum(axis=0))
L = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.stack([np.fft.irfft(np.fft.rfft(send[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], axis=1)
# лёгкое затемнение хвоста
mix = dry + wet * 0.55
# фон «воздух»: очень тихий тёмный шум, чтобы не было цифровой тишины
air = np.stack([svf(rng.standard_normal(N), 900, 0.6, 'lp'), svf(rng.standard_normal(N), 900, 0.6, 'lp')], axis=1)
air *= 0.004 * (1 + 0.3 * np.sin(2 * np.pi * 0.07 * np.arange(N) / SR))[:, None]
mix = mix + air

# компрессор: RMS-огибающая 15 мс, порог/степень
def smooth(x, w):
    c = np.cumsum(np.insert(x, 0, 0.0))
    out = (c[w:] - c[:-w]) / w
    return np.concatenate([np.full(w - 1, out[0]), out])

lvl = np.sqrt(smooth((mix ** 2).mean(axis=1), int(0.015 * SR))) + 1e-9
ref = np.percentile(lvl[lvl > 1e-4], 99.5)
thr, ratio = ref * 0.25, 4.0
gain = np.where(lvl > thr, (thr / lvl) ** (1 - 1 / ratio), 1.0)
gain = smooth(gain, int(0.02 * SR))  # сглаживание атаки/восстановления
y = mix * gain[:, None]
y = y / np.max(np.abs(y)) * 1.5
y = np.tanh(y) / np.tanh(1.5) * 0.89
# плавные края
fade = int(0.01 * SR)
y[:fade] *= np.linspace(0, 1, fade)[:, None]
y[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))[:, None]

pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
with wave.open('sfx.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', 'rms', round(float(np.sqrt((y ** 2).mean())), 4))
