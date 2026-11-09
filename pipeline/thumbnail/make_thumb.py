#!/usr/bin/env python3
"""Make the vertical thumbnail (1080x1920) for a job.

Usage: python3 pipeline/thumbnail/make_thumb.py jobs/<id>
Reads jobs/<id>/meta.json:
  "thumb": {"frame": 80, "box": "PEPSI", "line1": "GOT PAID IN", "line2": "SUBMARINES?!", "box_color": "#2f6db3"}
- frame: a frame number of the hook shot where the key object is big and clear (look at stills first)
- box: the brand / subject word in a coloured box (brand NAME only, never a logo)
- line1 white, line2 big yellow: the shock. Never reveal the twist or the year.
Renders a clean frame (no captions) with Remotion, overlays the text, writes jobs/<id>/thumbnail.jpg.
"""
import json, os, subprocess, sys, shutil, html
job = sys.argv[1].rstrip('/'); meta = json.load(open(os.path.join(job, 'meta.json'))); t = meta['thumb']
proj = os.path.join(job, 'project'); tmp = os.path.join(proj, 'out'); os.makedirs(tmp, exist_ok=True)
ch = shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
bg = os.path.abspath(os.path.join(tmp, 'thumb_bg.png'))
cmd = ['npx', 'remotion', 'still', 'src/index.jsx', 'Story', bg, f"--frame={t['frame']}", '--scale=1.5', '--gl=swangle', '--props={"noText":true}']
if ch: cmd.append(f'--browser-executable={ch}')
subprocess.run(cmd, cwd=proj, check=True, stdout=subprocess.DEVNULL)
e = lambda s: html.escape(s)
l2 = t['line2']; fs2 = 150 if len(l2) <= 10 else 128 if len(l2) <= 13 else 104
page = f'''<!DOCTYPE html><html><head><style>html,body{{margin:0;width:1080px;height:1920px;overflow:hidden}}
body{{background:url(file://{bg}) center/cover}}
.t{{position:absolute;left:30px;right:30px;text-align:center;font-family:'Inter Display','Arial Black',Arial,sans-serif;font-weight:900;paint-order:stroke fill;-webkit-text-stroke:22px #1a1414}}</style></head><body>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,30,70,.55) 0%,rgba(15,30,70,0) 38%,rgba(0,0,0,0) 70%,rgba(20,10,5,.4) 100%)"></div>
<div style="position:absolute;top:120px;left:0;right:0;text-align:center"><span style="display:inline-block;background:{t.get('box_color','#2f6db3')};border:12px solid #1a1414;border-radius:22px;padding:6px 44px 14px;transform:rotate(-3deg);font-family:'Inter Display','Arial Black',Arial,sans-serif;font-weight:900;font-size:150px;color:#fff;letter-spacing:4px;box-shadow:0 12px 0 rgba(0,0,0,.35)">{e(t['box'])}</span></div>
<div class="t" style="top:345px;font-size:112px;color:#fff;line-height:1">{e(t['line1'])}</div>
<div class="t" style="top:475px;font-size:{fs2}px;color:#ffd84a;line-height:1;transform:rotate(-2deg)">{e(l2)}</div>
</body></html>'''
hp = os.path.abspath(os.path.join(tmp, 'thumb.html')); open(hp, 'w').write(page)
png = os.path.abspath(os.path.join(tmp, 'thumb.png'))
subprocess.run([ch, '--headless=new', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=1080,1920', f'--screenshot={png}', f'file://{hp}'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
from PIL import Image
Image.open(png).convert('RGB').save(os.path.join(job, 'thumbnail.jpg'), quality=92)
print('wrote', os.path.join(job, 'thumbnail.jpg'))
