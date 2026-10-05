"""Синтез звукового дизайна для ролика go-work.kz (без музыки).
События задаются во «времени сюжета» (0–15 с) и переводятся в реальное время (0–30 с) по map.json.
"""
import json, wave, bisect
import numpy as np

SR = 48000
DUR = 21.0
N = int(SR * DUR)
rng = np.random.default_rng(42)



def R(st):
    return st


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


# ---------- события ----------
def ev(st, sig, gain, pan=0.0, rev=0.2):
    place(sig, st, gain, pan, rev)

# 1. вступление
ev(0.0, riser(0.35), 0.2, 0, 0.3)
ev(0.1, whoosh(0.5, 600, 5000, peak=0.5), 0.35, np.linspace(-0.6, 0.2, int(0.5 * SR)), 0.25)
ev(0.22, whoosh(0.5, 700, 5500, peak=0.5), 0.3, np.linspace(0.6, -0.1, int(0.5 * SR)), 0.25)
ev(0.25, impact(0.9, 0.6, 0.3), 0.4, 0, 0.3)
ev(1.15, whoosh(0.4, 4000, 500, peak=0.3), 0.3, 0, 0.2)

# 2. Google
for i, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0]):
    ev(1.45 + i * 0.06, pop(f * 1.6, f, 0.09), 0.2, -0.6 + i * 0.24, 0.3)
ev(1.8, swish(0.35, 800, 3500), 0.22, 0, 0.2)
ev(2.2, mouse_click(), 0.45, 0.2, 0.15)
for i in range(19):
    ev(2.45 + 1.3 * i / 19, key(), 0.28 * rng.uniform(0.7, 1.0), rng.uniform(-0.2, 0.2), 0.08)
for i in range(3):
    ev(3.05 + i * 0.06, tick(2600 + i * 400, 0.03), 0.12, 0, 0.2)
ev(3.8, tick(1800, 0.03), 0.12, 0, 0.1)
ev(4.25, key(), 0.45, 0, 0.1)   # Enter
ev(4.27, pop(500, 900, 0.1), 0.25, 0, 0.2)
ev(4.5, whoosh(0.7, 300, 4000, peak=0.6, body=0.6), 0.45, 0, 0.25)

# 3. выдача
for i in range(3):
    ev(4.95 + i * 0.05, tick(1500 + i * 300, 0.04), 0.1, 0, 0.2)
ev(5.0, shimmer(0.4, 14), 0.08, 0, 0.3)
for i in range(2):
    ev(5.3 + i * 0.07, swish(0.25, 1200, 5000), 0.15, 0.3, 0.15)
ev(5.15, riser(0.4), 0.35, 0, 0.25)
ev(5.2, whoosh(0.45, 250, 6000, peak=0.85, q=1.1, body=0.7), 0.5, np.linspace(0, 0, int(0.45 * SR)), 0.25)
ev(5.55, impact(2.0, 1.3, 0.9), 1.0, 0, 0.45)
ev(5.55, shimmer(1.2, 60), 0.18, 0, 0.6)
ev(5.65, whoosh(0.5, 2000, 400, peak=0.15), 0.25, 0, 0.2)   # конкуренты уходят вниз
ev(6.1, pop(500, 1500, 0.15), 0.4, 0.5, 0.3)
for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    ev(6.12 + i * 0.06, bell(f, 1.6, 0.7), 0.16, 0.2 + i * 0.12, 0.5)
ev(7.2, swish(0.65, 500, 2500), 0.12, np.linspace(0.8, -0.2, int(0.65 * SR)), 0.1)
ev(7.95, mouse_click(), 0.5, -0.2, 0.15)
ev(8.3, riser(0.45), 0.4, 0, 0.3)
ev(8.35, whoosh(0.5, 200, 7000, peak=0.85, q=1.0, body=0.8), 0.5, 0, 0.3)
ev(8.6, impact(1.6, 1.0, 0.8), 0.85, 0, 0.45)

# 4. Search Console
ev(8.9, swish(0.4, 1000, 5000), 0.2, -0.4, 0.2)
for i in range(3):
    ev(9.1 + i * 0.12, pop(700 + i * 200, 400 + i * 100, 0.12), 0.3, -0.6 + i * 0.6, 0.25)
    ev(9.1 + i * 0.12, whoosh(0.4, 400, 3500, peak=0.4), 0.18, -0.6 + i * 0.6, 0.2)
prev = -1
for k in np.linspace(0, 1, 400):
    v = int(880 * (1 - 2 ** (-10 * k)) / 40)
    if v != prev:
        prev = v
        ev(9.32 + k * 1.15, tick(1800 + v * 70), 0.14, 0, 0.05)
