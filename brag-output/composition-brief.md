# Hyperframes Composition Brief: Health Alert (v2 — real UI, 30s)

## Objective
Create a launch-style brag video for Health Alert from screenshots of the actual running system.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 30 seconds (explicitly requested by the user; overrides the 15–25s default)

## Source Material
- Project root: `src/frontend/` (React 19 + Vite, Plus Jakarta Sans, dark theme #111726)
- Primary files: the RUNNING APP at http://localhost:5173 (backend :5109, demo-seeded) — screenshots in `brag-output/composition/assets/shots/`: login.png, dash.png, risk.png, alerts.png, intel.png
- Product name: Health Alert (BantayHealthAI)
- Tagline / strongest claim: "Today's outbreak outlook, before the clinic opens." (login hero, verbatim)
- Key UI moments (all real screenshots, shown 1:1 with slow Ken-Burns drift only — no recreated UI):
  - login: "Sign In to Command Center" + HealthAlert/BantayHealthAI brand
  - dash: "Surveillance Command Center", "276 active monitoring sentinel nodes · 13 municipal outbreak alerts require review today", Epi-Curve with bi-LSTM projection window
  - risk: Leaflet Night-Ops map, "La Union (23)", "Pangasinan (20)", "276 Hotspots · 13 High · 35 Watch · 228 Baseline"
  - alerts: "Outbreak Alert Triage Ledger", row "Dengue hotspot: Brgy San Roque" at "New Alert" with Acknowledge button
  - intel: "Epidemiological Intelligence Matrix", "376 sentinel stations", ILI surge cards
- Copy that must appear verbatim: the five lines above + "Health Alert. See it before it spreads."

## Creative Direction
- Tone preset: polished
- Creative direction: the product proving itself — every frame is the real system
- Interpretation: slow drifts, long readable holds, soft crossfades
- Angle: no mockups. The video is evidence: this is the system, running, with data.
- Hook: the product's own headline on dark (0-3.27s)
- Outro / punchline: "Health Alert. See it before it spreads." (25.11-30s)
- Avoid: recreated UI, generic SaaS language, abstract filler, any claim not visible in the screenshots

## Visual Identity
- Background: #111726 (the app's dark theme)
- Text: #f1f5f9
- Accent: #2563eb
- Display/body font: Plus Jakarta Sans (local woff2, already in assets/fonts/)
- Lower-third chips: solid #1b243b panels, white text (contrast-safe)

## Storyboard
Per `brag-output/brag-plan.md` v2: 6 scenes, 30.0s total.
1. Promise 0-3.27 · 2. Login 3.27-6.0 · 3. Command center 6.0-13.11 · 4. Risk map 13.11-19.10 · 5a. Ledger 19.10-22.10 · 5b. Intel 22.10-25.11 · 6. Lockup 25.11-30.0

## Audio
- Music: happy-beats-business-moves-vol-12-by-ende-dot-app.mp3, fade in 0-1.5 to 0.3, hold, fade 27.5-30
- Music cue guidance: preset cues (109.96 BPM); locks at 6.00 (beat), 13.11 (strong cue), 19.10 (beat), 25.11 (beat-grid)
- SFX: impactSoft_medium_004 (0.15 pulse, 13.05 map), impactSoft_medium_001 (5.95 dash, 19.05 ledger), bong_001 (25.0 outro) — sparse, quiet
- Audio files: already in `brag-output/composition/assets/` (music + sfx + shots)

## Hyperframes Instructions
Single monolithic index.html (accepted lint warnings on structure stay as-is). One paused root timeline id "main", root data-duration 30. Screenshot <img> clips get Ken-Burns drift on inner wrappers only (never on .clip). Lower-third chips are solid panels for contrast. Run `hyperframes check` before render. Local only.
