# Math Practice Requirements

## Project
Math Practice is a lightweight, iPad-friendly web app for extra math practice. The current app is a static React + Vite + PWA site deployed to GitHub Pages. It is intended for home use and should stay simple to run and easy to extend.

## Current Product State
This version currently implements:
1. A single-session quiz with 10 problems.
2. A visible mode toggle with Regular Mode and Challenge Mode options.
3. Immediate start in Regular mode, with mode changes starting a fresh set.
4. A fixed mix of 5 addition and 5 subtraction problems per session.
5. 2-digit and 3-digit operands with structured internal difficulty tiers in Regular mode.
6. Challenge mode with mostly regrouping, borrowing, and near-miss problems, plus a small number of four-digit no-carry or no-borrow confidence items.
7. Addition with no-regrouping and regrouping problem types.
8. Subtraction with no-borrow, borrowing, and near-miss problem types.
9. Subtraction with positive results only.
10. Retry-until-correct behavior on the same problem.
11. Encouraging feedback after a wrong answer.
12. An on-screen parent summary after the session.
13. Local-only session recovery after refresh or reopen, with a start-over option.
14. Kid-directed top instructions written in light second-person language.
15. A header layout that keeps the mode controls near the top-level instructions.
16. Accessible-by-default visual styling with larger touch targets, clearer focus states, and a brighter kid-friendly color palette.
17. Optional read-aloud for the current problem when browser speech synthesis is available.

## Current Reporting
The summary currently shows:
1. Problems solved.
2. Total attempts.
3. Percent correct on the first try by skill.
4. Average time to correct answer by skill.
5. Missed problems with the correct answer.
6. Number of attempts before the correct answer.

## Current Product Decisions
1. This version does not collect personal information.
2. This version does not collect parent email addresses.
3. This version does not store long-term user history.
4. This version starts immediately in Regular mode rather than using a setup form.
5. This version includes a visible mode toggle that starts a fresh set when changed.
6. This version is designed to be installable from Safari to an iPad home screen.
7. This version is addition and subtraction only.
8. The main quiz-screen instructions should address the learner directly rather than describing the child in third person.

## Non-Goals For This Version
Do not add these without revisiting the product requirements:
1. Email sending.
2. Accounts or login.
3. Cloud storage.
4. Visible countdown timers.
5. Hints or worked solutions.
6. Extra-practice branches after a wrong answer.
7. Fractions or other new skill types.

## Target User
The learner is around third-grade level and should already have firm recall of addition, subtraction, multiplication, and division facts from 0-12.

## Deliverable
The app should remain a website that works across operating systems and can be added to an iPad home screen so it feels app-like.

## Future Work Ideas
These are intentionally deferred, not rejected:
1. Fractions.
2. Additional problem types.
3. Configurable timers.
4. Hints.
5. Visual or interactive worked solutions using place-value representations.
6. Extra practice after incorrect answers.
7. Long-term progress tracking with minimal personal data.
8. Grade-level configuration.
9. Optional parent email summary.
10. Parent controls without breaking the "start immediately" rule, such as a lightweight parent-only settings area for problem count, operand size, skill mix, or grade preset.
11. High-contrast mode.
12. More useful parent summaries that identify patterns causing trouble, such as borrowing in subtraction or repeated retries on similar formats.
13. Preset practice modes such as "warm-up" and "mixed review" beyond the current Regular and Challenge choices.
14. PWA polish such as explicit offline messaging, update notifications, and install guidance.
15. Engine generalization before new skills so fractions or multiplication can plug into a dedicated session config and skill registry layer.
16. Broader tests, including additional summary accuracy checks and tests around future config options.

## Open Product Questions
1. If email is added later, should it be automatic email, mail-app draft generation, or optional only?
2. How should long-term progress be stored without collecting sensitive personal data?
3. What is the right timer behavior for this age group?
4. How should fractions fit into the skill model and reporting structure?
5. When hints are introduced, should they appear immediately after a wrong answer or only on demand?

## Implementation Notes
1. Future skills such as fractions should plug into the existing skill-based quiz/session/report pipeline.
2. Session persistence should remain local-only unless product requirements explicitly change.
3. Accessibility should remain the default presentation, not a secondary mode toggle.
4. Product-memory documents in this repo should stay committed to GitHub so future work can resume without relying on prior chat context.