for i in range(3):
    ev(10.35 + i * 0.12, bell([1046.5, 1174.7, 1318.5][i], 1.2, 0.8), 0.16, -0.6 + i * 0.6, 0.45)
ev(9.7, swish(0.4, 600, 3000), 0.2, 0, 0.2)
d = 1.6
ev(10.0, sweep_sine(400, 1800, d)[0] * np.hanning(int(d * SR)), 0.07, np.linspace(-0.8, 0.8, int(d * SR)), 0.4)
for i, c in enumerate([2,1,2,5,4,2,1,0,5,3,5,2,3,0,0,1,1,4,2,2,4,0,0,1,2,0,0,0]):
    if c >= 4:
        ev(10.0 + 1.6 * i / 27, pop(900 + c * 120, 1400 + c * 150, 0.07), 0.12, -0.8 + 1.6 * i / 27, 0.3)
ev(11.5, swish(0.4, 800, 4000), 0.2, 0.3, 0.2)
for i in range(3):
    ev(11.75 + i * 0.14, whoosh(0.4, 600, 4500, peak=0.4), 0.2, np.linspace(0.8, 0.1, int(0.4 * SR)), 0.2)
    ev(12.0 + i * 0.14, sweep_sine(300, 900 - i * 150, 0.5)[0] * np.hanning(int(0.5 * SR)), 0.05, 0.3, 0.3)
ev(12.9, pop(600, 1400, 0.14), 0.32, 0, 0.3)
ev(13.1, notify(1318.5), 0.4, -0.2, 0.4)

# 5. итоги
ev(14.35, whoosh(0.5, 4000, 400, peak=0.3), 0.3, 0, 0.25)
ev(14.6, swish(0.4, 1500, 6000), 0.18, 0, 0.2)
for i in range(3):
    t0 = 14.75 + i * 0.22
    side = -1 if i % 2 == 0 else 1
    ev(t0 - 0.05, whoosh(0.55, 500, 4500, peak=0.55), 0.35, np.linspace(side * 0.9, 0, int(0.55 * SR)), 0.2)
    ev(t0 + 0.3, pop(700 + i * 200, 1300 + i * 250, 0.12), 0.32, side * 0.3, 0.3)
    ev(t0 + 0.32, impact(0.6, 0.4, 0.2), 0.3, side * 0.2, 0.2)

ev(15.5, whoosh(1.9, 180, 900, peak=0.6, q=0.8, body=0.9), 0.16, np.sin(np.linspace(0, 5, int(1.9 * SR))) * 0.6, 0.4)
ev(16.2, shimmer(0.9, 26), 0.1, 0, 0.6)
ev(16.4, bell(1568.0, 1.4, 0.6), 0.1, 0.3, 0.6)
# 6. финал
ev(17.3, riser(0.4), 0.35, 0, 0.3)
ev(17.35, whoosh(0.45, 4000, 300, peak=0.2), 0.35, 0, 0.25)
ev(17.55, impact(1.6, 1.1, 0.6), 0.7, 0, 0.4)
for i in range(2):
    ev(17.7 + i * 0.1, swish(0.3, 1300 + i * 300, 6000), 0.2, -0.2 + i * 0.4, 0.2)
ev(18.0, liquid(0.5), 0.45, 0, 0.3)
ev(18.15, impact(1.2, 0.9, 0.4), 0.6, 0, 0.4)
ev(18.4, pop(500, 1200, 0.16), 0.3, 0, 0.35)
ev(18.4, bell(783.99, 2.0, 0.6), 0.16, 0, 0.5)
ev(18.6, shimmer(0.6, 30), 0.14, 0, 0.5)
ev(18.6, swish(0.4, 2000, 7000), 0.15, 0, 0.2)
ev(19.4, swish(0.55, 600, 2500), 0.12, np.linspace(0.8, 0.2, int(0.55 * SR)), 0.1)
ev(20.03, mouse_click(), 0.55, 0.15, 0.2)
ev(20.03, impact(0.8, 0.5, 0.2), 0.45, 0.1, 0.3)
for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    place(bell(f, 1.6, 0.7), 20.06 + i * 0.07, 0.17, -0.4 + i * 0.27, 0.5)
ev(20.05, shimmer(0.9, 60), 0.2, 0, 0.6)
ev(20.3, shimmer(0.5, 20), 0.1, 0, 0.5)
place(drone_tail(1.0, 55), 20.0, 0.3, 0, 0.3)

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
with wave.open('sfx_neti.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', 'rms', round(float(np.sqrt((y ** 2).mean())), 4))
