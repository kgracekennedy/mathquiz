# Math Practice

Single-session iPad-friendly math practice for addition and subtraction.

## Current Scope
This version includes:
- 10-problem addition and subtraction practice sessions
- `Regular Mode` and `Challenge Mode`
- retry-until-correct flow with encouraging feedback
- local-only session recovery with a start-over option
- optional read-aloud for the current problem when the browser supports speech synthesis
- an on-screen parent summary with first-try accuracy, timing, misses, and attempt counts
- touch-friendly, accessible presentation for iPad-friendly use

## Product Notes
- no login, email, or long-term storage
- designed for GitHub Pages deployment and iPad home-screen install
- future skills such as fractions should plug into the same skill-based quiz engine

Detailed product decisions and future-work ideas live in `requirements/requirements.md`.
Version-by-version product history lives in `requirements/version-history.md`.

## Local Development
This section is for someone working on the code locally.

Run these commands from the repository root:
`C:\testcodex\mathquiz`

- `npm install`
  Installs the project dependencies from `package.json`. Run this first on a new machine or after dependency changes.

- `npm run dev`
  Starts the local development server so you can open the app in a browser while making changes.

- `npm test`
  Runs the automated test suite.

- `npm run build`
  Runs the production build and type-checking used before deployment.
