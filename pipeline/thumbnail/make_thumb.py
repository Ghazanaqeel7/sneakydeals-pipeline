#!/usr/bin/env python3
"""Make the vertical thumbnail (1080x1920) for a job.

Usage: python3 pipeline/thumbnail/make_thumb.py jobs/<id>
Reads jobs/<id>/meta.json:
  "thumb": {"frame": 80, "box": "PEPSI", "line1": "GOT PAID IN", "line2": "SUBMARINES?!", "box_color": "#2f6db3"}
- frame: a frame number of the hook shot where the key object is big and clear (look at stills first)
- box: the brand / subject word in a coloured box (brand NAME only, never a logo)
- line1 white, line2 big yellow: the shock. Never reveal the twist or the year.
- optional "sign": {"text": "LAND FOR SALE", "x": 25, "y": 870, "w": 590, "size": 92, "rotate": -3}
  draws a big, clean sign board over the scene (use it when the owner wants a prop/sign bigger or easier to read;
  place it over the 3D sign so the original post still shows under it). Coordinates are on the 1080x1920 canvas.
- optional "cups": {"x": 10, "y": 1330, "rows": 4, "size": 150, "label": "PUDDING"} draws a pyramid of big cartoon
  cups (generic, no logo) so the object itself grabs attention; pair it with a "sign" for the number.
- optional "bg_shift": px to move the scene up (+) or down (-) so the key object lands inside the safe square
  (the scene is zoomed just enough to cover the gap); optional "bg_zoom" (e.g. 1.2) to make the scene bigger.
SAFE ZONE: YouTube channel grid, Instagram grid (3:4), Facebook (4:5 / 1:1) crop the 9:16 image around its centre.
All text, signs and cups MUST stay inside the centre square x 60-1020, y 430-1490 (the 1:1 crop), so the
thumbnail reads fully everywhere. The headline is auto-shrunk to fit 960 px wide; sign/cups y must be 950-1490.
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
sg = t.get('sign'); sign_html = ''
if sg:
    sign_html = (f'<div style="position:absolute;left:{sg.get("x",25)}px;top:{sg.get("y",870)}px;width:{sg.get("w",590)}px;'
                 f'transform:rotate({sg.get("rotate",-3)}deg);background:#f6e9b8;border:14px solid #1a1414;outline:8px solid #f6e9b8;'
                 f'outline-offset:-30px;box-shadow:0 18px 0 rgba(0,0,0,.35);padding:34px 24px;text-align:center;'
                 f'font-family:\'Inter Display\',\'Arial Black\',Arial,sans-serif;font-weight:900;font-size:{sg.get("size",92)}px;'
                 f'line-height:1.02;color:#1a1414;letter-spacing:1px">{e(sg["text"])}</div>')
cp = t.get('cups'); cups_html = ''
if cp:  # optional pile of big cartoon cups (generic, no logo): {"x","y","rows","size","label","pudding"}
    s = cp.get('size', 130); rows = cp.get('rows', 4); lab = e(cp.get('label', 'PUDDING')); fill = cp.get('pudding', '#6b3a1e')
    cup = (f'<svg width="{s}" height="{int(s*1.05)}" viewBox="0 0 100 105" xmlns="http://www.w3.org/2000/svg">'
           f'<path d="M8 22 L92 22 L82 100 L18 100 Z" fill="#fbf4e2" stroke="#1a1414" stroke-width="5" stroke-linejoin="round"/>'
           f'<path d="M11 44 L89 44 L86 66 L14 66 Z" fill="#e2483a" stroke="#1a1414" stroke-width="3"/>'
           f'<text x="50" y="60" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="13" fill="#fff">{lab}</text>'
           + ''.join(f'<rect x="{30+i*4}" y="74" width="{2 if i%2 else 3}" height="16" fill="#1a1414"/>' for i in range(10)) +
           f'<ellipse cx="50" cy="22" rx="44" ry="10" fill="{fill}" stroke="#1a1414" stroke-width="5"/>'
           f'<path d="M50 18 Q78 2 96 -2 L90 14 Q72 18 58 24 Z" fill="#d9dde3" stroke="#1a1414" stroke-width="4" stroke-linejoin="round"/>'
           f'</svg>')
    for r in range(rows):  # bottom row first; each row one cup shorter, centred
        n = rows - r; w = s * 0.92
        for i in range(n):
            left = cp.get('x', 20) + r * w / 2 + i * w; top = cp.get('y', 1440) + (rows - 1 - r) * s * 0.78
            rot = ((i * 7 + r * 5) % 11) - 5
            cups_html += f'<div style="position:absolute;left:{left:.0f}px;top:{top:.0f}px;transform:rotate({rot}deg);filter:drop-shadow(0 10px 0 rgba(0,0,0,.3))">{cup}</div>'
sh = int(t.get('bg_shift', 0)); k = max(float(t.get('bg_zoom', 1)), (1920 + 2 * abs(sh)) / 1920)
page = f'''<!DOCTYPE html><html><head><style>html,body{{margin:0;width:1080px;height:1920px;overflow:hidden}}
body{{background:url(file://{bg}) no-repeat;background-size:{1080*k:.0f}px {1920*k:.0f}px;background-position:{-(1080*k-1080)/2:.0f}px {-(1920*k-1920)/2-sh:.0f}px}}
.t{{position:absolute;left:60px;width:960px;text-align:center;white-space:nowrap;font-family:'Inter Display','Arial Black',Arial,sans-serif;font-weight:900;paint-order:stroke fill;-webkit-text-stroke:20px #1a1414;line-height:1}}</style></head><body>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,30,70,.25) 0%,rgba(15,30,70,.6) 24%,rgba(15,30,70,.45) 46%,rgba(0,0,0,0) 62%,rgba(0,0,0,0) 80%,rgba(20,10,5,.4) 100%)"></div>
<div id="box" style="position:absolute;top:440px;left:0;right:0;text-align:center"><span style="display:inline-block;background:{t.get('box_color','#2f6db3')};border:11px solid #1a1414;border-radius:22px;padding:4px 40px 12px;transform:rotate(-3deg);font-family:'Inter Display','Arial Black',Arial,sans-serif;font-weight:900;font-size:128px;color:#fff;letter-spacing:3px;box-shadow:0 12px 0 rgba(0,0,0,.35);white-space:nowrap">{e(t['box'])}</span></div>
{cups_html}
{sign_html}
<div class="t" id="l1" style="top:640px;font-size:104px;color:#fff">{e(t['line1'])}</div>
<div class="t" id="l2" style="top:760px;font-size:136px;color:#ffd84a;transform:rotate(-2deg)">{e(t['line2'])}</div>
<script>
// shrink any headline that is wider than the safe square (960 px) so nothing is cut on any platform
function fit(el,max,min){{let f=parseFloat(el.style.fontSize);const r=document.createRange();
 for(;f>min;f-=2){{el.style.fontSize=f+'px';r.selectNodeContents(el);if(r.getBoundingClientRect().width<=max)break;}}}}
const b=document.querySelector('#box span');fit(b,900,70);
fit(document.getElementById('l1'),940,56);fit(document.getElementById('l2'),940,60);
// stack lines under the box with even gaps
const bb=b.getBoundingClientRect();const l1=document.getElementById('l1'),l2=document.getElementById('l2');
l1.style.top=(bb.bottom+28)+'px';const h1=parseFloat(l1.style.fontSize);
l2.style.top=(bb.bottom+28+h1+18)+'px';
</script>
</body></html>'''
hp = os.path.abspath(os.path.join(tmp, 'thumb.html')); open(hp, 'w').write(page)
png = os.path.abspath(os.path.join(tmp, 'thumb.png'))
subprocess.run([ch, '--headless=new', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=1080,1920', f'--screenshot={png}', f'file://{hp}'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
from PIL import Image
Image.open(png).convert('RGB').save(os.path.join(job, 'thumbnail.jpg'), quality=92)
print('wrote', os.path.join(job, 'thumbnail.jpg'))
