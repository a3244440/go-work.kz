"""Звук ролика «Сайт под ключ за 100 000 ₸»: VFX-эффекты ElevenLabs (promo/services/sfx-el) по событиям анимации.
Голос (если есть voice.wav рядом) кладётся сверху, эффекты под ним тише."""
import os, subprocess, sys, wave
import numpy as np
import json
SR = 48000; DUR = 36.2; N = int(SR * DUR)
D = os.path.dirname(os.path.abspath(__file__)); SFX = os.path.join(D, '..', 'services', 'sfx-el')

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, '<i2').astype(float) / 32768
    i = np.argmax(np.abs(a) > .02 * np.abs(a).max()); a = a[max(0, i - 48):]
    return a / (np.abs(a).max() + 1e-9)

S = {k: load(os.path.join(SFX, k + '.mp3')) for k in ['whoosh2', 'liquid2', 'pop1', 'pop2', 'boom1', 'shim2', 'trash2']}
K = np.array(json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'warp.json'))))
bus = np.zeros(N)
def ev(t, k, g, peak=False):
    t = float(np.interp(t, K[:, 0], K[:, 1]))
    s = S[k]
    if peak: t -= np.argmax(np.abs(s)) / SR
    i = int(max(0, t) * SR); n = min(len(s), N - i); bus[i:i + n] += s[:n] * g

ev(.2, 'whoosh2', .4)
ev(.9, 'shim2', .3)
ev(1.95, 'boom1', .6, True)
for w in [4.75, 11.55, 17.55, 25.55]: ev(w, 'liquid2', .55, True)
for i in range(5): ev(5.6 + i * .65, 'pop1', .45)
ev(9.6, 'whoosh2', .35)
ev(12.2, 'whoosh2', .3)
for i in range(3): ev(13.3 + i * .45, 'trash2', .35)
ev(14.85, 'boom1', .5, True)
for a in [19.3, 20.9, 22.4]: ev(a, 'whoosh2', .35); ev(a + .55, 'pop2', .4)
ev(25.75, 'boom1', .6, True); ev(25.8, 'shim2', .35)
ev(26.85, 'pop2', .45)

bus /= np.abs(bus).max() + 1e-9
vp = os.path.join(D, 'voice.wav')
if os.path.exists(vp):
    v = load(vp)[:N]; voice = np.zeros(N); voice[:len(v)] = v
    env = np.convolve(np.abs(voice), np.ones(2400) / 2400, 'same'); duck = 1 - .5 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
    y = bus * .13 * duck + voice * .8
else:
    y = bus * .5
f = int(.5 * SR); y[-f:] *= np.linspace(1, 0, f)
pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
with wave.open(os.path.join(D, 'price.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok voice' if os.path.exists(vp) else 'ok sfx only')
