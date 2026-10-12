"""Синтез звукового дизайна для ролика go-work.kz (без музыки).
События задаются во «времени сюжета» (0–15 с) и переводятся в реальное время (0–30 с) по map.json.
"""
import json, wave, bisect
import numpy as np

SR = 48000
DUR = 34.0
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



# ---------- мягкие версии звуков ----------
def soft(x, fc=3200):
    return svf(x, fc, 0.7, 'lp')

def s_pop(f0=520, f1=780, d=0.14):
    t = tt(d)
    s, _ = sweep_sine(f0, f1, d)
    env = np.minimum(1, t / 0.006) * np.exp(-t / (d / 3.5))
    return s * env

def s_swish(d=0.4, f0=500, f1=2600):
    return soft(whoosh(d, f0, f1, peak=0.5, q=1.0, body=0.2), 2800)

def s_liquid(d=0.62):
    t = tt(d); k = t / d
    n = rng.standard_normal(len(t))
    s = svf(n, 120 * (1400 / 120) ** k, 0.9, 'lp') * np.sin(np.pi * k) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(90 + 120 * k) / SR) * np.sin(np.pi * k) ** 2 * 0.35
    return s + tone

def s_chime(f, d=2.2):
    return soft(bell(f, d, 0.35), 4500)

def s_tick(f=1800):
    return soft(tick(f, 0.03), 3000)

def pad(d, f=110):
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * m * t + m) * a for m, a in [(1, 1), (1.5, .35), (2, .25), (1.005, .6)])
    env = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.5)
    air = svf(rng.standard_normal(len(t)), 900, 0.6, 'lp') * 0.25
    return (s * 0.25 + air) * env

def ev(st, sig, gain, pan=0.0, rev=0.3):
    place(sig, st, gain, pan, rev)

# S0
ev(0.0, pad(2.6, 98), 0.25, 0, 0.5)
ev(0.25, s_chime(523.25, 2.4), 0.12, 0, 0.6)
# S1
ev(2.35, s_swish(0.45), 0.25, -0.3)
ev(2.85, s_pop(500, 820), 0.22, 0.3)
ev(3.3, s_swish(0.45), 0.22, 0.3)
ev(4.2, s_swish(0.4, 2400, 600), 0.2, 0)
ev(4.45, s_pop(380, 620, 0.18), 0.25, 0)
for i in range(3):
    t0 = 4.55 + i * 0.8
    ev(t0, s_pop(600 + i * 80, 900 + i * 80), 0.2, (i - 1) * 0.4)
    ev(t0 + 0.47, s_swish(0.35, 1800, 400), 0.18, (i - 1) * 0.2)
    ev(t0 + 0.62, s_pop(300, 200, 0.16), 0.22, 0)
ev(7.3, s_liquid(), 0.4, 0, 0.4)
# S2
ev(7.7, s_swish(0.45), 0.2, -0.2)
ev(8.05, s_pop(520, 880), 0.24, 0)
for i in range(6):
    ev(8.75 + i * 0.09, s_tick(1500 + i * 120), 0.06, 0.2)
ev(9.35, s_pop(800, 1100, 0.1), 0.16, 0.3)
# S3
ev(10.1, s_liquid(), 0.4, 0, 0.4)
ev(10.5, s_chime(659.25, 2.0), 0.12, 0, 0.6)
ev(10.5, s_pop(420, 700, 0.18), 0.24, 0)
for i, st in enumerate([12.3, 14.05, 15.8]):
    ev(st - 0.15, s_swish(0.4, 700, 2400), 0.18, 0)
    ev(st, s_pop(480 + i * 60, 760 + i * 60), 0.22, 0)
ev(10.4, pad(6.8, 82.4), 0.12, 0, 0.5)
# S4
ev(17.3, s_liquid(), 0.4, 0, 0.4)
ev(17.65, s_swish(0.45), 0.2, 0)
for i, f in enumerate([523.25, 587.33, 659.25, 783.99, 880.0]):
    ev(18.05 + i * 0.32, s_pop(f, f * 1.3, 0.15), 0.18, -0.5 + i * 0.25)
    ev(18.02 + i * 0.32, s_swish(0.3, 900, 2600), 0.1, -0.5 + i * 0.25)
ev(21.85, s_swish(0.4, 2400, 600), 0.18, 0)
# S5
ev(22.1, s_liquid(), 0.4, 0, 0.4)
for i, st in enumerate([22.45, 22.75, 23.25, 23.55]):
    ev(st, s_swish(0.4), 0.16, -0.3 + i * 0.2)
    if i in (1, 3):
        ev(st + 0.05, s_pop(520, 820), 0.2, 0)
ev(24.3, s_pop(440, 880, 0.2), 0.24, 0)
ev(24.35, s_chime(783.99, 1.8), 0.1, 0, 0.6)
# S6
ev(26.1, s_liquid(), 0.4, 0, 0.4)
for st in [26.4, 26.7, 27.15]:
    ev(st, s_swish(0.4), 0.16, 0)
ev(27.6, s_pop(500, 900, 0.16), 0.24, 0)
ev(28.2, s_swish(0.55, 400, 1500), 0.08, 0.5)
ev(28.8, soft(mouse_click(), 3500), 0.2, 0.2, 0.2)
# S7
ev(29.7, s_liquid(), 0.4, 0, 0.4)
for i, f in enumerate([523.25, 659.25, 783.99]):
    ev(30.15 + i * 0.08, s_chime(f, 3.0), 0.09, -0.3 + i * 0.3, 0.7)
ev(30.15, s_pop(380, 640, 0.2), 0.22, 0)
for st in [30.45, 30.7, 31.0, 31.2]:
    ev(st, s_swish(0.4), 0.12, 0)
ev(30.0, pad(4.0, 98), 0.2, 0, 0.5)

# ---------- мастер: звуки — тихий фон, голос — главный ----------
ir_len = int(1.8 * SR)
t = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], axis=1) * np.exp(-t * 3.0)[:, None]
ir[: int(0.015 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=0))
L = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.stack([np.fft.irfft(np.fft.rfft(send[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], axis=1)
sfx = dry + wet * 0.5
sfx = sfx / np.max(np.abs(sfx)) * 0.2          # пик эффектов ≈ −14 дБFS

def read_wav(p):
    import wave
    w = wave.open(p); sr = w.getframerate(); n = w.getnframes()
    a = np.frombuffer(w.readframes(n), dtype='<i2').astype(float) / 32768
    if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(axis=1)
    if sr != SR:
        x = np.arange(len(a)) / sr; xn = np.arange(int(len(a) * SR / sr)) / SR
        a = np.interp(xn, x, a)
    return a

voice = np.zeros((N, 2)); vsend = np.zeros((N, 2))
for f, st in [('bism.wav', 0.35), ('salam.wav', 31.75)]:
    v = read_wav(f)
    v = svf(v, 7000, 0.7, 'lp')                       # убрать резкость
    v = v / np.max(np.abs(v)) * 0.7
    i0 = int(st * SR); n = min(len(v), N - i0)
    voice[i0:i0 + n] += v[:n, None]
    vsend[i0:i0 + n] += v[:n, None] * 0.25
vwet = np.stack([np.fft.irfft(np.fft.rfft(vsend[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], axis=1)
voice = voice + vwet * 0.35
y = sfx + voice
y = np.tanh(y * 1.1) / np.tanh(1.1) * 0.85
fade = int(0.02 * SR)
y[:fade] *= np.linspace(0, 1, fade)[:, None]
y[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]
pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
with wave.open('gw2.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
