"""Ролик gw2: голос Ali (ElevenLabs) + кинематографичные SFX (ElevenLabs Sound Effects).
SFX-шина держится ~12–14 дБ ниже голоса."""
import wave
import numpy as np

SR = 48000
DUR = 34.0
N = int(SR * DUR)
SFX = 'sfx-el/'
ALI = 'voice-ali/'
rng = np.random.default_rng(7)


def read_wav(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    if w.getnchannels() == 2:
        a = a.reshape(-1, 2).mean(axis=1)
    return a


def trim(a, thr=0.02):
    i = np.argmax(np.abs(a) > thr * np.max(np.abs(a)))
    return a[max(0, i - 48):]


def fit(a, d):
    """обрезать до d секунд с мягким хвостом"""
    n = min(len(a), int(d * SR))
    a = a[:n].copy()
    f = min(n // 3, int(0.25 * SR))
    a[-f:] *= np.linspace(1, 0, f) ** 2
    return a


def pitch(a, r):
    x = np.arange(len(a))
    return np.interp(np.arange(0, len(a) - 1, r), x, a)


def lp(a, k=6):
    """мягкий фильтр (сглаживание) — убирает резкий верх"""
    return np.convolve(a, np.ones(k) / k, mode='same')


S = {k: trim(read_wav(SFX + k + '.wav')) for k in
     ['whoosh1', 'whoosh2', 'liquid1', 'liquid2', 'pop1', 'pop2', 'boom1', 'boom2', 'shim1', 'shim2', 'trash1', 'trash2']}
for k in S:
    S[k] = lp(S[k]) / np.max(np.abs(S[k]))
S['whoosh1'] = fit(S['whoosh1'], 1.4)
S['liquid1'] = fit(S['liquid1'], 1.6)
S['pop2'] = fit(S['pop2'], 0.5)
S['trash1'] = fit(S['trash1'], 1.0)

bus = np.zeros((N, 2))
send = np.zeros((N, 2))


def ev(t, k, g, pan=0.0, rev=0.25, peak=False, r=1.0):
    s = S[k] if r == 1.0 else pitch(S[k], r)
    if peak:                       # пик звука совпадает с моментом склейки
        t -= np.argmax(np.abs(s)) / SR
    i0 = int(max(0, t) * SR)
    n = min(len(s), N - i0)
    a = (pan + 1) * np.pi / 4
    st = np.stack([s[:n] * np.cos(a), s[:n] * np.sin(a)], axis=1) * g
    bus[i0:i0 + n] += st
    send[i0:i0 + n] += st * rev


# --- интро
ev(0.25, 'shim2', 0.35, 0, 0.6)
ev(2.5, 'boom1', 0.7, 0, 0.3, peak=True)
# S1: пилюли → корзина
ev(2.35, 'whoosh2', 0.35, -0.3, peak=True)
ev(2.85, 'pop1', 0.45, 0.3)
ev(3.3, 'whoosh2', 0.3, 0.3, peak=True, r=1.1)
ev(4.45, 'pop2', 0.4, 0)
for i in range(3):
    t0 = 4.55 + i * 0.8
    ev(t0, 'pop1', 0.35, (i - 1) * 0.4, r=1 + i * 0.06)
    ev(t0 + 0.5, 'trash2' if i % 2 else 'trash1', 0.55, (i - 1) * 0.2)
ev(7.35, 'liquid2', 0.5, 0, 0.4, peak=True)
# S2
ev(7.75, 'whoosh2', 0.28, -0.2, peak=True, r=1.15)
ev(8.05, 'boom1', 0.75, 0, 0.35, peak=True)
ev(9.35, 'shim1', 0.3, 0.3, 0.5)
# S3
ev(10.15, 'liquid1', 0.5, 0, 0.4, peak=True)
ev(10.5, 'pop2', 0.4, 0)
for i, st in enumerate([12.3, 14.05, 15.8]):
    ev(st - 0.05, 'whoosh2', 0.25, 0, peak=True, r=1.05 + i * 0.05)
    ev(st, 'pop1', 0.4, 0, r=0.95 + i * 0.07)
# S4
ev(17.35, 'liquid2', 0.5, 0, 0.4, peak=True, r=0.94)
ev(17.75, 'whoosh1', 0.25, 0, peak=True)
for i in range(5):
    ev(18.05 + i * 0.32, 'pop1', 0.32, -0.5 + i * 0.25, r=0.9 + i * 0.07)
ev(21.9, 'whoosh2', 0.28, 0, peak=True, r=0.9)
# S5
ev(22.15, 'liquid1', 0.5, 0, 0.4, peak=True, r=1.05)
for i, st in enumerate([22.45, 22.75, 23.25, 23.55]):
    if i in (1, 3):
        ev(st + 0.05, 'pop1', 0.35, 0, r=1 + i * 0.03)
ev(24.3, 'pop2', 0.4, 0)
ev(24.35, 'shim2', 0.25, 0, 0.6)
# S6
ev(26.15, 'liquid2', 0.5, 0, 0.4, peak=True)
ev(26.55, 'whoosh2', 0.22, 0, peak=True, r=1.1)
ev(27.6, 'pop2', 0.4, 0)
ev(28.8, 'pop1', 0.3, 0.2, r=1.2)
# S7: финал
ev(29.75, 'liquid1', 0.5, 0, 0.4, peak=True, r=0.95)
ev(30.15, 'boom2', 0.9, 0, 0.45, peak=True)
ev(30.15, 'shim2', 0.35, 0, 0.6)
ev(30.45, 'pop2', 0.35, 0)

# --- реверб
ir_len = int(1.6 * SR)
t = np.arange(ir_len) / SR
ir = rng.standard_normal((ir_len, 2)) * np.exp(-t * 3.2)[:, None]
ir[: int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=0))
L = 1 << int(np.ceil(np.log2(N + ir_len)))


def verb(x):
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], axis=1)


sfx = bus + verb(send) * 0.45
sfx = sfx / np.max(np.abs(sfx)) * 0.16

# --- голос Ali
voice = np.zeros((N, 2))
vsend = np.zeros((N, 2))
for f, st in [('bism2.wav', 0.35), ('salam2.wav', 31.75)]:
    v = trim(read_wav(ALI + f), 0.01)
    v = v / np.max(np.abs(v)) * 0.8
    i0 = int(st * SR)
    n = min(len(v), N - i0)
    voice[i0:i0 + n] += v[:n, None]
    vsend[i0:i0 + n] += v[:n, None] * 0.2
voice += verb(vsend) * 0.3

# приглушить эффекты под голосом (ducking)
env = np.convolve(np.abs(voice[:, 0]), np.ones(2400) / 2400, mode='same')
duck = 1 - 0.55 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
y = sfx * duck[:, None] + voice
y = np.tanh(y * 1.1) / np.tanh(1.1) * 0.9
fade = int(0.02 * SR)
y[:fade] *= np.linspace(0, 1, fade)[:, None]
y[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]

def rms_db(x):
    x = x[np.abs(x) > 1e-4]
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)

print('voice RMS dB', round(rms_db(voice[:, 0]), 1), ' sfx RMS dB', round(rms_db(sfx[:, 0]), 1),
      ' voice peak', round(np.abs(voice).max(), 2), ' sfx peak', round(np.abs(sfx).max(), 2))
pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
with wave.open('gw2_ali.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
