#!/usr/bin/env python3
"""Per-scene narration with the channel voice (same recipe as make_voice.py: 60% am_michael + 40% am_onyx, -4 dB shelf @2.5k).
usage: make_voice_long.py jobs/<id>
Writes project/voiceover.wav and project/src/timing.json {duration, scenes:[{id,start,end,text}], chapters:[{title,start}]}.
Each scene gets its own audio so visuals line up exactly; 0.35 s breath between scenes, 1.2 s lead-in, 2.5 s tail for the end card."""
import os, sys, json, subprocess, urllib.request
CACHE = os.path.expanduser('~/.cache/sd-kokoro')
URLS = {'kokoro.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
        'voices.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin'}
GAP, LEAD, TAIL = 0.35, 1.2, 2.5
def ensure():
    os.makedirs(CACHE, exist_ok=True)
    for n, u in URLS.items():
        p = os.path.join(CACHE, n)
        if not os.path.exists(p) or os.path.getsize(p) < 1_000_000: urllib.request.urlretrieve(u, p)
    try: import kokoro_onnx, soundfile, numpy  # noqa
    except ImportError: subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '--break-system-packages', 'kokoro-onnx', 'soundfile', 'numpy'], check=True)
def main():
    job = sys.argv[1].rstrip('/'); P = os.path.join(job, 'project')
    sc = json.load(open(os.path.join(P, 'src', 'scenes.json'), encoding='utf-8'))['scenes']
    ensure()
    import numpy as np, soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(CACHE, 'kokoro.onnx'), os.path.join(CACHE, 'voices.bin'))
    voice = 0.6 * k.get_voice_style('am_michael') + 0.4 * k.get_voice_style('am_onyx')
    sr = 24000; chunks = [np.zeros(int(LEAD * sr), dtype='float32')]; t = LEAD; out = []; chapters = [{'title': 'Intro', 'start': 0}]
    for i, s in enumerate(sc):
        a, r = k.create(s['text'].strip(), voice=voice, speed=1.0, lang='en-us')
        assert r == sr, r
        a = a.astype('float32'); dur = len(a) / sr
        end_pad = TAIL if i == len(sc) - 1 else GAP
        out.append({'id': s['id'], 'start': round(t - (0 if i else LEAD), 3), 'end': round(t + dur + end_pad, 3), 'text': s['text']})
        if s.get('chapter'): chapters.append({'title': s['chapter'], 'start': round(max(0, t - 0.2), 1)})
        chunks += [a, np.zeros(int(end_pad * sr), dtype='float32')]; t += dur + end_pad
        print(f"{s['id']} {dur:.1f}s", flush=True)
    wav = np.concatenate(chunks); tmp = os.path.join(P, '_v.wav'); sf.write(tmp, wav, sr)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'highshelf=f=2500:g=-4', '-ar', '48000', os.path.join(P, 'voiceover.wav')], check=True); os.remove(tmp)
    # first scene starts at 0 so the lead-in silence belongs to it
    json.dump({'duration': round(t, 3), 'scenes': out, 'chapters': chapters}, open(os.path.join(P, 'src', 'timing.json'), 'w'), indent=1)
    print('total', round(t, 1), 's')
main()
