// app.js
// Location: js/app.js
//
// All application logic for Creobotics: offline auth (localStorage-backed),
// progress tracking, module-locking rules, quiz engine, and simple
// client-side view routing. No backend/server is required — everything
// works after the static files are hosted (or even opened locally).

/* ============================================================
   STORAGE LAYER
   All persisted data lives in localStorage under these keys:
   - creo_users            : JSON array of { name, email, passwordHash }
   - creo_session          : email of the currently logged-in user (or absent)
   - creo_theme            : "light" | "dark"
   - creo_progress_<email> : JSON progress object for that user
   ============================================================ */

const STORAGE_KEYS = {
  users: "creo_users",
  session: "creo_session",
  theme: "creo_theme",
};

function progressKey(email) {
  return `creo_progress_${email}`;
}

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function initialProgress() {
  const unlocked = {}, completed = {}, highest = {}, history = {};
  MODULES.forEach((m, i) => {
    unlocked[m.id] = i === 0; // only the first module starts unlocked
    completed[m.id] = false;
    highest[m.id] = 0;
    history[m.id] = [];
  });
  return { unlocked, completed, highest, history };
}

function loadProgress(email) {
  const raw = localStorage.getItem(progressKey(email));
  return raw ? JSON.parse(raw) : initialProgress();
}

function saveProgress(email, progress) {
  localStorage.setItem(progressKey(email), JSON.stringify(progress));
}

/* ============================================================
   PASSWORD HASHING (SHA-256 via the Web Crypto API)
   Passwords are never stored in plain text.
   ============================================================ */

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ============================================================
   AUTH
   ============================================================ */

function emailExists(email) {
  return loadUsers().some((u) => u.email.toLowerCase() === email.toLowerCase());
}

async function registerUser(name, email, password) {
  if (emailExists(email)) {
    return "An account with this email already exists.";
  }
  const users = loadUsers();
  users.push({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
  });
  saveUsers(users);
  return null; // success
}

async function loginUser(email, password) {
  const users = loadUsers();
  const hash = await hashPassword(password);
  const match = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === hash
  );
  if (!match) return "Invalid email or password.";
  localStorage.setItem(STORAGE_KEYS.session, match.email);
  return null;
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getCurrentUser() {
  const email = localStorage.getItem(STORAGE_KEYS.session);
  if (!email) return null;
  return loadUsers().find((u) => u.email === email) || null;
}

/* ---- Change password (user is logged in and knows their current password) ---- */
async function changeUserPassword(email, currentPassword, newPassword) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return "Account not found.";

  const currentHash = await hashPassword(currentPassword);
  if (users[idx].passwordHash !== currentHash) return "Current password is incorrect.";

  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return null; // success
}

/* ---- Change email (user is logged in and knows their current password) ----
   Also migrates the user's saved progress from the old email-keyed storage
   entry to the new one, and updates the active session. */
async function changeUserEmail(oldEmail, currentPassword, newEmail) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === oldEmail);
  if (idx === -1) return "Account not found.";

  const currentHash = await hashPassword(currentPassword);
  if (users[idx].passwordHash !== currentHash) return "Current password is incorrect.";

  const normalizedNew = newEmail.trim().toLowerCase();
  if (!/^[\w.\-]+@[\w-]+\.[\w.\-]+$/.test(normalizedNew)) return "Enter a valid email address.";
  if (users.some((u) => u.email.toLowerCase() === normalizedNew && u.email !== oldEmail)) {
    return "That email is already used by another account.";
  }

  // Move this user's saved progress over to the new email key before
  // renaming the account, so no quiz history/unlocks are lost.
  const progress = loadProgress(oldEmail);
  users[idx].email = normalizedNew;
  saveUsers(users);
  saveProgress(normalizedNew, progress);
  localStorage.removeItem(progressKey(oldEmail));
  localStorage.setItem(STORAGE_KEYS.session, normalizedNew);
  return null; // success
}

/* ---- Forgot password (user is logged OUT and does not know their password) ----
   NOTE: Since Creobotics has no backend/email server, there is no way to send
   a real verification link. This flow simply lets someone reset the password
   for a given email directly. This is fine for a personal/offline learning
   app, but should NOT be used as-is for an app protecting sensitive data. */
