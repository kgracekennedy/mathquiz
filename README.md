# Math Practice

Single-session iPad-friendly math practice for addition and subtraction.

## Current Scope
This version includes:
- a visible mode toggle with `Regular` and `Challenge`
- 10 problems per session
- 5 addition and 5 subtraction problems
- structured difficulty behind the scenes, including no-regrouping, regrouping, no-borrow, borrowing, and near-miss subtraction
- default immediate start in Regular mode, with mode changes starting a fresh set
- challenge mode with mostly regrouping, borrowing, and near-miss problems plus a small number of four-digit confidence items
- problem quality rules to avoid duplicate or overly similar prompts in one session
- positive subtraction results only
- retry until correct
- encouraging retry feedback after wrong answers
- automatic local-only session recovery after refresh or reopen, with a start-over option
- accessible-by-default styling with larger touch targets and stronger focus states
- optional read-aloud for the current problem when the browser supports speech synthesis
- on-screen parent summary with first-try accuracy, average time to correct, missed problems, and attempt counts

## Product Notes
- no login, email, or long-term storage in version 1
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
