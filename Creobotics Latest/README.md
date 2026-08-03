# Creobotics — Web App

A fully client-side (no backend needed) web version of Creobotics: offline-style
account creation/login, robotics learning modules across **Grade 4 through
Grade 12 (Senior High)**, quizzes, module-locking progression, an **admin
module-upload system**, **serial-key-gated premium access**, and progress
tracking — all persisted in the browser's `localStorage`.

## Files

```
creobotics-web/
├── index.html      # Single-page app shell (auth screens + main app shell)
├── css/style.css    # All styling — gradient theme, cards, quiz UI, dark mode
└── js/
    ├── data.js       # Grade 4's 5 built-in modules + quiz questions, GRADES list
    └── app.js         # Auth, grades/admin/serial-keys, progress, routing, rendering
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

## Grades, Admin uploads, and Serial Keys

**Grade 4** ships with 5 built-in modules and is always free for every
student. **Grades 5 through 12** (11 and 12 are labeled "Senior High" in the
UI) start out completely empty — the Modules page shows them as "Coming
soon" until an admin uploads content for that grade.

**Becoming an admin:** any account can unlock the Admin page from
Settings → Admin Access → "Enter Code". The default code is `CREOADMIN`
(change the `ADMIN_CODE` constant near the top of `js/app.js` before you
deploy — this is a client-side app, so treat this as a soft gate, not real
security).

**Uploading a module (Admin page):**
- Pick a grade (5-12), title, subtitle, lesson content (blank line = new
  paragraph; a block of lines starting with `- ` becomes a bullet list), and
  one or more quiz questions (4 options each, mark the correct one, add an
  optional explanation).
- Once published, that grade immediately shows up on the Modules page as
  "available" to every student — but reaching it still requires premium
  access (see below).

**Serial keys (premium access to Grades 5-12):**
- From the Admin page, generate any number of one-time serial keys
  (`CREO-XXXX-XXXX-XXXX` format).
- A student redeems a key from the Modules page (when a premium grade has
  content) or from Settings → Grade Access.
- Redeeming a key grants that student **365 days** of access to every
  Grade 5-12 module from the moment of redemption. Once it expires, those
  grades lock again automatically (Grade 4 is unaffected either way). Each
  key can only be redeemed once.

Module unlocking *within* a grade still works the same way as before:
students start on the first module of an accessible grade and must score
80%+ on its quiz to unlock the next one in that grade.

## How data storage works

Everything is stored in the visitor's own browser via `localStorage`:
- `creo_users` — all registered accounts (passwords stored as SHA-256 hashes, never plain text; includes an `isAdmin` flag)
- `creo_session` — which account is currently logged in
- `creo_progress_<email>` — that user's completed modules and quiz scores
- `creo_custom_modules` — every module an admin has uploaded, across all grades
- `creo_serial_keys` — the pool of generated serial keys and their redemption status
- `creo_access_<email>` — a student's active premium-access window (serial key, activated date, expiry date)
- `creo_theme` — light/dark mode preference

This means each visitor's account, uploaded content, and progress live only
on the device/browser they used — there is no shared server database, so an
admin's uploaded modules and generated keys won't appear on a different
visitor's browser. If you want a shared, multi-device catalog and account
system, you'd need a real backend (e.g. Firebase Auth + Firestore, or
Supabase) — happy to help wire that up if needed.

## Content included

- Grade 4: 5 built-in modules — Elements of a Robot, Robot's Hardware,
  Assembling a Robot, Makeblock Application, Line Follow — each with
  headings, paragraphs, and bullet-point sections, plus a 6-question quiz.
- Grades 5-12: empty by default, ready for admin-uploaded content.
- Passing score: 80% — unlocks the next module in that grade; unlimited retries otherwise.

Want a real multi-device backend, per-grade serial keys instead of one pool,
or removable quiz-question rows in the Admin form? Just ask and I'll extend
`data.js` / `app.js` accordingly.