async function resetPasswordForgot(email, newPassword) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (idx === -1) return "No account found with that email.";

  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return null; // success
}

/* ============================================================
   PROGRESS / MODULE LOCKING RULES
   ============================================================ */

const PASSING_SCORE = 80;

function recordQuizAttempt(email, moduleId, scorePercent) {
  const progress = loadProgress(email);
  progress.history[moduleId] = [...(progress.history[moduleId] || []), scorePercent];
  if (scorePercent > (progress.highest[moduleId] || 0)) {
    progress.highest[moduleId] = scorePercent;
  }
  if (scorePercent >= PASSING_SCORE) {
    progress.completed[moduleId] = true;
    const nextId = moduleId + 1;
    if (MODULES.find((m) => m.id === nextId)) {
      progress.unlocked[nextId] = true;
    }
  }
  saveProgress(email, progress);
  return progress;
}

function completionPercentage(progress) {
  const total = MODULES.length;
  const done = Object.values(progress.completed).filter(Boolean).length;
  return Math.round((done / total) * 100);
}

/* ============================================================
   UI STATE + HELPERS
   ============================================================ */

const state = {
  user: null,
  progress: null,
  currentPage: "home",
  activeModuleId: null,
  calendarOffset: 0,
  quiz: { questions: [], index: 0, answers: [] },
};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function showModal({ title, body, confirmLabel, confirmClass = "btn-primary", onConfirm }) {
  const root = $("#modal-root");
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="modal-cancel">Cancel</button>
          <button class="btn ${confirmClass}" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    </div>`;
  root.querySelector("#modal-cancel").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#modal-confirm").addEventListener("click", () => {
    root.innerHTML = "";
    onConfirm();
  });
}

/* A modal variant that renders one or more input fields (used for changing
   email/password and the forgot-password flow). `onSubmit` receives an
   object of { fieldId: value } and should return an error string to keep
   the modal open and show that message, or null/undefined on success
   (in which case the modal closes automatically). */
function showFormModal({ title, description, fields, confirmLabel, onSubmit }) {
  const root = $("#modal-root");
  const fieldsHtml = fields
    .map(
      (f) => `
    <div class="field" style="text-align:left;">
      <label for="modal-${f.id}">${f.label}</label>
      <div class="input-wrap">
        <input id="modal-${f.id}" type="${f.type || "text"}" placeholder="${f.placeholder || ""}" autocomplete="${f.autocomplete || "off"}" />
      </div>
    </div>`
    )
    .join("");

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="text-align:left; max-width:380px;">
        <h3 style="text-align:center;">${title}</h3>
        ${description ? `<p style="text-align:center;">${description}</p>` : ""}
        <div id="modal-form-error" class="error-banner hidden"></div>
        ${fieldsHtml}
        <div class="modal-actions" style="margin-top:4px;">
          <button class="btn btn-outline" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    </div>`;

  root.querySelector("#modal-cancel").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#modal-confirm").addEventListener("click", async () => {
    const values = {};
    fields.forEach((f) => (values[f.id] = document.getElementById(`modal-${f.id}`).value));

    const errBox = document.getElementById("modal-form-error");
    errBox.classList.add("hidden");

    const err = await onSubmit(values);
    if (err) {
      errBox.textContent = err;
      errBox.classList.remove("hidden");
    } else {
      root.innerHTML = "";
    }
  });
}

function switchAuthView(target) {
  $("#view-login").classList.toggle("hidden", target !== "login");
  $("#view-signup").classList.toggle("hidden", target !== "signup");
  $("#view-app").classList.add("hidden");
}

function enterApp() {
  $("#view-login").classList.add("hidden");
  $("#view-signup").classList.add("hidden");
  $("#view-app").classList.remove("hidden");
  state.progress = loadProgress(state.user.email);
  navigate("home");
}

/* ============================================================
   ROUTING / PAGE RENDERING
   ============================================================ */

