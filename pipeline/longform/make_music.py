#!/usr/bin/env python3
"""Generate a royalty-free ambient bed (no downloads, no licences): slow pad chords + soft pulse, seamless.
usage: make_music.py out.wav duration_seconds [seed]"""
import sys, numpy as np, wave
out, dur = sys.argv[1], float(sys.argv[2]); seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
sr = 44100; n = int(dur * sr); rng = np.random.default_rng(seed); t = np.arange(n) / sr
f = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]]  # Am F G Em-ish, low and calm
seg = 16.0; y = np.zeros(n)
for ci in range(int(dur // seg) + 2):
    a, b = int(ci * seg * sr), min(n, int((ci + 1) * seg * sr + 3 * sr))
    if a >= n: break
    tt = t[a:b] - ci * seg; env = np.minimum(1, tt / 4) * np.minimum(1, np.maximum(0, (seg + 3 - tt) / 4))
    for m in chords[ci % 4]:
        for d in (-0.15, 0.15):
            y[a:b] += env * np.sin(2 * np.pi * f(m) * (1 + d / 100) * tt + rng.uniform(0, 6.28)) * 0.06
pulse = (np.sin(2 * np.pi * 0.25 * t) * 0.5 + 0.5) ** 3
y += np.sin(2 * np.pi * f(33) * t) * 0.05 * pulse
y *= 0.6 + 0.4 * (np.sin(2 * np.pi * t / 40) * 0.5 + 0.5)
fade = np.minimum(1, np.minimum(t / 3, (dur - t) / 4)); y = y * fade; y = y / max(1e-6, np.abs(y).max()) * 0.7
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((y * 32767).astype('<i2').tobytes())
print('music', out, dur)
