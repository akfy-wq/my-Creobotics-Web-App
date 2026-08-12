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
   - creo_users            : JSON array of { name, email, school, passwordHash }
   - creo_session          : email of the currently logged-in user (or absent)
   - creo_theme            : "light" | "dark"
   - creo_progress_<email> : JSON progress object for that user
   ============================================================ */

const STORAGE_KEYS = {
  users: "creo_users",
  session: "creo_session",
  theme: "creo_theme",
  customModules: "creo_custom_modules",
  serialKeys: "creo_serial_keys",
};

function progressKey(email) {
  return `creo_progress_${email}`;
}

function accessKey(email) {
  return `creo_access_${email}`;
}

function streakKey(email) {
  return `creo_streak_${email}`;
}

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function initialProgress() {
  return { completed: {}, highest: {}, history: {} };
}

function loadProgress(email) {
  const raw = localStorage.getItem(progressKey(email));
  return raw ? JSON.parse(raw) : initialProgress();
}

function saveProgress(email, progress) {
  localStorage.setItem(progressKey(email), JSON.stringify(progress));
}

/* ============================================================
   STREAKS
   Tracks which calendar days a user has opened/used the app.
   Stored per-user as { dates: [...isoDate], current, longest, lastDate }
   ============================================================ */

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetweenISO(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}

function initialStreak() {
  return { dates: [], current: 0, longest: 0, lastDate: null };
}

function loadStreak(email) {
  const raw = localStorage.getItem(streakKey(email));
  return raw ? JSON.parse(raw) : initialStreak();
}

function saveStreak(email, streak) {
  localStorage.setItem(streakKey(email), JSON.stringify(streak));
}

// Called once whenever the user enters the app. Marks today as an
// active day and rolls the streak counter forward/reset as needed.
// Safe to call multiple times per day (a repeat call on the same day
// is a no-op beyond returning the current streak state).
function recordDailyAccess(email) {
  const streak = loadStreak(email);
  const today = todayISO();

  if (streak.lastDate === today) return streak; // already logged today

  if (streak.lastDate && daysBetweenISO(streak.lastDate, today) === 1) {
    streak.current += 1; // consecutive day
  } else {
    streak.current = 1; // first-ever visit, or the streak had a gap
  }

  streak.dates = Array.from(new Set([...streak.dates, today])).sort();
  if (streak.dates.length > 400) streak.dates = streak.dates.slice(-400); // cap history size
  streak.longest = Math.max(streak.longest || 0, streak.current);
  streak.lastDate = today;

  saveStreak(email, streak);
  return streak;
}

// Read-only view of streak status for rendering. If the user hasn't
// opened the app today AND didn't open it yesterday either, the streak
// has lapsed, so we display 0 until they log a fresh day.
function getStreakStatus(email) {
  const streak = loadStreak(email);
  const today = todayISO();
  const activeToday = streak.lastDate === today;
  let current = streak.current;
  if (!activeToday && streak.lastDate !== isoDaysAgo(1)) {
    current = 0;
  }
  return { ...streak, current, activeToday, today };
}

/* ============================================================
   MODULE CONTENT
   ============================================================ */

function loadCustomModules() {
  const raw = localStorage.getItem(STORAGE_KEYS.customModules);
  return raw ? JSON.parse(raw) : [];
}

function saveCustomModules(list) {
  localStorage.setItem(STORAGE_KEYS.customModules, JSON.stringify(list));
}

function getAllModules() {
  return [...MODULES, ...loadCustomModules()];
}

function modulesByGrade(grade) {
  return getAllModules()
    .filter((m) => m.grade === grade)
    .sort((a, b) => (a.order || a.id) - (b.order || b.id));
}

function modulesByGradeGroup(levels) {
  return getAllModules()
    .filter((m) => levels.includes(m.grade))
    .sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id));
}

function gradeHasModules(grade) {
  return getAllModules().some((m) => m.grade === grade);
}

function nextModuleId() {
  const all = getAllModules();
  return all.length ? Math.max(...all.map((m) => m.id)) + 1 : 1;
}

function addCustomModule(mod) {
  const list = loadCustomModules();
  list.push(mod);
  saveCustomModules(list);
}

function deleteCustomModule(id) {
  const list = loadCustomModules().filter((m) => m.id !== id);
  saveCustomModules(list);
}

/* ============================================================
   GRADE ACCESS
   Each serial key is tied to exactly one grade group (BUILTIN_GRADE
   for now, since Grade 4 is the only grade with content). Redeeming a
   key only ever unlocks the grade it was generated for — it does NOT
   open every grade. A student's access is stored as a list of grants
   (one per grade they've redeemed a key for), so this scales cleanly
   once more grades ship: a student could redeem a Grade-4 key and,
   later, a separate Grade-5 key, and each would unlock only its own
   grade.
   ============================================================ */

const ACCESS_DAYS = 365;

// Grades that currently have released content and can be unlocked by a
// serial key. Add a grade number here once its modules are ready.
const RELEASED_GRADES = [BUILTIN_GRADE];

function loadAccessGrants(email) {
  const raw = localStorage.getItem(accessKey(email));
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  // Migrate legacy single-grant format (from before keys were tied to a
  // specific grade) — treat it as a Grade 4 grant, the only real grade.
  return [{ ...parsed, grade: parsed.grade || BUILTIN_GRADE }];
}

function saveAccessGrants(email, grants) {
  localStorage.setItem(accessKey(email), JSON.stringify(grants));
}

function hasActiveAccess(email, grade) {
  const grants = loadAccessGrants(email);
  const now = Date.now();
  if (grade !== undefined) {
    return grants.some((g) => g.grade === grade && g.expiresAt > now);
  }
  return grants.some((g) => g.expiresAt > now);
}

function accessDaysRemaining(email, grade) {
  const grants = loadAccessGrants(email).filter((g) => grade === undefined || g.grade === grade);
  if (!grants.length) return 0;
  const latestExpiry = Math.max(...grants.map((g) => g.expiresAt));
  return Math.max(0, Math.ceil((latestExpiry - Date.now()) / (1000 * 60 * 60 * 24)));
}

function isGradeAccessible(grade, email) {
  // Belt-and-suspenders: even if a grant somehow existed for a grade
  // that hasn't shipped content yet, don't treat it as open.
  if (!RELEASED_GRADES.includes(grade)) return false;
  return hasActiveAccess(email, grade);
}

