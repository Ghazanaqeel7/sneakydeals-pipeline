#!/usr/bin/env python3
"""
Gemini draft-assist (runs on GitHub Actions, NOT inside a Claude session).

Picks the next "planned" item from docs/calendar.json (or the next owner
[LONG] idea if the calendar has none queued), asks Gemini for a first-draft
script (Short) or factmap + scene outline (Long), and writes the result to
docs/research/gemini_draft.json.

Purpose: move the bulk first-draft writing off Claude's token budget and onto
the owner's existing Gemini credits. Claude's job in PIPELINE.md / longform_guide.md
is then to READ this draft, fact-check every claim itself (Gemini drafts are
NOT trusted sources), rewrite in the channel voice, and finalize the real job
files. If no usable draft exists Claude writes from scratch exactly as before
-- this script never blocks or changes the pipeline's state machine, and it
never sets a job status.

Needs repo secret GEMINI_API_KEY. Safe to fail: on any error it leaves the
previous draft (or no draft) in place and exits 0, so it can never break a
Claude run.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CALENDAR = os.path.join(ROOT, "docs", "calendar.json")
STATE = os.path.join(ROOT, "state.json")
OUT = os.path.join(ROOT, "docs", "research", "gemini_draft.json")

MODEL = "gemini-2.5-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

SHORT_PROMPT = """You are drafting a FIRST DRAFT ONLY for a 60-second YouTube Shorts voiceover script.
Channel: Sneaky Deals. Style: a TRUE business trick / strange deal / loophole, told punchy and concrete,
short sentences, no hype adjectives, no invented dialogue. Topic: {topic}
Angle: {angle}
Working title: {title}

Output STRICT JSON only, no markdown fences, shape:
{{"draft_script": "<60-90 second voiceover script, plain text>",
 "claims": ["<each specific fact/number/date you used, one per line, so a human can verify it>"]}}
Mark nothing as confirmed -- these are claims to be checked, not facts."""

LONG_PROMPT = """You are drafting a FIRST DRAFT ONLY (not verified) for a 12-15 minute YouTube documentary
about a business rise-and-fall / worst-decision story, for later human fact-checking and rewriting.
Topic: {topic}
Channel voice: short, concrete, numbers, no hype adjectives. Structure: cold open with the outcome,
setup, one key decision, consequences, aftermath with numbers, one lesson.

Output STRICT JSON only, no markdown fences, shape:
{{"draft_outline": ["<cold open beat>", "<setup beat>", "<decision beat>", "<consequence beat>", "<aftermath beat>", "<lesson beat>"],
 "claims": ["<every specific number/date/claim you used, one per line, so a human can verify it with 2 sources>"]}}
Mark nothing as confirmed -- these are claims to be checked, not facts."""


def call_gemini(prompt, api_key):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"},
    }).encode()
    req = urllib.request.Request(
        f"{API_URL}?key={api_key}", data=body,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    return data["candidates"][0]["content"]["parts"][0]["text"]


def pick_item():
    if os.path.exists(CALENDAR):
        cal = json.load(open(CALENDAR))
        for item in cal.get("items", []):
            if item.get("status") == "planned":
                return item
    if os.path.exists(STATE):
        state = json.load(open(STATE))
        for idea in state.get("ideas", []):
            if isinstance(idea, str) and idea.startswith("[LONG]"):
                body = idea.split("|")[0].replace("[LONG]", "").strip()
                return {"format": "long", "topic": body, "angle": "", "title": body[:90]}
    return None


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set, skipping draft (owner to-do).")
        return 0

    item = pick_item()
    if not item:
        print("No planned calendar item or [LONG] idea found, nothing to draft.")
        return 0

    is_long = item.get("format") == "long"
    prompt = (LONG_PROMPT if is_long else SHORT_PROMPT).format(
        topic=item.get("topic", ""), angle=item.get("angle", ""), title=item.get("title", ""),
    )

    try:
        raw = call_gemini(prompt, api_key)
        parsed = json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, json.JSONDecodeError) as e:
        print(f"Gemini draft failed, leaving pipeline untouched: {e}")
        return 0

    draft = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "format": "long" if is_long else "short",
        "item_day": item.get("day"),
        "topic": item.get("topic"),
        "title": item.get("title"),
        "unverified": True,
        "note": "Gemini first draft, NOT fact-checked. Claude must verify every claim with its own "
                "2-source rule before using any of it in a real job file.",
        **parsed,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(draft, open(OUT, "w"), indent=2)
    print(f"Wrote draft for: {item.get('title') or item.get('topic')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