function navigate(page, opts = {}) {
  state.currentPage = page;
  if (opts.moduleId !== undefined) state.activeModuleId = opts.moduleId;

  $all(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.page === page));
  $all(".bottom-nav-item").forEach((el) => el.classList.toggle("active", el.dataset.page === page));

  const main = $("#main-content");
  switch (page) {
    case "home": main.innerHTML = renderHome(); attachHomeEvents(); break;
    case "modules": main.innerHTML = renderModuleList(); attachModuleListEvents(); break;
    case "lesson": main.innerHTML = renderLesson(state.activeModuleId); attachLessonEvents(); break;
    case "quiz": main.innerHTML = renderQuizStart(state.activeModuleId); attachQuizEvents(); break;
    case "quiz-result": main.innerHTML = renderQuizResult(opts.result); attachResultEvents(opts.result); break;
    case "profile": main.innerHTML = renderProfile(); break;
    case "settings": main.innerHTML = renderSettings(); attachSettingsEvents(); break;
    case "about": main.innerHTML = renderAbout(); break;
    default: main.innerHTML = "<p>Page not found.</p>";
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ---- Home ---- */
/* ---- Mini calendar (used in the Dashboard's right panel) ---- */
function getCalendarCells(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing++, muted: true });
  }
  return cells;
}

function renderMiniCalendar() {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + state.calendarOffset, 1);
  const monthLabel = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cells = getCalendarCells(base);
  const isCurrentMonth = state.calendarOffset === 0;
  const dow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return `
    <div class="card">
      <div class="mini-cal-header">
        <div class="mc-title">${monthLabel}</div>
        <div class="mini-cal-nav">
          <button id="cal-prev" type="button">&lsaquo;</button>
          <button id="cal-next" type="button">&rsaquo;</button>
        </div>
      </div>
      <div class="mini-cal-grid">
        ${dow.map((d) => `<div class="mc-dow">${d}</div>`).join("")}
        ${cells
          .map((c) => {
            const isToday = isCurrentMonth && !c.muted && c.day === today.getDate();
            return `<div class="mc-day ${c.muted ? "muted" : ""} ${isToday ? "today" : ""}">${c.day}</div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

/* Small ring used inside each "Quiz Progress" row */
function renderSmallRing(percent) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return `
    <div class="progress-ring-sm">
      <svg viewBox="0 0 40 40">
        <circle class="prs-bg" cx="20" cy="20" r="${r}"></circle>
        <circle class="prs-fg" cx="20" cy="20" r="${r}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="prs-label">${percent}%</div>
    </div>
  `;
}

function findContinueModuleId() {
  const next = MODULES.find((m) => state.progress.unlocked[m.id] && !state.progress.completed[m.id]);
  return next ? next.id : MODULES[0].id;
}