function loadSerialKeys() {
  const raw = localStorage.getItem(STORAGE_KEYS.serialKeys);
  return raw ? JSON.parse(raw) : [];
}

function saveSerialKeys(keys) {
  localStorage.setItem(STORAGE_KEYS.serialKeys, JSON.stringify(keys));
}

function generateSerialCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CREO-${group()}-${group()}-${group()}`;
}

// Generate a batch of serial keys tied to a single grade (defaults to
// Grade 4, since it's the only grade currently released). Run this from
// the console, e.g. generateSerialKeys(20, 4).
function generateSerialKeys(count, grade = BUILTIN_GRADE) {
  const keys = loadSerialKeys();
  for (let i = 0; i < count; i++) {
    keys.push({ code: generateSerialCode(), grade, usedBy: null, usedAt: null, createdAt: Date.now() });
  }
  saveSerialKeys(keys);
  return keys;
}

const DEMO_SERIAL_CODE = "CREO-DEMO-0000-0001";
function seedDemoSerialKey() {
  const keys = loadSerialKeys();
  if (!keys.some((k) => k.code === DEMO_SERIAL_CODE)) {
    keys.push({ code: DEMO_SERIAL_CODE, grade: BUILTIN_GRADE, usedBy: null, usedAt: null, createdAt: Date.now() });
    saveSerialKeys(keys);
  }
}

function redeemSerialKey(email, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return "Enter a serial key.";

  const keys = loadSerialKeys();
  const key = keys.find((k) => k.code === code);
  if (!key) return "That serial key isn't valid.";
  if (key.usedBy) return "That serial key has already been used.";

  // Older keys generated before grades were tagged default to Grade 4.
  const grade = key.grade || BUILTIN_GRADE;

  key.usedBy = email;
  key.usedAt = Date.now();
  saveSerialKeys(keys);

  const now = Date.now();
  const grants = loadAccessGrants(email);
  const grantForGrade = {
    serialKey: code,
    grade,
    activatedAt: now,
    expiresAt: now + ACCESS_DAYS * 24 * 60 * 60 * 1000,
  };

  // Redeeming a new key for a grade the student already has access to
  // renews/extends that grade rather than creating a duplicate grant.
  const existingIdx = grants.findIndex((g) => g.grade === grade);
  if (existingIdx >= 0) {
    grants[existingIdx] = grantForGrade;
  } else {
    grants.push(grantForGrade);
  }
  saveAccessGrants(email, grants);
  return null;
}

/* ============================================================
   PASSWORD HASHING
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

async function registerUser(name, email, school, password) {
  if (emailExists(email)) {
    return "An account with this email already exists.";
  }
  const users = loadUsers();
  users.push({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    school: school.trim(),
    passwordHash: await hashPassword(password),
    avatarId: null,
    nickname: null,
    profileComplete: false,
  });
  saveUsers(users);
  return null;
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

async function changeUserPassword(email, currentPassword, newPassword) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return "Account not found.";

  const currentHash = await hashPassword(currentPassword);
  if (users[idx].passwordHash !== currentHash) return "Current password is incorrect.";

  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return null;
}

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

  const progress = loadProgress(oldEmail);
  users[idx].email = normalizedNew;
  saveUsers(users);
  saveProgress(normalizedNew, progress);
  localStorage.removeItem(progressKey(oldEmail));
  localStorage.setItem(STORAGE_KEYS.session, normalizedNew);
  return null;
}

function updateUserProfile(email, { name, school }) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return "Account not found.";

  const trimmedName = name.trim();
  const trimmedSchool = school.trim();
  if (trimmedName.length < 2) return "Please enter your full name.";
  if (trimmedSchool.length < 2) return "Please enter your school.";

  users[idx].name = trimmedName;
  users[idx].school = trimmedSchool;
  saveUsers(users);
  return null;
}

async function resetPasswordForgot(email, newPassword) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (idx === -1) return "No account found with that email.";

  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return null;
}

function completeProfileSetup(email, avatarId, nickname) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx !== -1) {
    users[idx].avatarId = avatarId;
    users[idx].nickname = nickname;
    users[idx].profileComplete = true;
    saveUsers(users);
  }
  return getCurrentUser();
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
  }
  saveProgress(email, progress);
  return progress;
}

function isModuleUnlocked(mod, progress, email) {
  if (!isGradeAccessible(mod.grade, email)) return false;
  const siblings = modulesByGrade(mod.grade);
  const idx = siblings.findIndex((m) => m.id === mod.id);
  if (idx <= 0) return true;
  const prev = siblings[idx - 1];
  return !!progress.completed[prev.id];
}

function moduleLockedMessage(mod) {
  if (mod && !isGradeAccessible(mod.grade, state.user.email)) {
    if (RELEASED_GRADES.includes(mod.grade)) {
      return `Grade ${mod.grade} needs an active serial key. Redeem one to unlock it.`;
    }
    return `Grade ${mod.grade} is coming soon and isn't available yet.`;
  }
  return "Complete the previous lesson with 80%+ to unlock this one.";
}

function completionPercentage(progress, email) {
  const accessible = getAllModules().filter((m) => isGradeAccessible(m.grade, email));
  if (!accessible.length) return 0;
  const done = accessible.filter((m) => progress.completed[m.id]).length;
  return Math.round((done / accessible.length) * 100);
}

/* ============================================================
   XP / LEVEL (derived from lesson completions + quiz scores —
   no separate storage needed, always computed from progress data)
   ============================================================ */

const XP_PER_LEVEL = 500;

function computeXP(progress, email) {
  const pool = accessibleModules(email);
  let xp = 0;
  pool.forEach((m) => {
    if (progress.completed[m.id]) xp += 100; // completion bonus
    xp += progress.highest[m.id] || 0; // 1 xp per best-score percentage point
    xp += (progress.history[m.id] || []).length * 5; // attempt participation
  });
  return xp;
}

function computeLevelInfo(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, xp, into, target: XP_PER_LEVEL };
}

