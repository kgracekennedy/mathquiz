# Version History

## Current Recorded Version

### Version 2
- Status: current version recorded on June 9, 2026
- Scope: same core single-session addition and subtraction practice, with a more kid-friendly quiz-screen presentation
- Changes in this version:
  - overall quiz-screen presentation refreshed to feel more appealing to kids while preserving accessible contrast and touch targets
  - top-level quiz instructions rewritten to speak directly to the learner in second person
  - mode buttons renamed to `Regular Mode` and `Challenge Mode`
  - mode controls moved up next to the top-level instructions for a tighter header layout
  - brighter, more playful color treatment added to replace the more serious previous palette

### Version 1
- Status: previous baseline recorded on June 9, 2026
- Scope: single-session addition and subtraction practice for a third-grade learner, delivered as a React + Vite + PWA app for GitHub Pages and iPad home-screen install
- Included:
  - 10 problems per session with a fixed 5 addition and 5 subtraction mix
  - structured difficulty tiers for addition and subtraction
  - retry-until-correct flow with encouraging feedback
  - local-only session recovery with start-over support
  - on-screen parent summary with first-try accuracy, timing, misses, and attempt counts
  - accessible-by-default UI and optional read-aloud when browser speech synthesis is available
- Explicitly excluded:
  - accounts, login, cloud storage, and personal-data collection
  - email delivery
  - visible countdown timers
  - hints, worked solutions, and extra-practice branching
  - fractions and other new skill types

## Notes
- `requirements/requirements.md` is the current product truth.
- This file is the lightweight historical record of what shipped in each version.