/* ---- Dashboard (Home) ---- */
function renderHome() {
  const p = state.progress;
  const continueId = findContinueModuleId();

  // Feature row: spotlight up to 3 modules the learner hasn't finished yet,
  // starting with whatever "Continue Learning" points to. If everything is
  // finished, just show the first 3 modules instead.
  const notCompleted = MODULES.filter((m) => !p.completed[m.id]);
  const featured = (notCompleted.length ? notCompleted : MODULES)
    .slice()
    .sort((a, b) => (a.id === continueId ? -1 : b.id === continueId ? 1 : a.id - b.id))
    .slice(0, 3);

  // Quiz Progress list: continue-module first (highlighted), then the next
  // couple of unlocked modules — mirrors the "Homework progress" panel.
  const unlockedModules = MODULES.filter((m) => p.unlocked[m.id]);
  const progressList = [
    ...unlockedModules.filter((m) => m.id === continueId),
    ...unlockedModules.filter((m) => m.id !== continueId),
  ].slice(0, 3);

  const initials = state.user.name.trim().charAt(0).toUpperCase() || "?";

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Welcome back, ${escapeHtml(state.user.name)}</div>
      </div>
    </div>

    <div class="dash-grid">
      <div>
        <div class="dash-section-title">
          <h3>Continue Learning</h3>
        </div>
        <div class="feature-row">
          ${featured
            .map((m) => {
              const unlocked = p.unlocked[m.id];
              return `
              <div class="feature-card ${unlocked ? "" : "locked"}" style="background:${m.color};" data-module-id="${m.id}">
                <div>
                  <div class="fc-icon">${m.id}</div>
                  <div class="fc-title">${escapeHtml(m.title)}</div>
                  <div class="fc-sub">${escapeHtml(m.subtitle)}</div>
                </div>
                <div class="fc-footer">
                  <span class="fc-sub">${unlocked ? "Unlocked" : "Locked"}</span>
                  <div class="fc-arrow">${unlocked ? "&rsaquo;" : "&ndash;"}</div>
                </div>
              </div>`;
            })
            .join("")}
        </div>

        <div class="dash-section-title">
          <h3>My Modules</h3>
          <button id="view-all-modules">View All</button>
        </div>
        <div class="card">
          <table class="course-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Best Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${MODULES.map((m) => {
                const unlocked = p.unlocked[m.id];
                const completed = p.completed[m.id];
                const score = p.highest[m.id] || 0;
                let statusLabel = "Locked", statusClass = "locked";
                if (completed) { statusLabel = "Completed"; statusClass = "done"; }
                else if (unlocked && score > 0) { statusLabel = "In Progress"; statusClass = "progress"; }
                else if (unlocked) { statusLabel = "Not Started"; statusClass = "progress"; }

                return `
                  <tr class="${unlocked ? "" : "locked"}" data-module-id="${m.id}">
                    <td>
                      <div class="course-name-cell">
                        <div class="course-mini-icon" style="background:${m.color};">${m.id}</div>
                        <div>
                          <div>${escapeHtml(m.title)}</div>
                          <div class="cn-sub">${escapeHtml(m.subtitle)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${unlocked ? `${score}%` : "—"}</td>
                    <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <aside class="right-panel">
        <div class="card profile-panel">
          <div class="avatar">${initials}</div>
          <div class="p-name">${escapeHtml(state.user.name)}</div>
          <div class="p-role">${escapeHtml(state.user.email)}</div>
        </div>

        ${renderMiniCalendar()}

        <div class="card" style="padding-top:16px;">
          <div style="font-weight:700; margin-bottom:12px;">Quiz Progress</div>
          ${progressList
            .map((m, i) => {
              const score = p.highest[m.id] || 0;
              const filled = i === 0;
              return `
              <div class="progress-item ${filled ? "filled" : "outline"}" data-module-id="${m.id}">
                ${renderSmallRing(score)}
                <div>
                  <div class="pi-title">${escapeHtml(m.title)}</div>
                  <div class="pi-sub">Module ${m.id} of ${MODULES.length}</div>
                </div>
                <div class="pi-arrow">&rsaquo;</div>
              </div>`;
            })
            .join("") || `<div style="color:var(--ink-soft); font-size:0.85rem;">No modules unlocked yet.</div>`}
        </div>
      </aside>
    </div>
  `;
}

function attachHomeEvents() {
  // Feature cards
  $all(".feature-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.moduleId);
      if (!state.progress.unlocked[id]) {
        showToast("Complete the previous module with 80%+ to unlock this one.");
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });

  // "My Modules" table rows
  $all(".course-table tbody tr").forEach((row) => {
    row.addEventListener("click", () => {
      const id = Number(row.dataset.moduleId);
      if (!state.progress.unlocked[id]) {
        showToast("Complete the previous module with 80%+ to unlock this one.");
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });

  // Quiz Progress rows (right panel)
  $all(".progress-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = Number(item.dataset.moduleId);
      navigate("lesson", { moduleId: id });
    });
  });

  const viewAllBtn = $("#view-all-modules");
  if (viewAllBtn) viewAllBtn.addEventListener("click", () => navigate("modules"));

  // Calendar navigation
  const prevBtn = $("#cal-prev");
  const nextBtn = $("#cal-next");
  if (prevBtn) prevBtn.addEventListener("click", () => { state.calendarOffset--; navigate("home"); });
  if (nextBtn) nextBtn.addEventListener("click", () => { state.calendarOffset++; navigate("home"); });
}

/* ---- Module list ---- */
function renderModuleCard(m) {
  const unlocked = state.progress.unlocked[m.id];
  const completed = state.progress.completed[m.id];
  const score = state.progress.highest[m.id] || 0;
  let scoreLine = "";
  if (completed) {
    scoreLine = `<div class="module-score pass">Best score: ${score}%</div>`;
  } else if (score > 0) {
    scoreLine = `<div class="module-score retry">Last score: ${score}% (try again)</div>`;
  }
  const statusIcon = !unlocked ? "Locked" : completed ? "Done" : "Go";
  return `
    <div class="card module-card ${unlocked ? "" : "locked"}" data-module-id="${m.id}" style="margin-bottom:12px;">
      <div class="module-icon" style="background:${m.color};">${m.id}</div>
      <div class="module-info">
        <div class="m-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
        <div class="m-sub">${escapeHtml(m.subtitle)}</div>
        ${scoreLine}
      </div>
      <div class="module-status">${statusIcon}</div>
    </div>`;
}