function levelTitle(level) {
  if (level >= 20) return "Grandmaster";
  if (level >= 14) return "Master";
  if (level >= 9) return "Expert";
  if (level >= 5) return "Builder";
  return "Rookie";
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
  progressCalendarOffset: 0,
  quiz: { questions: [], index: 0, answers: [] },
  expandedGrades: new Set(),
  myLessonsTab: "all",
  dashboardTab: "lessons",
  // Scroll position tracking for My Lessons table
  lessonsScrollIndex: 0,
  lessonsPerPage: 8,
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
  $("#view-avatar-setup").classList.add("hidden");
  $("#view-app").classList.add("hidden");
}

function enterApp() {
  $("#view-login").classList.add("hidden");
  $("#view-signup").classList.add("hidden");
  state.progress = loadProgress(state.user.email);
  recordDailyAccess(state.user.email);

  if (!state.user.profileComplete) {
    showAvatarSetup();
    return;
  }
  $("#view-app").classList.remove("hidden");
  navigate("home");
}

/* ============================================================
   PROFILE SETUP SCREEN
   ============================================================ */

let avatarSetupSelected = null;

function renderAvatarGrid(selectedId) {
  return AVATARS.map(
    (a) => `
    <button type="button" class="avatar-option ${a.id === selectedId ? "selected" : ""}" data-avatar-id="${a.id}" title="${escapeHtml(a.label)}">
      <img src="${a.src}" alt="${escapeHtml(a.label)} avatar" />
    </button>`
  ).join("");
}

