#!/usr/bin/env python3
"""Generate the narration for a job with the channel voice (free, offline Kokoro TTS).

Usage:
  python3 pipeline/scripts/make_voice.py jobs/<id>            # full narration -> jobs/<id>/RAW.wav
  python3 pipeline/scripts/make_voice.py jobs/<id> --sample   # hook only -> jobs/<id>/hook_sample.wav

Channel voice = 60% am_michael + 40% am_onyx, then a -4 dB high shelf at 2.5 kHz
(approved by the channel owner; matches his reference voice's pitch ~100-105 Hz).
NEVER change the voice without the owner's approval: the channel must sound the same every video.
Then run: python3 pipeline/scripts/prepare_voice.py jobs/<id>/RAW.wav jobs/<id>/SHOTS.txt jobs/<id>/project
"""
import os, sys, subprocess, urllib.request
CACHE = os.path.expanduser('~/.cache/sd-kokoro')
URLS = {
    'kokoro.onnx': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    'voices.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
}

def ensure_model():
    os.makedirs(CACHE, exist_ok=True)
    for name, url in URLS.items():
        p = os.path.join(CACHE, name)
        if not os.path.exists(p) or os.path.getsize(p) < 1_000_000:
            print('downloading', name); urllib.request.urlretrieve(url, p)
    try:
        import kokoro_onnx, soundfile  # noqa
    except ImportError:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', '--break-system-packages', 'kokoro-onnx', 'soundfile'], check=True)

def main():
    job = sys.argv[1].rstrip('/'); sample = '--sample' in sys.argv
    ensure_model()
    import soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(CACHE, 'kokoro.onnx'), os.path.join(CACHE, 'voices.bin'))
    lines = [l.split('|', 1)[1].strip() for l in open(os.path.join(job, 'SHOTS.txt'), encoding='utf-8') if '|' in l]
    text = lines[0] if sample else ' '.join(lines)
    st = k.get_voice_style
    voice = 0.6 * st('am_michael') + 0.4 * st('am_onyx')
    s, r = k.create(text, voice=voice, speed=1.0, lang='en-us')
    tmp = os.path.join(job, '_voice_tmp.wav'); sf.write(tmp, s, r)
    out = os.path.join(job, 'hook_sample.wav' if sample else 'RAW.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'highshelf=f=2500:g=-4', out], check=True)
    os.remove(tmp); print('wrote', out, round(len(s) / r, 2), 's')

if __name__ == '__main__':
    main()
