"""Саундтрек для stickman-эпизода: эмбиент-пэд + мягкое «пианино» + низкие удары на сменах сцен.
Всё синтезируется numpy, без чужой музыки — можно публиковать без проблем с авторскими правами.
  python3 music.py ep01      (берёт длительность и начала сцен из ep01.json, который пишет render.mjs)
"""
import json, sys, wave
import numpy as np

ep = sys.argv[1] if len(sys.argv) > 1 else 'ep01'
meta = json.load(open(f'{ep}.json'))
SR = 44100
DUR = meta['total'] + 0.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    n = min(len(sig), N - i)
    a = (pan + 1) * np.pi / 4
    mix[i:i + n, 0] += sig[:n] * gain * np.cos(a)
    mix[i:i + n, 1] += sig[:n] * gain * np.sin(a)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for m in notes:
        f = hz(m)
        for d in (-0.12, 0, 0.11):  # лёгкий хорус
            fd = f * 2 ** (d / 12)
            s += np.sin(2 * np.pi * fd * t + rng.uniform(0, 6)) + 0.18 * np.sin(4 * np.pi * fd * t)
    s *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t) ** 2
    return s / (len(notes) * 3) * env(len(t), 1.2, 1.6)


def pluck(m, dur=2.5):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + k * 1.6)) / k ** 1.4 for k in range(1, 6))
    return s * env(len(t), 0.004, 0.3)


def boom(dur=2.2):
    t = np.arange(int(dur * SR)) / SR
    f = 55 * np.exp(-t * 3) + 32
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)


def riser(dur=0.6):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(30) / 30, mode='same')
    return x * np.linspace(0, 1, n) ** 2


# аккорды Am – F – C – G (минорно-светлая мотивационная гармония), по 4 с
prog = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
mel = [[76, 72, 69, 72], [72, 69, 65, 69], [72, 67, 64, 67], [74, 71, 67, 71]]
BAR = 4.0
t, i = 0.0, 0
while t < DUR - 1:
    put(pad(prog[i % 4], BAR + 1.6), t, 0.32)
    put(pad([prog[i % 4][0] - 12], BAR + 1.6), t, 0.22)
    if t >= 2.0:  # мелодия вступает после первой фразы
        for k, m in enumerate(mel[i % 4]):
            put(pluck(m), t + k * BAR / 4, 0.16, pan=0.3 * np.sin(k + i))
    t += BAR
    i += 1

for s in meta['scenes'][1:]:
    put(riser(), s - 0.6, 0.05)
    put(boom(), s, 0.5)
put(boom(3), 0.05, 0.4)

# простая «комната»: несколько задержек с затуханием
wet = np.zeros_like(mix)
for d, g in [(0.031, .5), (0.053, .4), (0.087, .33), (0.131, .27), (0.197, .2), (0.281, .14)]:
    k = int(d * SR)
    wet[k:, 0] += mix[:-k, 1] * g
    wet[k:, 1] += mix[:-k, 0] * g
out = mix + 0.45 * wet
fade = int(1.8 * SR)
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out /= np.max(np.abs(out)) / 0.89
pcm = (out * 32767).astype('<i2')
with wave.open(f'{ep}.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('записано', f'{ep}.wav', round(DUR, 1), 'с')
