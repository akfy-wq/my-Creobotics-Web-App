# Creobotics — Web App

A fully client-side (no backend needed) web version of Creobotics: offline-style
account creation/login, 5 robotics learning modules, quizzes, module-locking
progression, and progress tracking — all persisted in the browser's
`localStorage`.

## Files

```
creobotics-web/
├── index.html      # Single-page app shell (auth screens + main app shell)
├── css/style.css    # All styling — gradient theme, cards, quiz UI, dark mode
└── js/
    ├── data.js       # The 5 modules' lesson content + quiz questions
    └── app.js         # Auth, progress/locking logic, routing, rendering
```

## Run it locally (before deploying)

No build step is required — it's plain HTML/CSS/JS. Just serve the folder:

```bash
cd creobotics-web
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly by double-clicking also works in most browsers,
but a local server is recommended because password hashing uses the Web Crypto
API, which some browsers restrict on the `file://` protocol.)

## Deploying

- **Netlify**: drag-and-drop the `creobotics-web` folder onto app.netlify.com, or connect a Git repo.

No environment variables or server config are needed — it's a static site.

## How data storage works

Everything is stored in the visitor's own browser via `localStorage`:
- `creo_users` — all registered accounts (passwords stored as SHA-256 hashes, never plain text)
- `creo_session` — which account is currently logged in
- `creo_progress_<email>` — that user's unlocked/completed modules and quiz scores
- `creo_theme` — light/dark mode preference

This means each visitor's account and progress live only on the device/browser
they used to sign up — there is no shared server database. If you later want
accounts to work across devices, you'd need to add a real backend (e.g.
Firebase Auth + Firestore, or Supabase) — happy to help wire that up if needed.

## Content included

- 5 modules: Elements of a Robot, Robot's Hardware, Assembling a Robot,
  Makeblock Application, Line Follow — each with headings, paragraphs, and
  bullet-point sections.
- 6 quiz questions per module (30 total), shuffled on every attempt.
- Passing score: 80% — unlocks the next module; unlimited retries otherwise.

Want more questions per module, additional modules, or a real multi-device
backend? Just ask and I'll extend `data.js` / `app.js` accordingly.
