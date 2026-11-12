# YouTube monetisation rulebook (Sneaky Deals)

Sources: YouTube Channel Monetisation Policies (support.google.com/youtube/answer/1311392) and YouTube Partner
Programme overview & eligibility (support.google.com/youtube/answer/72851), read 13 Nov 2026. Re-read both in the Monday
learning run once a month (first Monday) and update this file if anything changed.

## The goal
- **Fan funding (step 1):** 500 subscribers + 3 public uploads in 90 days + 3M qualified Shorts views in 90 days.
- **Ad revenue:** 1,000 subscribers + 10M qualified Shorts views in 90 days (or 4,000 long-form watch hours in 12 months).
  New applicants from 1 Feb 2027: 20M Shorts views / 8,000 watch hours. Existing members must accept the new terms in
  Studio by 31 Jan 2027.
- Qualified Shorts views = public Shorts in the Shorts feed only (private, unlisted, deleted, ads and image posts do not count).
  Shorts watch time never counts toward the 4,000 hours.
- Meeting the numbers does not guarantee acceptance: the **whole channel** is reviewed (≈1 month). First rejection: appeal
  within 21 days or reapply after 30 days; later rejections: 90 days. So the channel must be clean **before** we qualify.

## What reviewers look at (keep these perfect)
Main theme of the channel · most-viewed videos · newest videos · biggest share of watch time · titles, thumbnails,
descriptions · the About section.

## Rules every Short must pass (checked by `pipeline/scripts/policy_check.py`)
1. **Original + authentic (the "inauthentic content" policy).** Each Short is its own true story with its own angle and
   narrative arc, written by us. Not allowed: templated stories with the same situation/outcome, slideshows or scrolling
   text with little narrative, generic AI output without our own perspective. Allowed (our model): AI used for invented
   characters, scenes and backgrounds when the final video shows creative vision. → Different story, hook and structure
   every time; vary scene types; never reuse a narration.
2. **No reused content.** Never use other creators' clips, compilations, re-uploads, or reading someone else's text
   (articles/news feeds) aloud. Our scripts are rewritten in our own words from 2+ sources. Permission does not make
   reused content OK, and one bad video can demonetise the whole channel.
3. **No deceptive or shock content.** Titles and thumbnails must match what the video says. No fake disasters, fake
   deaths, "leaked"/"exposed" bait, no disturbing themes for shock value. Label dramatisation ("⚠️ Dramatised…").
4. **No AI "expert" personas on money, health, law or politics.** The narrator tells history; it never gives advice or
   poses as an advisor. Money/stock stories carry "This is history, not investment advice."
5. **Facts:** every claim has two independent sources (fact map in script.md); sources listed in the description.
6. **Metadata:** title ≤ 100 chars (we aim ≤ 60), ≤ 15 hashtags, tags ≤ 500 chars, accurate description.
7. **Creator integrity:** never buy or swap views/subs/likes, no engagement groups, no bots, no "sub4sub". Never ask
   viewers to engage with a video that breaks policy.
8. **Community Guidelines + advertiser-friendly:** no hate, harassment, graphic violence, sexual content, dangerous acts,
   misinformation; keep language and themes ad-friendly (limited-ads videos still count, but avoid them).
9. **Made for kids:** our audience is general/adult → "No, not made for kids" on every upload.

## Channel-level (Monday learning run)
- One clear theme: true business/money stories told as mini-movies. Mix of brands/eras so it never looks templated.
- Check the 5 newest + 5 most-viewed videos against the rules above; anything weak → note in the playbook and tell the owner.
- About section must say what the channel is (true stories, dramatised illustrations, sources in every description).
- Keep uploading: channels with no uploads/posts for 6 months can lose monetisation.

## Owner-only actions
Listed in `state.json` → `owner_todos` and shown on the dashboard Today page ("Only you can do these").
The production run adds a to-do when a milestone is reached (500 subs + 3M views → apply for fan funding;
1,000 subs + 10M/20M → apply for ad revenue) and posts it to Slack.