function showAvatarSetup(opts = {}) {
  const isEdit = !!opts.edit;

  $("#view-login").classList.add("hidden");
  $("#view-signup").classList.add("hidden");
  $("#view-app").classList.add("hidden");
  $("#view-avatar-setup").classList.remove("hidden");

  $("#avatar-setup-heading").textContent = isEdit ? "Update your profile" : "Set up your profile";
  $("#avatar-setup-subtitle").textContent = isEdit
    ? "Change your avatar or nickname anytime"
    : "Pick an avatar and a nickname to get started";
  $("#avatar-setup-error").classList.add("hidden");
  $("#avatar-setup-cancel-wrap").classList.toggle("hidden", !isEdit);

  avatarSetupSelected = state.user.avatarId || null;
  $("#avatar-grid").innerHTML = renderAvatarGrid(avatarSetupSelected);
  $("#setup-nickname").value = state.user.nickname || "";

  $all(".avatar-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      avatarSetupSelected = btn.dataset.avatarId;
      $all(".avatar-option").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  const continueBtn = $("#avatar-setup-continue");
  const freshContinue = continueBtn.cloneNode(true);
  continueBtn.parentNode.replaceChild(freshContinue, continueBtn);
  freshContinue.textContent = isEdit ? "Save Changes" : "Continue";
  freshContinue.addEventListener("click", () => {
    const nickname = $("#setup-nickname").value.trim();
    const errBox = $("#avatar-setup-error");
    errBox.classList.add("hidden");

    if (!avatarSetupSelected) {
      errBox.textContent = "Pick an avatar to continue.";
      errBox.classList.remove("hidden");
      return;
    }
    if (nickname.length < 2) {
      errBox.textContent = "Enter a nickname (at least 2 characters).";
      errBox.classList.remove("hidden");
      return;
    }

    state.user = completeProfileSetup(state.user.email, avatarSetupSelected, nickname);
    $("#view-avatar-setup").classList.add("hidden");
    $("#view-app").classList.remove("hidden");
    navigate(isEdit ? "profile" : "home");
    showToast(isEdit ? "Profile updated." : `Welcome, ${nickname}!`);
  });

  const cancelBtn = $("#avatar-setup-cancel");
  const freshCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
  if (isEdit) {
    freshCancel.addEventListener("click", () => {
      $("#view-avatar-setup").classList.add("hidden");
      $("#view-app").classList.remove("hidden");
      navigate("profile");
    });
  }
}

function renderAvatar(styleAttr = "") {
  const av = state.user.avatarId ? AVATARS.find((a) => a.id === state.user.avatarId) : null;
  const initialsSource = (state.user.nickname || state.user.name || "?").trim();
  const initials = initialsSource.charAt(0).toUpperCase() || "?";
  const styleHtml = styleAttr ? ` style="${styleAttr}"` : "";
  if (av) {
    return `<div class="avatar"${styleHtml}><img src="${av.src}" alt="${escapeHtml(av.label)} avatar" /></div>`;
  }
  return `<div class="avatar"${styleHtml}>${initials}</div>`;
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
    case "progress": main.innerHTML = renderProgressPage(); attachProgressEvents(); break;
    case "modules": main.innerHTML = renderModuleList(); attachModuleListEvents(); break;
    case "lesson": main.innerHTML = renderLesson(state.activeModuleId); attachLessonEvents(); break;
    case "quiz": main.innerHTML = renderQuizStart(state.activeModuleId); attachQuizEvents(); break;
    case "quiz-result": main.innerHTML = renderQuizResult(opts.result); attachResultEvents(opts.result); break;
    case "profile": main.innerHTML = renderProfile(); attachProfileEvents(); break;
    case "settings": main.innerHTML = renderSettings(); attachSettingsEvents(); break;
    case "about": main.innerHTML = renderAbout(); break;
    default: main.innerHTML = "<p>Page not found.</p>";
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ---- Home ---- */
function getCalendarCells(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
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

function accessibleModules(email) {
  return getAllModules().filter((m) => isGradeAccessible(m.grade, email));
}

function findContinueModuleId() {
  const pool = accessibleModules(state.user.email);
  const next = pool.find((m) => isModuleUnlocked(m, state.progress, state.user.email) && !state.progress.completed[m.id]);
  return next ? next.id : (pool[0] ? pool[0].id : null);
}

/* ---- Dashboard (Home) ---- */
function renderHome() {
  const p = state.progress;
  const pool = accessibleModules(state.user.email);

  const tabs = [
    { id: "lessons", label: "LESSONS" },
    { id: "quiz", label: "QUIZ" },
    { id: "activity", label: "ACTIVITY" },
  ];
  const activeTab = state.dashboardTab || "lessons";

  const tabBar = `
    <div class="dash-tabs">
      ${tabs
        .map(
          (t) =>
            `<button type="button" class="dash-tab-btn ${t.id === activeTab ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`
        )
        .join("")}
    </div>
  `;

  let body;
  if (!pool.length) {
    body = `<div class="card" style="text-align:center;">No modules are available yet.</div>`;
  } else if (activeTab === "quiz") {
    body = renderQuizTab(pool, p);
  } else if (activeTab === "activity") {
    body = renderActivityTab(pool, p);
  } else {
    body = renderLessonsTab(pool, p);
  }

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Welcome back, ${escapeHtml(state.user.nickname || state.user.name)}</div>
      </div>
    </div>

    ${tabBar}

    <div class="dash-grid">
      <div>${body}</div>

      <aside class="right-panel">
        <div class="card profile-panel">
          ${renderAvatar()}
          <div class="p-name">${escapeHtml(state.user.nickname || state.user.name)}</div>
          <div class="p-role">${escapeHtml(state.user.email)}</div>
        </div>

        ${renderMiniCalendar()}
      </aside>
    </div>
  `;
}

/* LESSONS tab */
function renderLessonsTab(pool, p) {
  const continueId = findContinueModuleId();
  const notCompleted = pool.filter((m) => !p.completed[m.id]);
  const featured = (notCompleted.length ? notCompleted : pool)
    .slice()
    .sort((a, b) => (a.id === continueId ? -1 : b.id === continueId ? 1 : a.id - b.id))
    .slice(0, 3);

  const myLessonsTab = state.myLessonsTab || "all";
  let filteredModules = pool;
  if (myLessonsTab === "completed") {
    filteredModules = pool.filter((m) => p.completed[m.id]);
  } else if (myLessonsTab === "inprogress") {
    filteredModules = pool.filter((m) => !p.completed[m.id] && (p.highest[m.id] || 0) > 0 && isModuleUnlocked(m, p, state.user.email));
  } else if (myLessonsTab === "locked") {
    filteredModules = pool.filter((m) => !isModuleUnlocked(m, p, state.user.email));
  }

  // Sort by ID (lesson number)
  filteredModules = filteredModules.sort((a, b) => a.id - b.id);

  const myLessonsTabs = [
    { id: "all", label: "All Lessons" },
    { id: "completed", label: "Completed" },
    { id: "inprogress", label: "In Progress" },
    { id: "locked", label: "Locked" },
  ];

  const myLessonsTabBar = `
    <div class="my-lessons-tabs">
      ${myLessonsTabs
        .map(
          (t) =>
            `<button type="button" class="my-lessons-tab-btn ${t.id === myLessonsTab ? "active" : ""}" data-mltab="${t.id}">${t.label}</button>`
        )
        .join("")}
    </div>
  `;

  // Pagination
  const totalLessons = filteredModules.length;
  const perPage = state.lessonsPerPage;
  const totalPages = Math.ceil(totalLessons / perPage);
  const currentIndex = Math.min(state.lessonsScrollIndex, totalPages - 1);
  const startIdx = currentIndex * perPage;
  const endIdx = Math.min(startIdx + perPage, totalLessons);
  const visibleModules = filteredModules.slice(startIdx, endIdx);

  const tableRows = visibleModules.map((m) => {
    const unlocked = isModuleUnlocked(m, p, state.user.email);
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
              <div>Lesson ${m.id} — ${escapeHtml(m.title)}</div>
              <div class="cn-sub">${escapeHtml(m.subtitle)}</div>
            </div>
          </div>
        </td>
        <td>${unlocked ? `${score}%` : "—"}</td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
      </tr>`;
  }).join("");

  const navButtons = totalPages > 1 ? `
    <div class="lessons-nav">
      <button class="lessons-nav-btn" id="lessons-prev" ${currentIndex <= 0 ? "disabled" : ""}>← Previous</button>
      <span class="lessons-counter">${totalLessons > 0 ? `Showing ${startIdx + 1}–${endIdx} of ${totalLessons} lessons` : "No lessons"}</span>
      <button class="lessons-nav-btn" id="lessons-next" ${currentIndex >= totalPages - 1 ? "disabled" : ""}>Next →</button>
    </div>
  ` : "";

  return `
    <div class="dash-section-title">
      <h3>Continue Learning</h3>
    </div>
    <div class="feature-row">
      ${featured
        .map((m) => {
          const unlocked = isModuleUnlocked(m, p, state.user.email);
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
      <h3>My Lessons</h3>
      <button id="view-all-modules">View All</button>
    </div>
    <div class="card">
      ${myLessonsTabBar}
      <div class="lessons-scroll-container">
        <div class="lessons-table-wrapper" id="lessons-table-wrapper">
          <table class="course-table">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>Best Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              ${totalLessons === 0 ? `<tr><td colspan="3" style="text-align:center; color:var(--ink-soft); padding:20px;">No lessons in this category.</td></tr>` : ""}
            </tbody>
          </table>
        </div>
        ${navButtons}
      </div>
    </div>
  `;
}

/* QUIZ tab */
function renderQuizTab(pool, p) {
  return `
    <div class="dash-section-title">
      <h3>Quiz Progress</h3>
    </div>
    <div class="card">
      ${pool
        .map((m) => {
          const unlocked = isModuleUnlocked(m, p, state.user.email);
          const completed = p.completed[m.id];
          const score = p.highest[m.id] || 0;
          const attempts = (p.history[m.id] || []).length;
          return `
          <div class="progress-item ${completed ? "filled" : "outline"} ${unlocked ? "" : "locked"}" data-module-id="${m.id}" style="cursor:pointer;">
            ${renderSmallRing(score)}
            <div>
              <div class="pi-title">${escapeHtml(m.title)}</div>
              <div class="pi-sub">
                Grade ${m.grade} — ${unlocked ? (attempts ? `${attempts} attempt${attempts === 1 ? "" : "s"} · Best ${score}%` : "Not attempted yet") : "Locked"}
              </div>
            </div>
            <div class="pi-arrow">${unlocked ? "&rsaquo;" : "&ndash;"}</div>
          </div>`;
        })
        .join("")}
    </div>
  `;
}

/* ACTIVITY tab */
function renderActivityTab(pool, p) {
  const rows = [];
  pool.forEach((m) => {
    const attempts = p.history[m.id] || [];
    attempts
      .slice()
      .reverse()
      .forEach((score, i) => {
        const attemptNumber = attempts.length - i;
        rows.push({ module: m, score, attemptNumber });
      });
  });

  if (!rows.length) {
    return `
      <div class="dash-section-title"><h3>Activity</h3></div>
      <div class="card" style="text-align:center; color:var(--ink-soft);">No quiz attempts yet — take a quiz to see your activity here.</div>
    `;
  }

  return `
    <div class="dash-section-title"><h3>Activity</h3></div>
    <div class="card">
      ${rows
        .map(
          ({ module: m, score, attemptNumber }) => `
        <div class="activity-row">
          <div class="course-mini-icon" style="background:${m.color};">${m.id}</div>
          <div style="flex:1;">
            <div>${escapeHtml(m.title)}</div>
            <div class="cn-sub">Attempt #${attemptNumber} — Grade ${m.grade}</div>
          </div>
          <span class="activity-badge ${score >= PASSING_SCORE ? "pass" : "fail"}">${score}%</span>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function attachHomeEvents() {
  // Dashboard tab switching
  $all(".dash-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dashboardTab = btn.dataset.tab;
      navigate("home");
    });
  });

  // My Lessons tab switching
  $all(".my-lessons-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.myLessonsTab = btn.dataset.mltab;
      state.lessonsScrollIndex = 0; // Reset to first page when changing tabs
      navigate("home");
    });
  });

  // Lessons pagination - Previous
  const prevBtn = $("#lessons-prev");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.lessonsScrollIndex > 0) {
        state.lessonsScrollIndex--;
        navigate("home");
        // Scroll the table wrapper to top after re-render
        setTimeout(() => {
          const wrapper = document.getElementById("lessons-table-wrapper");
          if (wrapper) wrapper.scrollTop = 0;
        }, 50);
      }
    });
  }

  // Lessons pagination - Next
  const nextBtn = $("#lessons-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const pool = accessibleModules(state.user.email);
      const totalLessons = pool.length;
      const totalPages = Math.ceil(totalLessons / state.lessonsPerPage);
      if (state.lessonsScrollIndex < totalPages - 1) {
        state.lessonsScrollIndex++;
        navigate("home");
        setTimeout(() => {
          const wrapper = document.getElementById("lessons-table-wrapper");
          if (wrapper) wrapper.scrollTop = 0;
        }, 50);
      }
    });
  }

  // Feature cards
  $all(".feature-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.moduleId);
      const mod = getAllModules().find((m) => m.id === id);
      if (!mod || !isModuleUnlocked(mod, state.progress, state.user.email)) {
        showToast(moduleLockedMessage(mod));
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });

  // Table rows
  $all(".course-table tbody tr").forEach((row) => {
    row.addEventListener("click", () => {
      const id = Number(row.dataset.moduleId);
      const mod = getAllModules().find((m) => m.id === id);
      if (!mod || !isModuleUnlocked(mod, state.progress, state.user.email)) {
        showToast(moduleLockedMessage(mod));
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });

  // Quiz Progress rows
  $all(".progress-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = Number(item.dataset.moduleId);
      const mod = getAllModules().find((m) => m.id === id);
      if (!mod || !isModuleUnlocked(mod, state.progress, state.user.email)) {
        showToast(moduleLockedMessage(mod));
        return;
      }
      navigate("quiz", { moduleId: id });
    });
  });

  const viewAllBtn = $("#view-all-modules");
  if (viewAllBtn) viewAllBtn.addEventListener("click", () => navigate("modules"));

  const prevCalBtn = $("#cal-prev");
  const nextCalBtn = $("#cal-next");
  if (prevCalBtn) prevCalBtn.addEventListener("click", () => { state.calendarOffset--; navigate("home"); });
  if (nextCalBtn) nextCalBtn.addEventListener("click", () => { state.calendarOffset++; navigate("home"); });
}

/* ============================================================
   PROGRESS PAGE (level, streak calendar, deck/module mastery)
   ============================================================ */

function buildMonthCells(base) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({ day: d.getDate(), muted: true, iso: isoFromDate(d) });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ day, muted: false, iso: isoFromDate(d) });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, trailing++);
    cells.push({ day: d.getDate(), muted: true, iso: isoFromDate(d) });
  }
  return cells;
}

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function renderLevelCard() {
  const xp = computeXP(state.progress, state.user.email);
  const info = computeLevelInfo(xp);
  const pct = Math.round((info.into / info.target) * 100);
  return `
    <div class="card level-card">
      <div class="level-avatar-wrap">
        ${renderAvatar()}
        <div class="level-badge">${info.level}</div>
      </div>
      <div class="level-info">
        <div class="level-title">${levelTitle(info.level)}</div>
        <div class="level-bar-track">
          <div class="level-bar-fill" style="width:${pct}%;"></div>
          <span class="level-bar-xp">${info.into.toLocaleString()} XP</span>
        </div>
      </div>
      <div class="level-target">Level ${info.level + 1}: ${info.target.toLocaleString()} XP</div>
    </div>
  `;
}

function renderStreakCalendar(streakStatus) {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + state.progressCalendarOffset, 1);
  const monthLabel = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cells = buildMonthCells(base);
  const activeSet = new Set(streakStatus.dates);
  const dow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return `
    <div class="card streak-cal-card">
      <div class="streak-cal-heading">${streakStatus.activeToday ? "Keep your streak going!" : "Start your streak!"}</div>
      <div class="mini-cal-header">
        <div class="mc-title">${monthLabel}</div>
        <div class="mini-cal-nav">
          <button id="pcal-prev" type="button">&lsaquo;</button>
          <button id="pcal-next" type="button">&rsaquo;</button>
        </div>
      </div>
      <div class="mini-cal-grid streak-cal-grid">
        ${dow.map((d) => `<div class="mc-dow">${d}</div>`).join("")}
        ${cells
          .map((c) => {
            const isToday = c.iso === streakStatus.today;
            const isActive = activeSet.has(c.iso);
            const classes = ["mc-day", "streak-day"];
            if (c.muted) classes.push("muted");
            if (isActive) classes.push("active");
            if (isToday) classes.push("today");
            return `<div class="${classes.join(" ")}">${c.day}${isToday && !isActive ? '<span class="streak-today-dot"></span>' : ""}</div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderStreakFlame(streakStatus) {
  const count = streakStatus.current;
  const longest = streakStatus.longest || 0;
  return `
    <div class="card streak-flame-card">
      <div class="streak-flame-count">${count}</div>
      <div class="streak-flame-label">${count === 1 ? "Day streak" : "Day streak"}</div>
      <div class="streak-flame-visual ${streakStatus.activeToday ? "on" : "off"}">
        <span class="streak-flame-emoji">🔥</span>
      </div>
      <div class="streak-flame-status ${streakStatus.activeToday ? "ok" : "warn"}">
        ${streakStatus.activeToday
          ? "You've kept today's streak alive. Nice!"
          : "Open a lesson today to keep your streak going."}
      </div>
      <div class="streak-flame-meta">Longest streak: <strong>${longest}</strong> day${longest === 1 ? "" : "s"}</div>
    </div>
  `;
}

function renderDeckProgressCards() {
  const email = state.user.email;
  const p = state.progress;
  const cards = GRADES.map((grade) => {
    const mods = modulesByGradeGroup(grade.levels);
    if (!mods.length) return null;
    const accessible = isGradeAccessible(grade.levels[0], email);
    const total = mods.length;
    const done = accessible ? mods.filter((m) => p.completed[m.id]).length : 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { grade, total, done, pct, accessible };
  }).filter(Boolean);

  if (!cards.length) {
    return `<div class="card" style="text-align:center; color:var(--ink-soft);">No modules yet — module progress will show up here once lessons are added.</div>`;
  }

  return `
    <div class="deck-progress-grid">
      ${cards
        .map(
          (c) => `
        <div class="card deck-progress-card ${c.accessible ? "" : "locked"}" data-grade-id="${c.grade.id}">
          ${renderSmallRing(c.pct)}
          <div class="deck-progress-title">${escapeHtml(c.grade.label)}</div>
          <div class="deck-progress-sub">${c.accessible ? `${c.done} of ${c.total} module${c.total === 1 ? "" : "s"} mastered` : "Locked — redeem a serial key"}</div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function renderProgressPage() {
  const streakStatus = getStreakStatus(state.user.email);
  return `
    <div class="topbar">
      <div>
        <div class="page-title">Progress</div>
        <div class="page-subtitle">Track your level, your daily streak, and how far you've gotten in each module set.</div>
      </div>
    </div>

    ${renderLevelCard()}

    <div class="streak-section">
      ${renderStreakCalendar(streakStatus)}
      ${renderStreakFlame(streakStatus)}
    </div>

    <div class="dash-section-title" style="margin-top:26px;">
      <h3>Module progress</h3>
    </div>
    ${renderDeckProgressCards()}
  `;
}

function attachProgressEvents() {
  const prevBtn = $("#pcal-prev");
  const nextBtn = $("#pcal-next");
  if (prevBtn) prevBtn.addEventListener("click", () => { state.progressCalendarOffset--; navigate("progress"); });
  if (nextBtn) nextBtn.addEventListener("click", () => { state.progressCalendarOffset++; navigate("progress"); });

  $all(".deck-progress-card").forEach((card) => {
    card.addEventListener("click", () => {
      const gradeId = card.dataset.gradeId;
      state.expandedGrades.add(gradeId);
      navigate("modules");
    });
  });
}

/* ---- Module list ---- */
function renderModuleCard(m, mods) {
  const p = mods.progress;
  const unlocked = isModuleUnlocked(m, p, mods.email);
  const completed = p.completed[m.id];
  const score = p.highest[m.id] || 0;
  let scoreLine = "";
  if (completed) {
    scoreLine = `<div class="module-score pass">Best score: ${score}%</div>`;
  } else if (score > 0) {
    scoreLine = `<div class="module-score retry">Last score: ${score}% (try again)</div>`;
  }
  const statusIcon = !unlocked ? "Locked" : completed ? "Done" : "Go";
  return `
    <div class="card module-card ${unlocked ? "" : "locked"}" data-module-id="${m.id}" style="margin-bottom:12px;">
      <div class="module-icon" style="background:${m.color || 'var(--purple)'};">${m.id}</div>
      <div class="module-info">
        <div class="m-title">${escapeHtml(m.title)}</div>
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
      const mod = getAllModules().find((m) => m.id === id);
      if (!mod || !isModuleUnlocked(mod, state.progress, state.user.email)) {
        showToast(moduleLockedMessage(mod));
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });
}

function renderGradeSection(grade) {
  const email = state.user.email;
  const mods = modulesByGradeGroup(grade.levels);
  const hasContent = mods.length > 0;
  const accessible = isGradeAccessible(grade.levels[0], email);
  const supportsSerialKey = grade.levels.some((lvl) => RELEASED_GRADES.includes(lvl));
  const expanded = state.expandedGrades.has(grade.id);

  let body;
  if (!hasContent) {
    body = `
      <div class="card locked-grade-card">
        <div class="lg-title">Coming soon</div>
        <div class="lg-sub">No modules have been uploaded for ${escapeHtml(grade.label)} yet.</div>
      </div>`;
  } else if (!accessible && supportsSerialKey) {
    body = `
      <div class="card locked-grade-card">
        <div class="lg-title">Locked</div>
        <div class="lg-sub">Redeem a serial key to unlock ${escapeHtml(grade.label)} for one year.</div>
        <button class="btn btn-primary btn-sm redeem-serial-btn" style="margin-top:10px; width:auto;">Redeem Serial Key</button>
      </div>`;
  } else if (!accessible) {
    body = `
      <div class="card locked-grade-card">
        <div class="lg-title">Coming soon</div>
        <div class="lg-sub">${escapeHtml(grade.label)} isn't open yet — for now, serial keys only unlock Grade 4.</div>
      </div>`;
  } else {
    body = mods.map((m) => renderModuleCard(m, { progress: state.progress, email })).join("");
  }

  const statusTag = !hasContent || (!accessible && !supportsSerialKey)
    ? '<span class="grade-status-tag soon">Coming soon</span>'
    : !accessible
      ? '<span class="grade-status-tag locked">Locked</span>'
      : '<span class="grade-status-tag open">Unlocked</span>';

  return `
    <div class="grade-block" data-grade="${grade.id}">
      <button type="button" class="card grade-row ${expanded ? "expanded" : ""}" data-grade-toggle="${grade.id}">
        <span class="grade-row-title">
          ${escapeHtml(grade.label)}
          ${statusTag}
        </span>
        <span class="grade-row-chevron">›</span>
      </button>
      <div class="grade-section ${expanded ? "" : "hidden"}">${body}</div>
    </div>
  `;
}

function renderModuleList() {
  const accessBanner = accessStatusBanner();
  return `
    <div class="topbar">
      <div>
        <div class="page-title">Robotics eBook</div>
        <div class="page-subtitle">Grade 4 is live now — Grade 5, Grade 6, Junior High, and Senior High are coming soon. Pass each quiz with 80%+ to unlock the next lesson.</div>
      </div>
    </div>
    ${accessBanner}
    ${GRADES.map(renderGradeSection).join("")}
  `;
}

function accessStatusBanner() {
  const email = state.user.email;
  if (hasActiveAccess(email, BUILTIN_GRADE)) {
    const days = accessDaysRemaining(email, BUILTIN_GRADE);
    return `<div class="card access-banner active">Serial-key access is active for Grade 4 — ${days} day${days === 1 ? "" : "s"} remaining. Other grades are coming soon.</div>`;
  }
  return `<div class="card access-banner">Grade 4 is locked until you redeem a serial key from an admin. Grade 5, Grade 6, Junior High, and Senior High are coming soon. <button class="btn btn-outline btn-sm redeem-serial-btn" style="width:auto; margin-left:8px;">Redeem Serial Key</button></div>`;
}

function attachModuleListEvents() {
  $all("[data-grade-toggle]").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.gradeToggle;
      const body = row.parentElement.querySelector(".grade-section");
      const nowExpanded = !state.expandedGrades.has(id);
      if (nowExpanded) {
        state.expandedGrades.add(id);
      } else {
        state.expandedGrades.delete(id);
      }
      row.classList.toggle("expanded", nowExpanded);
      if (body) body.classList.toggle("hidden", !nowExpanded);
    });
  });
  attachModuleCardClicks("#main-content");
  $all(".redeem-serial-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRedeemSerialModal();
    });
  });
}

function openRedeemSerialModal() {
  showFormModal({
    title: "Redeem Serial Key",
    description: "Unlocks Grade 4 for one year from today. Grade 5, Grade 6, Junior High, and Senior High are coming soon and will unlock separately once their content ships.",
    fields: [{ id: "code", label: "Serial Key", type: "text", placeholder: "CREO-XXXX-XXXX-XXXX" }],
    confirmLabel: "Redeem",
    onSubmit: async ({ code }) => {
      const err = redeemSerialKey(state.user.email, code || "");
      if (err) return err;
      showToast("Serial key redeemed! Grade 4 is unlocked for one year.");
      navigate(state.currentPage === "home" ? "home" : "modules");
      return null;
    },
  });
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
  const m = getAllModules().find((x) => x.id === moduleId);
  const color = m.color || "var(--purple)";
  const siblingCount = modulesByGrade(m.grade).length;
  const position = modulesByGrade(m.grade).findIndex((x) => x.id === m.id) + 1;
  return `
    <div class="lesson-hero" style="background: linear-gradient(135deg, ${color}, var(--purple));">
      <div class="hero-badge">Grade ${m.grade} · Lesson ${position} of ${siblingCount}</div>
      <h1>Lesson ${m.id}: ${escapeHtml(m.title)}</h1>
    </div>
    <div class="lesson-body">
      <div class="lesson-content-block" style="border-color: ${color}; background: linear-gradient(135deg, ${color}, var(--purple));">
        <p class="lesson-subtitle">${escapeHtml(m.subtitle)}</p>
        ${m.content.map(renderContentBlock).join("")}
      </div>
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
  const m = getAllModules().find((x) => x.id === moduleId);
  state.quiz.questions = shuffle(m.quiz);
  state.quiz.index = 0;
  state.quiz.answers = new Array(state.quiz.questions.length).fill(null);
  return renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, index, answers } = state.quiz;
  const m = getAllModules().find((x) => x.id === state.activeModuleId);
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
        ${q.options.map((opt, i) => {
          const revealed = answers[index] !== null;
          let cls = "";
          if (revealed) {
            if (i === q.correct) cls = "correct";
            else if (i === answers[index]) cls = "incorrect";
            cls += " locked";
          }
          return `
          <div class="option-tile ${cls}" data-option="${i}">
            <div class="option-letter">${letters[i]}</div>
            <div>${escapeHtml(opt)}</div>
          </div>`;
        }).join("")}
      </div>
      ${answers[index] !== null
        ? (answers[index] === q.correct
            ? `<div class="quiz-feedback quiz-feedback-correct">Correct!</div>`
            : `<div class="quiz-feedback quiz-feedback-incorrect"><strong>Not quite.</strong> ${escapeHtml(q.explanation || "")}</div>`)
        : ""}
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
      if (state.quiz.answers[state.quiz.index] !== null) return;
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
  const m = getAllModules().find((x) => x.id === result.moduleId);
  const passed = result.score >= PASSING_SCORE;
  const siblings = modulesByGrade(m.grade);
  const hasNext = siblings.findIndex((x) => x.id === m.id) < siblings.length - 1;

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

        ${passed && hasNext ? `<div class="unlock-banner">The next lesson is now unlocked!</div>` : ""}

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

  const rows = accessibleModules(state.user.email).map((m) => {
    const unlocked = isModuleUnlocked(m, p, state.user.email);
    const completed = p.completed[m.id];
    const score = p.highest[m.id] || 0;
    let sub = "Locked";
    if (unlocked) sub = score > 0 ? `Highest score: ${score}%` : "Not attempted yet";
    const statusClass = completed ? "done" : unlocked ? "progress" : "locked";
    const icon = completed ? "Done" : unlocked ? "Unlocked" : "Locked";
    return `
      <div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
        <span class="status-pill ${statusClass}" style="flex-shrink:0;">${icon}</span>
        <div style="flex:1;">
          <div style="font-weight:700;">Grade ${m.grade}: ${escapeHtml(m.title)}</div>
          <div style="color:var(--ink-soft); font-size:0.85rem;">${sub}</div>
        </div>
      </div>`;
  }).join("") || `<div class="card" style="text-align:center; color:var(--ink-soft);">No modules available yet.</div>`;

  return `
    <div class="topbar">
      <div class="page-title">Profile</div>
    </div>
    <div class="card profile-hero">
      <div class="profile-hero-fields">
        <div class="profile-field">
          <div class="profile-field-label">Name</div>
          <div class="profile-field-value">${escapeHtml(state.user.name)}</div>
        </div>
        <div class="profile-field">
          <div class="profile-field-label">E-mail</div>
          <div class="profile-field-value">${escapeHtml(state.user.email)}</div>
        </div>
        <div class="profile-field">
          <div class="profile-field-label">School</div>
          <div class="profile-field-value">${escapeHtml(state.user.school || "—")}</div>
        </div>
      </div>
      <div class="profile-hero-side">
        ${renderAvatar("width:128px; height:128px; font-size:2.7rem;")}
        <div class="profile-hero-actions">
          <button type="button" class="btn btn-outline btn-sm" id="edit-profile-btn">Edit Profile</button>
          <button type="button" class="btn btn-outline btn-sm" id="edit-avatar-btn">Edit Avatar &amp; Nickname</button>
        </div>
      </div>
    </div>
    <h3 style="color:var(--white); margin-bottom:12px;">Module Scores</h3>
    ${rows}
  `;
}

function attachProfileEvents() {
  const avatarBtn = $("#edit-avatar-btn");
  if (avatarBtn) avatarBtn.addEventListener("click", () => showAvatarSetup({ edit: true }));

  const profileBtn = $("#edit-profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      showFormModal({
        title: "Edit Profile",
        description: "Update your name and school.",
        fields: [
          { id: "name", label: "Full Name", type: "text", placeholder: "Jane Dela Cruz", autocomplete: "name" },
          { id: "school", label: "School", type: "text", placeholder: "Polytechnic University of the Philippines", autocomplete: "school" },
        ],
        confirmLabel: "Save",
        onSubmit: async ({ name, school }) => {
          const err = updateUserProfile(state.user.email, { name, school });
          if (err) return err;

          state.user = getCurrentUser();
          showToast("Profile updated.");
          navigate("profile");
          return null;
        },
      });

      const nameInput = document.getElementById("modal-name");
      const schoolInput = document.getElementById("modal-school");
      if (nameInput) nameInput.value = state.user.name || "";
      if (schoolInput) schoolInput.value = state.user.school || "";
    });
  }
}

/* ---- Settings ---- */
function renderSettings() {
  const isDark = document.body.classList.contains("dark");
  const email = state.user.email;
  const active = hasActiveAccess(email, BUILTIN_GRADE);
  const days = accessDaysRemaining(email, BUILTIN_GRADE);

  return `
    <div class="topbar"><div class="page-title">Settings</div></div>

    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></div>
          <div>
            <div class="settings-row-title">Dark Mode</div>
            <div class="settings-row-sub">Switch between light and dark theme</div>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" id="dark-toggle" ${isDark ? "checked" : ""} />
          <span class="switch-track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.6 6.35"/><path d="M3 21v-6h6"/></svg></div>
          <div>
            <div class="settings-row-title">Reset Progress</div>
            <div class="settings-row-sub">Lock all modules and clear scores</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="reset-btn">Reset</button>
      </div>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Grade Access</h3>
    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
          <div>
            <div class="settings-row-title">Grade 4</div>
            <div class="settings-row-sub">
              ${active ? `Active — ${days} day${days === 1 ? "" : "s"} remaining` : "No active serial key. Grade 4 stays locked until you redeem one."} Other grades are coming soon.
            </div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="settings-redeem-btn">${active ? "Redeem Another Key" : "Redeem Serial Key"}</button>
      </div>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Account</h3>
    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>
          <div>
            <div class="settings-row-title">Change Email</div>
            <div class="settings-row-sub">${escapeHtml(state.user.email)}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" id="change-email-btn">Change</button>
      </div>
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.6 12.4 19 4"/><path d="M17 6l2 2"/><path d="M14 9l2 2"/></svg></div>
          <div>
            <div class="settings-row-title">Change Password</div>
            <div class="settings-row-sub">Update your account password</div>
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
      body: "This will lock every module you've unlocked by passing a quiz, and clear every quiz score. Grade access from serial keys is not affected. This cannot be undone.",
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

  const settingsRedeemBtn = $("#settings-redeem-btn");
  if (settingsRedeemBtn) settingsRedeemBtn.addEventListener("click", openRedeemSerialModal);
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
        robotics through 32 structured lessons, each paired with a quiz.
        Learn about robot components, hardware, assembly, sensors, coding,
        and autonomous behavior — all from any device with a web browser.
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
   EVENT WIRING
   ============================================================ */

function init() {
  seedDemoSerialKey();

  if (localStorage.getItem(STORAGE_KEYS.theme) === "dark") {
    document.body.classList.add("dark");
  }

  const existingUser = getCurrentUser();
  if (existingUser) {
    state.user = existingUser;
    enterApp();
  }

  $("#go-signup").addEventListener("click", () => switchAuthView("signup"));
  $("#go-login").addEventListener("click", () => switchAuthView("login"));

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

  $all(".toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "Hide" : "Show";
    });
  });

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

  $("#signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#signup-name").value.trim();
    const email = $("#signup-email").value.trim();
    const school = $("#signup-school").value.trim();
    const password = $("#signup-password").value;
    const confirm = $("#signup-confirm").value;
    const errBox = $("#signup-error");
    errBox.classList.add("hidden");

    if (name.length < 2) return showFieldError(errBox, "Please enter your full name.");
    if (!/^[\w.\-]+@[\w-]+\.[\w.\-]+$/.test(email)) return showFieldError(errBox, "Enter a valid email address.");
    if (school.length < 2) return showFieldError(errBox, "Please enter your school.");
    if (password.length < 6) return showFieldError(errBox, "Password must be at least 6 characters.");
    if (password !== confirm) return showFieldError(errBox, "Passwords do not match.");

    const err = await registerUser(name, email, school, password);
    if (err) return showFieldError(errBox, err);

    showToast("Account created! Please log in.");
    switchAuthView("login");
    $("#login-email").value = email;
  });

  function showFieldError(box, msg) {
    box.textContent = msg;
    box.classList.remove("hidden");
  }

  $all(".nav-item, .bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.page));
  });

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