function attachModuleCardClicks(containerSel) {
  $all(`${containerSel} .module-card`).forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.moduleId);
      if (!state.progress.unlocked[id]) {
        showToast("Complete the previous module with 80%+ to unlock this one.");
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });
}

function renderModuleList() {
  return `
    <div class="topbar">
      <div>
        <div class="page-title">Robotics eBook</div>
        <div class="page-subtitle">5 modules ( pass each quiz with 80%+ to unlock the next )</div>
      </div>
    </div>
    <div id="full-module-list">${MODULES.map(renderModuleCard).join("")}</div>
  `;
}

function attachModuleListEvents() {
  attachModuleCardClicks("#full-module-list");
}

/* ---- Lesson ---- */
function renderContentBlock(block) {
  if (block.type === "h") return `<h2>${escapeHtml(block.text)}</h2>`;
  if (block.type === "p") return `<p>${escapeHtml(block.text)}</p>`;
  if (block.type === "ul") {
    return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
  }
  return "";
}

function renderLesson(moduleId) {
  const m = MODULES.find((x) => x.id === moduleId);
  return `
    <div class="lesson-hero" style="background: linear-gradient(135deg, ${m.color}, var(--purple));">
      <div class="hero-badge">Module ${m.id} of ${MODULES.length}</div>
      <h1>${escapeHtml(m.title)}</h1>
    </div>
    <div class="lesson-body">
      <p style="font-weight:600; color:#2d07a0; margin-bottom:6px;">${escapeHtml(m.subtitle)}</p>
      ${m.content.map(renderContentBlock).join("")}
      <button class="btn btn-primary" id="take-quiz-btn" style="max-width:240px; margin-top:10px;">Take the Quiz</button>
    </div>
  `;
}

function attachLessonEvents() {
  $("#take-quiz-btn").addEventListener("click", () => {
    navigate("quiz", { moduleId: state.activeModuleId });
  });
}

