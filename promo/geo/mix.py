"""Звук ролика «Сайт + SEO + GEO»: SFX ElevenLabs из promo/services/sfx-el, голос Ali (Бисмиллях / Ассаламу алейкум),
синтезированные щелчки клавиатуры. Без музыки, как в прошлых роликах."""
import wave
import numpy as np

SR, DUR = 48000, 30.0
N = int(SR * DUR)
rng = np.random.default_rng(11)


def read(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    return a


def trim(a, thr=0.02):
    i = np.argmax(np.abs(a) > thr * np.max(np.abs(a)))
    return a[max(0, i - 48):]


def fit(a, d):
    n = min(len(a), int(d * SR)); a = a[:n].copy(); f = min(n // 3, int(.25 * SR)); a[-f:] *= np.linspace(1, 0, f) ** 2
    return a


def pitch(a, r):
    return np.interp(np.arange(0, len(a) - 1, r), np.arange(len(a)), a)


def lp(a, k=6):
    return np.convolve(a, np.ones(k) / k, mode='same')


S = {k: trim(read(f'wav/{k}.wav')) for k in ['whoosh1', 'whoosh2', 'liquid1', 'liquid2', 'pop1', 'pop2', 'boom1', 'boom2', 'shim1', 'shim2', 'trash1', 'trash2']}
for k in S:
    S[k] = lp(S[k]) / np.max(np.abs(S[k]))
S['whoosh1'] = fit(S['whoosh1'], 1.3); S['liquid1'] = fit(S['liquid1'], 1.4); S['pop2'] = fit(S['pop2'], .5); S['trash1'] = fit(S['trash1'], .9)
# щелчок клавиши
n = int(.035 * SR); env = np.exp(-np.linspace(0, 9, n))
def key():
    s = rng.normal(0, 1, n) * env; s = np.convolve(s, [1, -.6], mode='same'); return s / np.max(np.abs(s))

bus = np.zeros((N, 2)); send = np.zeros((N, 2)); vbus = np.zeros((N, 2))


def ev(t, k, g, pan=0., rev=.25, peak=False, r=1., snd=None, to=None):
    s = snd if snd is not None else (S[k] if r == 1 else pitch(S[k], r))
    if peak: t -= np.argmax(np.abs(s)) / SR
    i0 = int(max(0, t) * SR); m = min(len(s), N - i0)
    a = (pan + 1) * np.pi / 4
    st = np.stack([s[:m] * np.cos(a), s[:m] * np.sin(a)], 1) * g
    (to if to is not None else bus)[i0:i0 + m] += st
    if to is None: send[i0:i0 + m] += st * rev

# голос Ali
for f, t in [('bism2', .15), ('salam2', 28.15)]:
    v = trim(read(f'wav/{f}.wav')); ev(t, None, .95, 0, 0, snd=v / np.max(np.abs(v)), to=vbus)

# S1
ev(.2, 'shim2', .3, 0, .6)
ev(.3, 'whoosh2', .28, -.3, peak=True, r=1.15)
ev(1.32, 'trash2', .32, .2, peak=True)            # зачёркивание «гуглят»
ev(1.85, 'whoosh2', .3, .3, peak=True)
ev(2.3, 'boom2', .45, 0, .35, peak=True)          # «ИИ.»
for i in range(3): ev(2.62 + i * .12, 'pop1', .3, -.4 + .4 * i, r=1 + .12 * i)
ev(3.35, 'whoosh1', .42, 0, .3, peak=True)        # смена сцены
# S2
ev(3.75, 'liquid2', .25, .2, peak=True)
for i, c in enumerate(range(39)):
    t = 4.2 + 1.5 * i / 39 + rng.uniform(-.012, .012)
    ev(t, None, .13 * rng.uniform(.7, 1), rng.uniform(-.3, .3), .1, snd=key())
ev(6.75, 'pop2', .28, 0)                           # ответ начался
ev(7.45, 'pop1', .45, -.1, peak=True)              # «Ваш бизнес»
ev(7.5, 'shim1', .35, .2, .5)
ev(7.7, 'pop1', .18, .2, r=1.25); ev(7.85, 'pop1', .16, .3, r=1.4)
ev(8.75, 'whoosh2', .2, .4, peak=True, r=1.3)      # стрелка
ev(9.05, 'pop2', .35, 0)                           # «Это можете быть вы»
ev(9.5, 'shim2', .22, 0, .5)
ev(10.2, 'whoosh1', .35, 0, .3, peak=True)
# S3
for i, t in enumerate([10.5, 11.85, 13.2]):
    ev(t, 'whoosh2', .32, .5 - .5 * i, peak=True, r=1.05 + .05 * i)
    ev(t + .45, 'pop1', .35, 0, r=1 + .08 * i)
# S4
ev(14.85, 'whoosh1', .35, 0, .3, peak=True)
for i, t in enumerate([15.4, 15.95, 16.5]): ev(t, 'whoosh2', .26, -.5 + .5 * i, peak=True, r=1.1 + .05 * i)
ev(17.2, 'boom2', .35, 0, .4, peak=True)           # GEO
for i in range(8): ev(17.45 + i * .16, 'pop1', .2, -.6 + .17 * i, r=.9 + .07 * i)
ev(20.75, 'whoosh1', .35, 0, .3, peak=True)
# S5
ev(20.95, 'boom1', .6, 0, .35, peak=True)          # ТОП-3
ev(21.3, 'liquid1', .22, -.2, peak=True)
ev(22.05, 'shim1', .4, .1, .5)
for i in range(3): ev(22.75 + i * .14, 'whoosh2', .2, -.5 + .5 * i, peak=True, r=1.3)
ev(25.5, 'whoosh1', .38, 0, .3, peak=True)
# S6
ev(25.85, 'pop2', .25, 0)
ev(26.55, 'pop1', .45, 0, peak=True); ev(26.6, 'shim2', .25, 0, .5)
ev(27.3, 'boom2', .4, 0, .4, peak=True)            # GO-WORK.KZ
ev(27.4, 'shim1', .25, .2, .6)

# реверб (простые задержки)
rv = np.zeros_like(send)
for d, g in [(.029, .5), (.047, .42), (.071, .35), (.113, .28), (.167, .2), (.241, .14), (.33, .09)]:
    k = int(d * SR); rv[k:, 0] += send[:-k, 0] * g; k2 = int(d * 1.07 * SR); rv[k2:, 1] += send[:-k2, 1] * g
sfx = bus + rv * .5
# под голосом SFX тише
venv = np.convolve(np.abs(vbus[:, 0]), np.ones(4800) / 4800, mode='same'); duck = 1 - .6 * np.clip(venv / (venv.max() + 1e-9) * 3, 0, 1)
mix = sfx * duck[:, None] * .8 + vbus
mix /= np.max(np.abs(mix)) * 1.12
fade = int(.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
w = wave.open('mix.wav', 'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype('<i2').tobytes()); w.close()
print('ok', mix.shape[0] / SR)