/* ---- Quiz ---- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuizStart(moduleId) {
  const m = MODULES.find((x) => x.id === moduleId);
  state.quiz.questions = shuffle(m.quiz);
  state.quiz.index = 0;
  state.quiz.answers = new Array(state.quiz.questions.length).fill(null);
  return renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, index, answers } = state.quiz;
  const m = MODULES.find((x) => x.id === state.activeModuleId);
  const q = questions[index];
  const pct = Math.round(((index + 1) / questions.length) * 100);
  const letters = ["A", "B", "C", "D"];

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Quiz: ${escapeHtml(m.title)}</div>
      </div>
    </div>
    <div class="quiz-progress-row">
      <span>Question ${index + 1} of ${questions.length}</span>
      <span>${pct}%</span>
    </div>
    <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%;"></div></div>

    <div class="card">
      <div class="quiz-question">${escapeHtml(q.q)}</div>
      <div id="quiz-options">
        ${q.options.map((opt, i) => `
          <div class="option-tile ${answers[index] === i ? "selected" : ""}" data-option="${i}">
            <div class="option-letter">${letters[i]}</div>
            <div>${escapeHtml(opt)}</div>
          </div>`).join("")}
      </div>
      <div class="quiz-nav-row">
        ${index > 0 ? `<button class="btn btn-outline" id="quiz-prev">← Previous</button>` : ""}
        <button class="btn btn-primary" id="quiz-next" ${answers[index] === null ? "disabled style='opacity:.5;'" : ""}>
          ${index === questions.length - 1 ? "Submit" : "Next →"}
        </button>
      </div>
    </div>
  `;
}

function attachQuizEvents() {
  const container = $("#main-content");

  function refresh() {
    container.innerHTML = renderQuizQuestion();
    attachQuizEvents();
  }

  $all("#quiz-options .option-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      state.quiz.answers[state.quiz.index] = Number(tile.dataset.option);
      refresh();
    });
  });

  const prevBtn = $("#quiz-prev");
  if (prevBtn) prevBtn.addEventListener("click", () => { state.quiz.index--; refresh(); });

  const nextBtn = $("#quiz-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (state.quiz.answers[state.quiz.index] === null) return;
      if (state.quiz.index < state.quiz.questions.length - 1) {
        state.quiz.index++;
        refresh();
      } else {
        submitQuiz();
      }
    });
  }
}

function submitQuiz() {
  const { questions, answers } = state.quiz;
  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
  const score = Math.round((correct / questions.length) * 100);

  state.progress = recordQuizAttempt(state.user.email, state.activeModuleId, score);

  navigate("quiz-result", {
    result: { moduleId: state.activeModuleId, score, correct, total: questions.length },
  });
}

/* ---- Quiz result ---- */
function renderQuizResult(result) {
  const m = MODULES.find((x) => x.id === result.moduleId);
  const passed = result.score >= PASSING_SCORE;
  const hasNext = MODULES.some((x) => x.id === result.moduleId + 1);

  return `
    <div class="result-wrap" style="margin-top:20px;">
      <div class="card">
        <div class="result-icon">${passed ? "Passed" : "Try Again"}</div>
        <h2>${passed ? "Congratulations!" : "Almost There!"}</h2>
        <p style="color:var(--ink-soft); margin:8px 0 0;">
          ${passed ? `You passed "${escapeHtml(m.title)}"` : `You didn't reach 80% on "${escapeHtml(m.title)}"`}
        </p>
        <div class="result-score ${passed ? "pass" : "fail"}">${result.score}%</div>
        <p style="color:var(--ink-soft);">${result.correct} out of ${result.total} correct</p>
        <p style="color:var(--ink-soft); font-size:0.8rem; margin-top:6px;">Passing score: ${PASSING_SCORE}%</p>

        ${passed && hasNext ? `<div class="unlock-banner">Module ${result.moduleId + 1} is now unlocked!</div>` : ""}

        <div style="margin-top:22px; display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-primary" id="result-primary-btn">
            ${passed ? "Back to Modules" : "Retry Quiz"}
          </button>
          <button class="btn btn-outline" id="result-home-btn">Back to Home</button>
        </div>
      </div>
    </div>
  `;
}

function attachResultEvents(result) {
  const passed = result.score >= PASSING_SCORE;
  $("#result-primary-btn").addEventListener("click", () => {
    if (passed) navigate("modules");
    else navigate("quiz", { moduleId: result.moduleId });
  });
  $("#result-home-btn").addEventListener("click", () => navigate("home"));
}

/* ---- Profile ---- */
function renderProfile() {
  const p = state.progress;
  const pct = completionPercentage(p);
  const initials = state.user.name.trim().charAt(0).toUpperCase() || "?";
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (pct / 100) * circumference;

  const rows = MODULES.map((m) => {
    const unlocked = p.unlocked[m.id];
    const completed = p.completed[m.id];
    const score = p.highest[m.id] || 0;
    let sub = "Locked";
    if (unlocked) sub = score > 0 ? `Highest score: ${score}%` : "Not attempted yet";
    const icon = completed ? "Done" : unlocked ? "Unlocked" : "Locked";
    return `
      <div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
        <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--ink-soft); background:#f1ecfd; padding:4px 9px; border-radius:999px; flex-shrink:0;">${icon}</div>
        <div style="flex:1;">
          <div style="font-weight:700;">Module ${m.id}: ${escapeHtml(m.title)}</div>
          <div style="color:var(--ink-soft); font-size:0.85rem;">${sub}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="topbar">
      <div class="page-title">Profile</div>
    </div>
    <div class="card" style="text-align:center; margin-bottom:22px;">
      <div class="avatar" style="width:84px; height:84px; font-size:2rem; margin:0 auto 14px;">${initials}</div>
      <div style="font-weight:700; font-size:1.2rem;">${escapeHtml(state.user.name)}</div>
      <div style="color:var(--ink-soft); font-size:0.9rem; margin-bottom:16px;">${escapeHtml(state.user.email)}</div>
      <div class="ring-wrap" style="width:110px; height:110px; margin:0 auto;">
        <svg viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="46"></circle>
          <circle class="ring-fg" cx="50" cy="50" r="46"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-label" style="font-size:1.3rem;">${pct}%</div>
      </div>
      <div style="color:var(--ink-soft); font-size:0.8rem; margin-top:6px;">Overall Progress</div>
    </div>
    <h3 style="color:var(--white); margin-bottom:12px;">Module Scores</h3>
    ${rows}
  `;
}

/* ---- Settings ---- */
function renderSettings() {
  const isDark = document.body.classList.contains("dark");
  return `
    <div class="topbar"><div class="page-title">Settings</div></div>

    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">Dark Mode</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">Switch between light and dark theme</div>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" id="dark-toggle" ${isDark ? "checked" : ""} />
          <span class="switch-track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">Reset Progress</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">Lock all modules and clear scores</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="reset-btn">Reset</button>
      </div>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Account</h3>
    <div class="card">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">Change Email</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">${escapeHtml(state.user.email)}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="change-email-btn">Change</button>
      </div>
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">Change Password</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">Update your account password</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="change-password-btn">Change</button>
      </div>
    </div>
  `;
}

function attachSettingsEvents() {
  $("#dark-toggle").addEventListener("change", (e) => {
    document.body.classList.toggle("dark", e.target.checked);
    localStorage.setItem(STORAGE_KEYS.theme, e.target.checked ? "dark" : "light");
  });

  $("#reset-btn").addEventListener("click", () => {
    showModal({
      title: "Reset Progress?",
      body: "This will lock all modules except Module 1 and clear every quiz score. This cannot be undone.",
      confirmLabel: "Reset",
      confirmClass: "btn-danger",
      onConfirm: () => {
        state.progress = initialProgress();
        saveProgress(state.user.email, state.progress);
        showToast("Progress has been reset.");
        navigate("settings");
      },
    });
  });

  $("#change-email-btn").addEventListener("click", () => {
    showFormModal({
      title: "Change Email",
      description: "Enter your current password to confirm it's you.",
      fields: [
        { id: "currentPassword", label: "Current Password", type: "password", placeholder: "••••••••" },
        { id: "newEmail", label: "New Email", type: "email", placeholder: "you@example.com" },
      ],
      confirmLabel: "Save",
      onSubmit: async ({ currentPassword, newEmail }) => {
        if (!currentPassword) return "Enter your current password.";
        if (!newEmail) return "Enter a new email address.";

        const err = await changeUserEmail(state.user.email, currentPassword, newEmail);
        if (err) return err;

        state.user = getCurrentUser();
        showToast("Email updated successfully.");
        navigate("settings");
        return null;
      },
    });
  });

  $("#change-password-btn").addEventListener("click", () => {
    showFormModal({
      title: "Change Password",
      description: "Enter your current password, then choose a new one.",
      fields: [
        { id: "currentPassword", label: "Current Password", type: "password", placeholder: "••••••••" },
        { id: "newPassword", label: "New Password", type: "password", placeholder: "At least 6 characters" },
        { id: "confirmPassword", label: "Confirm New Password", type: "password", placeholder: "Repeat new password" },
      ],
      confirmLabel: "Save",
      onSubmit: async ({ currentPassword, newPassword, confirmPassword }) => {
        if (!currentPassword) return "Enter your current password.";
        if (newPassword.length < 6) return "New password must be at least 6 characters.";
        if (newPassword !== confirmPassword) return "New passwords do not match.";

        const err = await changeUserPassword(state.user.email, currentPassword, newPassword);
        if (err) return err;

        showToast("Password updated successfully.");
        return null;
      },
    });
  });
}

/* ---- About ---- */
function renderAbout() {
  return `
    <div class="topbar"><div class="page-title">About</div></div>
    <div class="card" style="max-width:800px; text-align:center; margin:0 auto;">
      <img src="images/app_logo.png" alt="Creobotics logo" style="width:64px; height:64px; object-fit:contain; margin:0 auto;" />
      <h2 style="margin:10px 0 2px;">Creobotics</h2>
      <p style="color:var(--ink-soft); font-size:0.85rem;">Version 1.0.0 (Web)</p>
      <p style="margin-top:18px; line-height:1.6; text-align:left;">
        Creobotics is a browser-based educational app that teaches the fundamentals of
        robotics through five structured modules, each paired with a 10-question-style quiz.
        Learn about robot components, hardware, assembly, app-based control, and autonomous
        line-following — all from any device with a web browser.
      </p>
      <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />
      <p style="font-weight:600;">Built with HTML, CSS &amp; JavaScript</p>
      <p style="color:var(--ink-soft); font-size:0.8rem;">
        Your account and progress are stored only in this browser (localStorage) —
        nothing is sent to a server.
      </p>
    </div>
  `;
}

/* ============================================================
   MISC HELPERS
   ============================================================ */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   EVENT WIRING (auth forms, nav clicks, theme restore)
   ============================================================ */

function init() {
  // Restore saved theme
  if (localStorage.getItem(STORAGE_KEYS.theme) === "dark") {
    document.body.classList.add("dark");
  }

  // Restore session, if any
  const existingUser = getCurrentUser();
  if (existingUser) {
    state.user = existingUser;
    enterApp();
  }

  // Auth view switching
  $("#go-signup").addEventListener("click", () => switchAuthView("signup"));
  $("#go-login").addEventListener("click", () => switchAuthView("login"));

  // Forgot password: since there is no backend/email service, this simply
  // lets someone reset the password for a known email address directly.
  $("#forgot-password-link").addEventListener("click", () => {
    showFormModal({
      title: "Reset Your Password",
      description: "Enter the email on your account and choose a new password.",
      fields: [
        { id: "email", label: "Email", type: "email", placeholder: "you@example.com", autocomplete: "email" },
        { id: "newPassword", label: "New Password", type: "password", placeholder: "At least 6 characters" },
        { id: "confirmPassword", label: "Confirm New Password", type: "password", placeholder: "Repeat new password" },
      ],
      confirmLabel: "Reset Password",
      onSubmit: async ({ email, newPassword, confirmPassword }) => {
        if (!email) return "Enter your account email.";
        if (newPassword.length < 6) return "New password must be at least 6 characters.";
        if (newPassword !== confirmPassword) return "Passwords do not match.";

        const err = await resetPasswordForgot(email, newPassword);
        if (err) return err;

        showToast("Password reset! Please log in with your new password.");
        $("#login-email").value = email.trim().toLowerCase();
        return null;
      },
    });
  });

  // Password visibility toggles
  $all(".toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "Hide" : "Show";
    });
  });

  // Login form
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;
    const errBox = $("#login-error");
    errBox.classList.add("hidden");

    const err = await loginUser(email, password);
    if (err) {
      errBox.textContent = err;
      errBox.classList.remove("hidden");
      return;
    }
    state.user = getCurrentUser();
    enterApp();
  });

  // Signup form
  $("#signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#signup-name").value.trim();
    const email = $("#signup-email").value.trim();
    const password = $("#signup-password").value;
    const confirm = $("#signup-confirm").value;
    const errBox = $("#signup-error");
    errBox.classList.add("hidden");

    if (name.length < 2) return showFieldError(errBox, "Please enter your full name.");
    if (!/^[\w.\-]+@[\w-]+\.[\w.\-]+$/.test(email)) return showFieldError(errBox, "Enter a valid email address.");
    if (password.length < 6) return showFieldError(errBox, "Password must be at least 6 characters.");
    if (password !== confirm) return showFieldError(errBox, "Passwords do not match.");

    const err = await registerUser(name, email, password);
    if (err) return showFieldError(errBox, err);

    showToast("Account created! Please log in.");
    switchAuthView("login");
    $("#login-email").value = email;
  });

  function showFieldError(box, msg) {
    box.textContent = msg;
    box.classList.remove("hidden");
  }

  // Sidebar + bottom nav
  $all(".nav-item, .bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.page));
  });

  // Sidebar logout (with confirmation, same as Settings)
  $("#sidebar-logout").addEventListener("click", () => {
    showModal({
      title: "Log Out?",
      body: "You will need to log in again to continue.",
      confirmLabel: "Log Out",
      confirmClass: "btn-danger",
      onConfirm: () => {
        logoutUser();
        state.user = null;
        state.progress = null;
        switchAuthView("login");
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", init);