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
  customModules: "creo_custom_modules", // admin-uploaded modules for Grades 5-12
  serialKeys: "creo_serial_keys",       // pool of serial keys admins have generated
  teacherCodes: "creo_teacher_codes",   // pool of one-time teacher-access codes admins have generated
};

function progressKey(email) {
  return `creo_progress_${email}`;
}

function accessKey(email) {
  return `creo_access_${email}`;
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
   MODULE CONTENT (built-in Grade 4 modules from data.js, plus
   admin-uploaded modules for Grades 5-12, stored in localStorage)
   ============================================================ */

function loadCustomModules() {
  const raw = localStorage.getItem(STORAGE_KEYS.customModules);
  return raw ? JSON.parse(raw) : [];
}

function saveCustomModules(list) {
  localStorage.setItem(STORAGE_KEYS.customModules, JSON.stringify(list));
}

// The full catalog: built-in Grade 4 modules + anything an admin has
// uploaded for other grades. Always call this instead of touching MODULES
// directly when enumerating "all modules a student might see".
function getAllModules() {
  return [...MODULES, ...loadCustomModules()];
}

function modulesByGrade(grade) {
  return getAllModules()
    .filter((m) => m.grade === grade)
    .sort((a, b) => (a.order || a.id) - (b.order || b.id));
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
   GRADE ACCESS (serial keys unlock all grades, 4-12, for one year)
   ============================================================ */

const ACCESS_DAYS = 365;

function loadAccess(email) {
  const raw = localStorage.getItem(accessKey(email));
  return raw ? JSON.parse(raw) : null;
}

function saveAccess(email, access) {
  localStorage.setItem(accessKey(email), JSON.stringify(access));
}

function hasActiveAccess(email) {
  const access = loadAccess(email);
  return !!access && access.expiresAt > Date.now();
}

function accessDaysRemaining(email) {
  const access = loadAccess(email);
  if (!access) return 0;
  return Math.max(0, Math.ceil((access.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
}

// Every grade (including Grade 4) requires an active serial-key access
// window to unlock — see redeemSerialKey below. There is no free grade;
// admins generate serial keys for students to redeem.
function isGradeAccessible(grade, email) {
  return hasActiveAccess(email);
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

function generateSerialKeys(count) {
  const keys = loadSerialKeys();
  for (let i = 0; i < count; i++) {
    keys.push({ code: generateSerialCode(), usedBy: null, usedAt: null, createdAt: Date.now() });
  }
  saveSerialKeys(keys);
  return keys;
}

// Redeems a serial key for `email`, granting access to every grade (4-12)
// for one year from the moment of redemption. Returns an error string, or
// null on success.
function redeemSerialKey(email, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return "Enter a serial key.";

  const keys = loadSerialKeys();
  const key = keys.find((k) => k.code === code);
  if (!key) return "That serial key isn't valid.";
  if (key.usedBy) return "That serial key has already been used.";

  key.usedBy = email;
  key.usedAt = Date.now();
  saveSerialKeys(keys);

  const now = Date.now();
  saveAccess(email, {
    serialKey: code,
    activatedAt: now,
    expiresAt: now + ACCESS_DAYS * 24 * 60 * 60 * 1000,
  });
  return null;
}

/* ============================================================
   ADMIN ACCESS
   Anyone who knows the admin code can flip their own account into an
   admin — there's no real backend here, so this is a soft gate (same
   spirit as the client-side password reset above), not real security.
   ============================================================ */

const ADMIN_CODE = "CREOADMIN";

function redeemAdminCode(email, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code !== ADMIN_CODE) return "Incorrect admin code.";
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return "Account not found.";
  users[idx].isAdmin = true;
  saveUsers(users);
  return null;
}

/* ============================================================
   TEACHER ACCESS
   Unlike ADMIN_CODE (a fixed constant), teacher access is granted through
   one-time codes an admin generates from the Admin page — same pattern as
   serial keys. A student/teacher redeems one from Settings → Teacher
   Access to unlock the read-only Teacher page (view every student's
   scores and current module). Each code works once.
   ============================================================ */

function loadTeacherCodes() {
  const raw = localStorage.getItem(STORAGE_KEYS.teacherCodes);
  return raw ? JSON.parse(raw) : [];
}

function saveTeacherCodes(codes) {
  localStorage.setItem(STORAGE_KEYS.teacherCodes, JSON.stringify(codes));
}

function generateTeacherCodeString() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TEACH-${group()}-${group()}`;
}

function generateTeacherCodes(count) {
  const codes = loadTeacherCodes();
  for (let i = 0; i < count; i++) {
    codes.push({ code: generateTeacherCodeString(), usedBy: null, usedAt: null, createdAt: Date.now() });
  }
  saveTeacherCodes(codes);
  return codes;
}

// Redeems a generated teacher code for `email`, granting permanent access
// to the read-only Teacher page on that account. Returns an error string,
// or null on success.
function redeemTeacherCode(email, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return "Enter a teacher code.";

  const codes = loadTeacherCodes();
  const found = codes.find((c) => c.code === code);
  if (!found) return "That teacher code isn't valid.";
  if (found.usedBy) return "That teacher code has already been used.";

  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return "Account not found.";

  found.usedBy = email;
  found.usedAt = Date.now();
  saveTeacherCodes(codes);

  users[idx].isTeacher = true;
  saveUsers(users);
  ensureTeacherClassCode(email);
  return null;
}

/* ============================================================
   CLASS LINKING (which students belong to which teacher)
   Being "a teacher" (isTeacher) only controls whether the Teacher page is
   reachable at all. It does NOT by itself say which students are hers —
   without this, every teacher would see every student on the device. So
   separately, every teacher account gets its own short, shareable
   classCode; a student enters that code once (Settings → My Class) to
   link their account to that specific teacher. The Teacher Dashboard (and
   the CSV export) only ever shows students linked to the teacher who's
   currently viewing it. Admins are the one exception — they still see
   every student, matching their broader oversight role.
   ============================================================ */

function generateClassCodeString() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids mix-ups when read aloud/handwritten
  const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CLS-${code}`;
}

// Guarantees a teacher account has a classCode, generating one if this is
// an older teacher account from before this feature existed. Returns the
// (possibly newly-created) code.
function ensureTeacherClassCode(email) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return null;

  if (!users[idx].classCode) {
    // Vanishingly unlikely to collide, but check anyway before saving.
    let code;
    do {
      code = generateClassCodeString();
    } while (users.some((u) => u.classCode === code));
    users[idx].classCode = code;
    saveUsers(users);
  }
  return users[idx].classCode;
}

// A student links their account to a teacher by entering that teacher's
// classCode. Returns an error string, or null on success.
function joinTeacherClass(studentEmail, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return "Enter your teacher's class code.";

  const users = loadUsers();
  const teacher = users.find((u) => u.isTeacher && u.classCode === code);
  if (!teacher) return "That class code isn't valid.";
  if (teacher.email === studentEmail) return "You can't join your own class.";

  const idx = users.findIndex((u) => u.email === studentEmail);
  if (idx === -1) return "Account not found.";

  users[idx].teacherEmail = teacher.email;
  saveUsers(users);
  return null;
}

function leaveTeacherClass(studentEmail) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === studentEmail);
  if (idx === -1) return;
  users[idx].teacherEmail = null;
  saveUsers(users);
}

// The single source of truth for "which students should this viewer see"
// — used by the Teacher Dashboard table, the CSV export, AND the
// Leaderboard, so all three always agree with each other:
//   - Admins see every student on the device.
//   - Teachers see only students linked to THEM specifically (their class).
//   - Regular students see their own classmates — everyone sharing the
//     same teacherEmail they do. If they haven't joined a class yet,
//     there's no group to show them, so this returns an empty list.
function visibleStudentsFor(viewerUser) {
  const summaries = allStudentSummaries();
  if (viewerUser.isAdmin) return summaries;
  if (viewerUser.isTeacher) {
    return summaries.filter((s) => s.user.teacherEmail === viewerUser.email);
  }
  if (viewerUser.teacherEmail) {
    return summaries.filter((s) => s.user.teacherEmail === viewerUser.teacherEmail);
  }
  return [];
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
    isAdmin: false,
    isTeacher: false,
    classCode: null,    // set once this account becomes a teacher — students join using this
    teacherEmail: null, // which teacher's class this student has joined, if any
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

/* ---- Change profile (Name + School; no password required since these
   aren't sensitive credential fields) ---- */
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

/* ---- Profile setup (avatar + nickname, shown once after first login) ---- */
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

// A module is unlocked when: (1) its grade is accessible (every grade, 4-12,
// needs active serial-key access), and (2) it's the first module
// in that grade, or the module right before it (within the same grade) has
// been passed. Computed on the fly so that redeeming/expiring a serial key
// immediately unlocks/relocks the right modules without any migration.
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
    return `Grade ${mod.grade} needs an active serial key. Redeem one to unlock it.`;
  }
  return "Complete the previous module with 80%+ to unlock this one.";
}

function completionPercentage(progress, email) {
  const accessible = getAllModules().filter((m) => isGradeAccessible(m.grade, email));
  if (!accessible.length) return 0;
  const done = accessible.filter((m) => progress.completed[m.id]).length;
  return Math.round((done / accessible.length) * 100);
}

/* ============================================================
   TEACHER / LEADERBOARD HELPERS
   Aggregate every registered account's saved progress so it can be shown
   to a teacher/admin, or ranked on the Leaderboard. Since Creobotics has
   no backend, "every registered account" only means accounts that have
   signed up in this same browser's localStorage (see README).
   ============================================================ */

// Figures out where a given student currently stands: the next unlocked-
// but-not-yet-passed module (in grade/order sequence) they should be
// working on, or a "done"/"none" status if they've finished everything
// accessible to them or have no grade access at all. Mirrors the logic
// findContinueModuleId() uses for the logged-in user, generalized to work
// for any student email (needed by the Teacher dashboard).
function currentModuleFor(user, progress) {
  const pool = getAllModules()
    .filter((m) => isGradeAccessible(m.grade, user.email))
    .sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id));

  if (!pool.length) return { status: "none", module: null };

  const next = pool.find((m) => isModuleUnlocked(m, progress, user.email) && !progress.completed[m.id]);
  if (next) return { status: "in-progress", module: next };

  // Nothing left to do — either every accessible module is completed, or
  // (edge case) none are unlocked yet. Report the most advanced one either
  // way so the teacher has something concrete to look at.
  const lastUnlocked = pool.slice().reverse().find((m) => isModuleUnlocked(m, progress, user.email));
  return { status: "done", module: lastUnlocked || pool[0] };
}

// Short label for the "Current Module" column/badge in the Teacher table.
function currentModuleLabel(current) {
  if (current.status === "none") return "No grade access";
  if (current.status === "done") return "All caught up";
  return `Grade ${current.module.grade}: ${escapeHtml(current.module.title)}`;
}

// One row's worth of stats for a single student — reused by the Teacher
// table, the student-detail modal, and the Leaderboard.
function studentSummary(user) {
  const progress = loadProgress(user.email);
  const allModules = getAllModules();
  const completedCount = allModules.filter((m) => progress.completed[m.id]).length;
  const scores = Object.values(progress.highest);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return {
    user,
    progress,
    completedCount,
    totalModules: allModules.length,
    percent: allModules.length ? Math.round((completedCount / allModules.length) * 100) : 0,
    avgScore,
    accessActive: hasActiveAccess(user.email),
    accessDaysLeft: accessDaysRemaining(user.email),
    currentModule: currentModuleFor(user, progress),
  };
}

function allStudentSummaries() {
  return loadUsers().map(studentSummary);
}

// Small round avatar used in the Teacher table and Leaderboard rows —
// mirrors renderAvatar() but works for *any* user, not just the logged-in
// one, and accepts a size in pixels.
function renderUserAvatar(user, sizePx) {
  const av = user.avatarId ? AVATARS.find((a) => a.id === user.avatarId) : null;
  const initialsSource = (user.nickname || user.name || "?").trim();
  const initials = initialsSource.charAt(0).toUpperCase() || "?";
  const style = `width:${sizePx}px; height:${sizePx}px; font-size:${Math.round(sizePx * 0.42)}px; flex-shrink:0;`;
  if (av) {
    return `<div class="avatar" style="${style}"><img src="${av.src}" alt="${escapeHtml(av.label)} avatar" /></div>`;
  }
  return `<div class="avatar" style="${style}">${initials}</div>`;
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
  // Which grade rows are expanded on the eBook Modules page (accordion —
  // collapsed by default, toggled on click). Not persisted; resets per visit.
  expandedGrades: new Set(),
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
  $("#view-avatar-setup").classList.add("hidden");
  $("#view-app").classList.add("hidden");
}

function showAdminNavItem() {
  const sidebarItem = $("#nav-admin-item");
  const bottomItem = $("#bottom-nav-admin-item");
  const show = !!(state.user && state.user.isAdmin);
  if (sidebarItem) sidebarItem.classList.toggle("hidden", !show);
  if (bottomItem) bottomItem.classList.toggle("hidden", !show);
}

// Admins can also open the Teacher page (it's just a read-only view of
// everyone's scores), so either flag reveals the nav item.
function showTeacherNavItem() {
  const sidebarItem = $("#nav-teacher-item");
  const bottomItem = $("#bottom-nav-teacher-item");
  const show = !!(state.user && (state.user.isTeacher || state.user.isAdmin));
  if (sidebarItem) sidebarItem.classList.toggle("hidden", !show);
  if (bottomItem) bottomItem.classList.toggle("hidden", !show);
}

function enterApp() {
  $("#view-login").classList.add("hidden");
  $("#view-signup").classList.add("hidden");
  state.progress = loadProgress(state.user.email);
  showAdminNavItem();
  showTeacherNavItem();

  // First time in (or an older account from before this feature existed):
  // pick an avatar + nickname before ever seeing the dashboard.
  if (!state.user.profileComplete) {
    showAvatarSetup();
    return;
  }
  $("#view-app").classList.remove("hidden");
  navigate("home");
}

/* ============================================================
   PROFILE SETUP SCREEN (avatar + nickname)
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

/* opts.edit = true when reopened later from the Profile page, rather than
   the mandatory first-run screen shown right after signup/login. */
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

  // Re-bind the continue/cancel buttons fresh each time this screen opens,
  // so listeners don't stack up across multiple visits.
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

/* Renders the circular avatar image if the user picked one, falling back
   to their initials (used in the dashboard side panel and Profile page). */
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
    case "modules": main.innerHTML = renderModuleList(); attachModuleListEvents(); break;
    case "lesson": main.innerHTML = renderLesson(state.activeModuleId); attachLessonEvents(); break;
    case "quiz": main.innerHTML = renderQuizStart(state.activeModuleId); attachQuizEvents(); break;
    case "quiz-result": main.innerHTML = renderQuizResult(opts.result); attachResultEvents(opts.result); break;
    case "profile": main.innerHTML = renderProfile(); attachProfileEvents(); break;
    case "settings": main.innerHTML = renderSettings(); attachSettingsEvents(); break;
    case "admin": main.innerHTML = renderAdmin(); attachAdminEvents(); break;
    case "teacher": main.innerHTML = renderTeacher(); attachTeacherEvents(); break;
    case "leaderboard": main.innerHTML = renderLeaderboard(); attachLeaderboardEvents(); break;
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

// Every module across every grade the current user can currently access
// (only grades with active serial-key access count).
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
  const continueId = findContinueModuleId();

  if (!pool.length) {
    return `
      <div class="topbar">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-subtitle">Welcome back, ${escapeHtml(state.user.nickname || state.user.name)}</div>
        </div>
      </div>
      <div class="card" style="text-align:center;">No modules are available yet.</div>
    `;
  }

  // Feature row: spotlight up to 3 modules the learner hasn't finished yet,
  // starting with whatever "Continue Learning" points to. If everything is
  // finished, just show the first 3 modules instead.
  const notCompleted = pool.filter((m) => !p.completed[m.id]);
  const featured = (notCompleted.length ? notCompleted : pool)
    .slice()
    .sort((a, b) => (a.id === continueId ? -1 : b.id === continueId ? 1 : a.id - b.id))
    .slice(0, 3);

  // Quiz Progress list: continue-module first (highlighted), then the next
  // couple of unlocked modules — mirrors the "Homework progress" panel.
  const unlockedModules = pool.filter((m) => isModuleUnlocked(m, p, state.user.email));
  const progressList = [
    ...unlockedModules.filter((m) => m.id === continueId),
    ...unlockedModules.filter((m) => m.id !== continueId),
  ].slice(0, 3);

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Welcome back, ${escapeHtml(state.user.nickname || state.user.name)}</div>
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
              ${pool.map((m) => {
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
                          <div>Grade ${m.grade} — ${escapeHtml(m.title)}</div>
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
          ${renderAvatar()}
          <div class="p-name">${escapeHtml(state.user.nickname || state.user.name)}</div>
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
                  <div class="pi-sub">Grade ${m.grade}</div>
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
      const mod = getAllModules().find((m) => m.id === id);
      if (!mod || !isModuleUnlocked(mod, state.progress, state.user.email)) {
        showToast(moduleLockedMessage(mod));
        return;
      }
      navigate("lesson", { moduleId: id });
    });
  });

  // "My Modules" table rows
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

/* ---- Module list (grouped by Grade 4-12) ---- */
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

// Grade sections are collapsed by default — only the grade-level row is
// shown (no module counts anywhere). Clicking a grade row toggles it open,
// and only then does its content (locked message or the actual modules)
// render in the body below it. Which grades are currently open lives in
// state.expandedGrades so it survives re-renders within the same page visit.
function renderGradeSection(grade) {
  const email = state.user.email;
  const mods = modulesByGrade(grade.level);
  const hasContent = mods.length > 0;
  const accessible = isGradeAccessible(grade.level, email);
  const expanded = state.expandedGrades.has(grade.level);

  let body;
  if (!hasContent) {
    body = `
      <div class="card locked-grade-card">
        <div class="lg-title">Coming soon</div>
        <div class="lg-sub">No modules have been uploaded for ${escapeHtml(grade.label)} yet.</div>
      </div>`;
  } else if (!accessible) {
    body = `
      <div class="card locked-grade-card">
        <div class="lg-title">Locked</div>
        <div class="lg-sub">Redeem a serial key to unlock ${escapeHtml(grade.label)} for one year.</div>
        <button class="btn btn-primary btn-sm redeem-serial-btn" style="margin-top:10px; width:auto;">Redeem Serial Key</button>
      </div>`;
  } else {
    body = mods.map((m) => renderModuleCard(m, { progress: state.progress, email })).join("");
  }

  const statusTag = !hasContent
    ? '<span class="grade-status-tag soon">Coming soon</span>'
    : !accessible
      ? '<span class="grade-status-tag locked">Locked</span>'
      : '<span class="grade-status-tag open">Unlocked</span>';

  return `
    <div class="grade-block" data-grade="${grade.level}">
      <button type="button" class="card grade-row ${expanded ? "expanded" : ""}" data-grade-toggle="${grade.level}">
        <span class="grade-row-title">
          ${escapeHtml(grade.label)}${grade.seniorHigh ? ' <span class="grade-shs-tag">Senior High</span>' : ""}
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
        <div class="page-subtitle">Grade 4 through Grade 12 — tap a grade to view its modules. Pass each quiz with 80%+ to unlock the next one.</div>
      </div>
    </div>
    ${accessBanner}
    ${GRADES.map(renderGradeSection).join("")}
  `;
}

// Small banner shown at the top of the Modules page summarizing access
// status. No grade is free — every grade (4-12) needs an active serial key.
function accessStatusBanner() {
  const email = state.user.email;
  if (hasActiveAccess(email)) {
    const days = accessDaysRemaining(email);
    return `<div class="card access-banner active">Serial-key access is active for all grades — ${days} day${days === 1 ? "" : "s"} remaining.</div>`;
  }
  return `<div class="card access-banner">All grades (4-12) are locked until you redeem a serial key from an admin. <button class="btn btn-outline btn-sm redeem-serial-btn" style="width:auto; margin-left:8px;">Redeem Serial Key</button></div>`;
}

function attachModuleListEvents() {
  // Toggle open/closed in place (no full re-render / scroll jump) — just
  // flip the tracked state and the two classes that control the chevron
  // rotation and the hidden body.
  $all("[data-grade-toggle]").forEach((row) => {
    row.addEventListener("click", () => {
      const level = Number(row.dataset.gradeToggle);
      const body = row.parentElement.querySelector(".grade-section");
      const nowExpanded = !state.expandedGrades.has(level);
      if (nowExpanded) {
        state.expandedGrades.add(level);
      } else {
        state.expandedGrades.delete(level);
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
    description: "Unlocks every grade (4-12) for one year from today.",
    fields: [{ id: "code", label: "Serial Key", type: "text", placeholder: "CREO-XXXX-XXXX-XXXX" }],
    confirmLabel: "Redeem",
    onSubmit: async ({ code }) => {
      const err = redeemSerialKey(state.user.email, code || "");
      if (err) return err;
      showToast("Serial key redeemed! All grades are unlocked for one year.");
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
      <div class="hero-badge">Grade ${m.grade} · Module ${position} of ${siblingCount}</div>
      <h1>${escapeHtml(m.title)}</h1>
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
      // Once an answer has been picked for this question, it's revealed
      // (green/red) and locked — clicking another option no longer changes it.
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

        ${passed && hasNext ? `<div class="unlock-banner">The next module is now unlocked!</div>` : ""}

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
    const icon = completed ? "Done" : unlocked ? "Unlocked" : "Locked";
    return `
      <div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
        <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--ink-soft); background:#f1ecfd; padding:4px 9px; border-radius:999px; flex-shrink:0;">${icon}</div>
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

      // Pre-fill the modal with the current values.
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
  const active = hasActiveAccess(email);
  const days = accessDaysRemaining(email);

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

    <h3 style="color:var(--white); margin-bottom:12px;">Grade Access</h3>
    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">Grades 4-12</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">
              ${active ? `Active — ${days} day${days === 1 ? "" : "s"} remaining` : "No active serial key. Every grade, including Grade 4, stays locked until you redeem one."}
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

    <h3 style="color:var(--white); margin-bottom:12px;">Admin Access</h3>
    <div class="card">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">${state.user.isAdmin ? "Admin access is enabled" : "Enter Admin Code"}</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">${state.user.isAdmin ? "You can upload modules and generate serial keys." : "Have an admin code? Enter it to unlock the Admin page."}</div>
          </div>
        </div>
        ${state.user.isAdmin
          ? `<button class="btn btn-outline btn-sm" id="go-admin-btn">Open Admin</button>`
          : `<button class="btn btn-outline btn-sm" id="admin-code-btn">Enter Code</button>`}
      </div>
    </div>

    <h3 style="color:var(--white); margin: 24px 0 12px;">Teacher Access</h3>
    <div class="card">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">${state.user.isTeacher ? "Teacher access is enabled" : "Enter Teacher Code"}</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">${state.user.isTeacher ? "You can view every student's scores and progress." : "Ask an admin for a teacher code, then enter it here to unlock the read-only Teacher page."}</div>
          </div>
        </div>
        ${state.user.isTeacher
          ? `<button class="btn btn-outline btn-sm" id="go-teacher-btn">Open Teacher</button>`
          : `<button class="btn btn-outline btn-sm" id="teacher-code-btn">Enter Code</button>`}
      </div>
    </div>

    ${!state.user.isAdmin ? `
    <h3 style="color:var(--white); margin: 24px 0 12px;">My Class</h3>
    <div class="card">
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">${state.user.teacherEmail ? "Linked to a teacher" : "Not linked to a teacher yet"}</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">${
              state.user.teacherEmail
                ? `Your scores and progress are visible to ${escapeHtml(getTeacherDisplayName(state.user.teacherEmail))} on their Teacher Dashboard.`
                : "Get a class code from your teacher and enter it here so your progress shows up on their dashboard."
            }</div>
          </div>
        </div>
        ${state.user.teacherEmail
          ? `<button class="btn btn-outline btn-sm" id="leave-class-btn">Leave Class</button>`
          : `<button class="btn btn-outline btn-sm" id="join-class-btn">Enter Class Code</button>`}
      </div>
    </div>` : ""}
  `;
}

// Friendly name for a teacher's account, used in the student-facing "My
// Class" settings section. Falls back gracefully if the teacher account
// can't be found for some reason (e.g. edge-case data cleanup).
function getTeacherDisplayName(teacherEmail) {
  const teacher = loadUsers().find((u) => u.email === teacherEmail);
  if (!teacher) return "your teacher";
  return teacher.nickname || teacher.name;
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

  const goAdminBtn = $("#go-admin-btn");
  if (goAdminBtn) goAdminBtn.addEventListener("click", () => navigate("admin"));

  const adminCodeBtn = $("#admin-code-btn");
  if (adminCodeBtn) {
    adminCodeBtn.addEventListener("click", () => {
      showFormModal({
        title: "Enter Admin Code",
        description: "Grants access to the Admin page on this account.",
        fields: [{ id: "code", label: "Admin Code", type: "text", placeholder: "Admin code" }],
        confirmLabel: "Unlock",
        onSubmit: async ({ code }) => {
          const err = redeemAdminCode(state.user.email, code || "");
          if (err) return err;
          state.user = getCurrentUser();
          showAdminNavItem();
          showToast("Admin access enabled.");
          navigate("settings");
          return null;
        },
      });
    });
  }

  const goTeacherBtn = $("#go-teacher-btn");
  if (goTeacherBtn) goTeacherBtn.addEventListener("click", () => navigate("teacher"));

  const teacherCodeBtn = $("#teacher-code-btn");
  if (teacherCodeBtn) {
    teacherCodeBtn.addEventListener("click", () => {
      showFormModal({
        title: "Enter Teacher Code",
        description: "Grants access to the read-only Teacher page on this account.",
        fields: [{ id: "code", label: "Teacher Code", type: "text", placeholder: "Teacher code" }],
        confirmLabel: "Unlock",
        onSubmit: async ({ code }) => {
          const err = redeemTeacherCode(state.user.email, code || "");
          if (err) return err;
          state.user = getCurrentUser();
          showTeacherNavItem();
          showToast("Teacher access enabled.");
          navigate("settings");
          return null;
        },
      });
    });
  }

  const joinClassBtn = $("#join-class-btn");
  if (joinClassBtn) {
    joinClassBtn.addEventListener("click", () => {
      showFormModal({
        title: "Enter Class Code",
        description: "Ask your teacher for their class code so your progress shows up on their dashboard.",
        fields: [{ id: "code", label: "Class Code", type: "text", placeholder: "e.g. CLS-4F9K2P" }],
        confirmLabel: "Join",
        onSubmit: async ({ code }) => {
          const err = joinTeacherClass(state.user.email, code || "");
          if (err) return err;
          state.user = getCurrentUser();
          showToast("You've joined your teacher's class.");
          navigate("settings");
          return null;
        },
      });
    });
  }

  const leaveClassBtn = $("#leave-class-btn");
  if (leaveClassBtn) {
    leaveClassBtn.addEventListener("click", () => {
      showModal({
        title: "Leave this class?",
        body: "Your teacher will no longer see your scores or progress on their dashboard. You can rejoin anytime with a class code.",
        confirmLabel: "Leave Class",
        confirmClass: "btn-danger",
        onConfirm: () => {
          leaveTeacherClass(state.user.email);
          state.user = getCurrentUser();
          showToast("You've left the class.");
          navigate("settings");
        },
      });
    });
  }
}

/* ---- Admin ---- */
// Turns a block of pasted/typed text into lesson content blocks: blank
// lines separate paragraphs; a run of lines starting with "- " becomes a
// bullet list.
function parseLessonText(text) {
  const blocks = [];
  const chunks = text.split(/\r?\n\s*\r?\n/).map((c) => c.trim()).filter(Boolean);
  chunks.forEach((chunk) => {
    const lines = chunk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((l) => l.replace(/^-\s*/, "")) });
    } else {
      blocks.push({ type: "p", text: lines.join(" ") });
    }
  });
  return blocks;
}

let adminQuizRows = 1;

function renderAdminQuizRow(n) {
  return `
    <div class="card admin-quiz-row" data-row="${n}" style="margin-bottom:12px;">
      <div class="field"><label>Question ${n}</label><div class="input-wrap"><input type="text" class="aq-question" placeholder="Question text" /></div></div>
      <div class="grid grid-2" style="margin-top:4px;">
        ${["A", "B", "C", "D"].map((l, i) => `
          <div class="field">
            <label>Option ${l}</label>
            <div class="input-wrap" style="display:flex; align-items:center; gap:8px;">
              <input type="radio" name="aq-correct-${n}" value="${i}" ${i === 0 ? "checked" : ""} style="width:auto;" />
              <input type="text" class="aq-option" data-index="${i}" placeholder="Option ${l}" />
            </div>
          </div>`).join("")}
      </div>
      <div class="field"><label>Explanation (shown if wrong)</label><div class="input-wrap"><input type="text" class="aq-explanation" placeholder="Why the correct answer is correct" /></div></div>
    </div>`;
}

function renderAdmin() {
  if (!state.user.isAdmin) {
    return `
      <div class="topbar"><div class="page-title">Admin</div></div>
      <div class="card" style="text-align:center;">You don't have admin access.</div>
    `;
  }

  const keys = loadSerialKeys();
  const keyRows = keys.length
    ? keys.slice().reverse().map((k) => `
        <tr>
          <td style="font-family:monospace;">${escapeHtml(k.code)}</td>
          <td><span class="status-pill ${k.usedBy ? "done" : "progress"}">${k.usedBy ? "Used" : "Available"}</span></td>
          <td>${k.usedBy ? escapeHtml(k.usedBy) : "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--ink-soft);">No serial keys generated yet.</td></tr>`;

  const teacherCodes = loadTeacherCodes();
  const teacherCodeRows = teacherCodes.length
    ? teacherCodes.slice().reverse().map((k) => `
        <tr>
          <td style="font-family:monospace;">${escapeHtml(k.code)}</td>
          <td><span class="status-pill ${k.usedBy ? "done" : "progress"}">${k.usedBy ? "Used" : "Available"}</span></td>
          <td>${k.usedBy ? escapeHtml(k.usedBy) : "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--ink-soft);">No teacher codes generated yet.</td></tr>`;

  // Grade 4's built-in modules aren't admin-uploaded content, so it's left
  // out of the upload dropdown and "Manage" button — but it still requires
  // a redeemed serial key like every other grade (no grade is free).
  const gradeOptions = GRADES.filter((g) => g.level !== BUILTIN_GRADE)
    .map((g) => `<option value="${g.level}">${escapeHtml(g.label)}</option>`).join("");

  const catalogRows = GRADES.map((g) => {
    const count = modulesByGrade(g.level).length;
    return `
      <div class="settings-row">
        <div class="settings-row-left">
          <div class="settings-icon"></div>
          <div>
            <div style="font-weight:600;">${escapeHtml(g.label)}</div>
            <div style="color:var(--ink-soft); font-size:0.8rem;">${count} module${count === 1 ? "" : "s"}${g.level === BUILTIN_GRADE ? " · Built-in" : ""} · Requires serial key</div>
          </div>
        </div>
        ${g.level === BUILTIN_GRADE ? "" : `<button class="btn btn-outline btn-sm admin-manage-grade" data-grade="${g.level}" ${count ? "" : "disabled style='opacity:.5;'"}>Manage</button>`}
      </div>`;
  }).join("");

  return `
    <div class="topbar"><div class="page-title">Admin</div></div>

    <h3 style="color:var(--white); margin-bottom:12px;">Grade Catalog</h3>
    <div class="card" style="margin-bottom:20px;">${catalogRows}</div>

    <h3 style="color:var(--white); margin-bottom:12px;">Serial Keys</h3>
    <div class="card" style="margin-bottom:20px;">
      <p style="color:var(--ink-soft); font-size:0.85rem; margin-bottom:12px;">Each key grants one student one year of access to every grade (4-12) once redeemed. No grade is free — students need a key to access any of them.</p>
      <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom:16px;">
        <div class="field" style="margin:0;">
          <label for="admin-key-count">How many keys?</label>
          <div class="input-wrap"><input id="admin-key-count" type="number" min="1" max="100" value="1" /></div>
        </div>
        <button class="btn btn-primary btn-sm" id="admin-generate-keys" style="width:auto;">Generate</button>
      </div>
      <table class="course-table">
        <thead><tr><th>Code</th><th>Status</th><th>Used By</th></tr></thead>
        <tbody id="admin-key-rows">${keyRows}</tbody>
      </table>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Teacher Codes</h3>
    <div class="card" style="margin-bottom:20px;">
      <p style="color:var(--ink-soft); font-size:0.85rem; margin-bottom:12px;">Each code grants one account permanent, read-only access to the Teacher Dashboard (every student's scores and current module). Give one to a teacher, then have them redeem it from Settings &rarr; Teacher Access. Each code works once.</p>
      <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom:16px;">
        <div class="field" style="margin:0;">
          <label for="admin-teacher-code-count">How many codes?</label>
          <div class="input-wrap"><input id="admin-teacher-code-count" type="number" min="1" max="100" value="1" /></div>
        </div>
        <button class="btn btn-primary btn-sm" id="admin-generate-teacher-codes" style="width:auto;">Generate</button>
      </div>
      <table class="course-table">
        <thead><tr><th>Code</th><th>Status</th><th>Used By</th></tr></thead>
        <tbody id="admin-teacher-code-rows">${teacherCodeRows}</tbody>
      </table>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Upload a Module</h3>
    <div class="card" style="margin-bottom:20px;">
      <div id="admin-upload-error" class="error-banner hidden"></div>
      <div class="field">
        <label for="admin-grade">Grade</label>
        <div class="input-wrap"><select id="admin-grade">${gradeOptions}</select></div>
      </div>
      <div class="field">
        <label for="admin-title">Module Title</label>
        <div class="input-wrap"><input id="admin-title" type="text" placeholder="e.g. Intro to Sensors" /></div>
      </div>
      <div class="field">
        <label for="admin-subtitle">Subtitle</label>
        <div class="input-wrap"><input id="admin-subtitle" type="text" placeholder="A short tagline" /></div>
      </div>
      <div class="field">
        <label for="admin-content">Lesson Content</label>
        <div class="input-wrap">
          <textarea id="admin-content" rows="8" placeholder="Write each paragraph as its own block, separated by a blank line. For a bullet list, start every line in that block with '- '."></textarea>
        </div>
      </div>

      <div style="font-weight:700; margin:18px 0 10px;">Quiz Questions</div>
      <div id="admin-quiz-rows">${renderAdminQuizRow(1)}</div>
      <button type="button" class="btn btn-outline btn-sm" id="admin-add-question" style="width:auto; margin-bottom:16px;">+ Add Question</button>

      <button type="button" class="btn btn-primary" id="admin-publish-module">Publish Module</button>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">Uploaded Modules</h3>
    <div class="card" id="admin-uploaded-list">
      ${loadCustomModules().length
        ? loadCustomModules().map((m) => `
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-icon"></div>
              <div>
                <div style="font-weight:600;">Grade ${m.grade}: ${escapeHtml(m.title)}</div>
                <div style="color:var(--ink-soft); font-size:0.8rem;">${escapeHtml(m.subtitle)}</div>
              </div>
            </div>
            <button class="btn btn-danger btn-sm admin-delete-module" data-id="${m.id}">Delete</button>
          </div>`).join("")
        : `<div style="color:var(--ink-soft); text-align:center;">No uploaded modules yet.</div>`}
    </div>
  `;
}

function attachAdminEvents() {
  if (!state.user.isAdmin) return;

  adminQuizRows = 1;

  $("#admin-generate-keys").addEventListener("click", () => {
    const count = Math.max(1, Math.min(100, Number($("#admin-key-count").value) || 1));
    generateSerialKeys(count);
    showToast(`Generated ${count} serial key${count === 1 ? "" : "s"}.`);
    navigate("admin");
  });

  $("#admin-generate-teacher-codes").addEventListener("click", () => {
    const count = Math.max(1, Math.min(100, Number($("#admin-teacher-code-count").value) || 1));
    generateTeacherCodes(count);
    showToast(`Generated ${count} teacher code${count === 1 ? "" : "s"}.`);
    navigate("admin");
  });

  $("#admin-add-question").addEventListener("click", () => {
    adminQuizRows++;
    $("#admin-quiz-rows").insertAdjacentHTML("beforeend", renderAdminQuizRow(adminQuizRows));
  });

  $("#admin-publish-module").addEventListener("click", () => {
    const errBox = $("#admin-upload-error");
    errBox.classList.add("hidden");

    const grade = Number($("#admin-grade").value);
    const title = $("#admin-title").value.trim();
    const subtitle = $("#admin-subtitle").value.trim();
    const contentText = $("#admin-content").value.trim();

    if (!title) return showAdminError(errBox, "Enter a module title.");
    if (!subtitle) return showAdminError(errBox, "Enter a subtitle.");
    if (!contentText) return showAdminError(errBox, "Enter the lesson content.");

    const quiz = [];
    const rows = $all("#admin-quiz-rows .admin-quiz-row");
    for (const row of rows) {
      const qText = row.querySelector(".aq-question").value.trim();
      const optionInputs = Array.from(row.querySelectorAll(".aq-option"));
      const options = optionInputs.map((i) => i.value.trim());
      const explanation = row.querySelector(".aq-explanation").value.trim();
      const correctRadio = row.querySelector(`input[type="radio"]:checked`);
      if (!qText || options.some((o) => !o)) {
        return showAdminError(errBox, "Fill in every question and all four options.");
      }
      quiz.push({ q: qText, options, correct: Number(correctRadio.value), explanation });
    }
    if (!quiz.length) return showAdminError(errBox, "Add at least one quiz question.");

    const mod = {
      id: nextModuleId(),
      grade,
      order: modulesByGrade(grade).length + 1,
      title,
      subtitle,
      color: "var(--purple)",
      content: parseLessonText(contentText),
      quiz,
    };
    addCustomModule(mod);
    showToast(`Module published to Grade ${grade}.`);
    navigate("admin");
  });

  $all(".admin-manage-grade").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = $("#admin-uploaded-list");
      if (list) list.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $all(".admin-delete-module").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      showModal({
        title: "Delete Module?",
        body: "Students will lose access to this module. This cannot be undone.",
        confirmLabel: "Delete",
        confirmClass: "btn-danger",
        onConfirm: () => {
          deleteCustomModule(id);
          showToast("Module deleted.");
          navigate("admin");
        },
      });
    });
  });

  function showAdminError(box, msg) {
    box.textContent = msg;
    box.classList.remove("hidden");
  }
}

/* ---- Teacher ---- */
function renderTeacher() {
  if (!(state.user.isTeacher || state.user.isAdmin)) {
    return `
      <div class="topbar"><div class="page-title">Teacher</div></div>
      <div class="card" style="text-align:center;">You don't have teacher access. Unlock it from Settings &rarr; Teacher Access.</div>
    `;
  }

  // Refresh state.user in case classCode was just generated (e.g. an
  // older teacher account visiting this page for the first time since
  // class-linking was added).
  if (state.user.isTeacher && !state.user.isAdmin) {
    ensureTeacherClassCode(state.user.email);
    state.user = getCurrentUser();
  }

  const summaries = visibleStudentsFor(state.user).sort((a, b) => b.completedCount - a.completedCount);
  const totalStudents = summaries.length;
  const avgClassScore = totalStudents
    ? Math.round(summaries.reduce((sum, s) => sum + s.avgScore, 0) / totalStudents)
    : 0;
  const activeCount = summaries.filter((s) => s.accessActive).length;

  const emptyMessage = state.user.isAdmin
    ? "No students have signed up on this browser yet."
    : "No students have joined your class yet — share your class code above so they can link their account to you.";

  const rows = summaries.length
    ? summaries
        .map(
          (s) => `
        <tr data-email="${escapeHtml(s.user.email)}" class="teacher-row">
          <td>
            <div class="course-name-cell">
              ${renderUserAvatar(s.user, 34)}
              <div>
                <div>${escapeHtml(s.user.nickname || s.user.name)}</div>
                <div class="cn-sub">${escapeHtml(s.user.email)}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(s.user.school || "—")}</td>
          <td>
            ${s.currentModule.status === "done"
              ? `<span class="status-pill done">All caught up</span>`
              : s.currentModule.status === "none"
                ? `<span class="status-pill locked">No grade access</span>`
                : `<span class="current-module-tag">${currentModuleLabel(s.currentModule)}</span>`}
          </td>
          <td>${s.completedCount} / ${s.totalModules}</td>
          <td>${s.avgScore}%</td>
          <td><span class="status-pill ${s.accessActive ? "done" : "locked"}">${s.accessActive ? "Active" : "No Access"}</span></td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6" style="color:var(--ink-soft); text-align:center; padding:18px 0;">${emptyMessage}</td></tr>`;

  const classCodeCard = (!state.user.isAdmin && state.user.isTeacher)
    ? `
    <div class="card" style="margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font-weight:600;">Your Class Code</div>
        <div style="color:var(--ink-soft); font-size:0.85rem;">Share this with your students — they enter it in Settings &rarr; My Class to link their progress to you.</div>
      </div>
      <div style="font-family:monospace; font-size:1.3rem; font-weight:700; letter-spacing:0.05em; background:#f1ecfd; color:var(--purple); padding:8px 16px; border-radius:10px;">${escapeHtml(state.user.classCode || "—")}</div>
    </div>`
    : "";

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Teacher Dashboard</div>
        <div class="page-subtitle">${state.user.isAdmin ? "Every student's progress, on this device" : "Students who have joined your class"}</div>
      </div>
      <button class="btn btn-primary btn-sm" id="teacher-export-csv" style="width:auto;">Export CSV</button>
    </div>

    ${classCodeCard}

    <div class="grid grid-2" style="margin-bottom:20px;">
      <div class="card stat-card">
        <div class="stat-badge" style="background:#f1ecfd; color:var(--purple);">${totalStudents}</div>
        <div><div class="stat-value">${totalStudents}</div><div class="stat-label">Students</div></div>
      </div>
      <div class="card stat-card">
        <div class="stat-badge" style="background:rgba(47,174,102,0.14); color:var(--success);">${activeCount}</div>
        <div><div class="stat-value">${activeCount}</div><div class="stat-label">With Active Access</div></div>
      </div>
      <div class="card stat-card">
        <div class="stat-badge" style="background:rgba(240,166,77,0.16); color:#c97a1c;">${avgClassScore}%</div>
        <div><div class="stat-value">${avgClassScore}%</div><div class="stat-label">Average Quiz Score</div></div>
      </div>
    </div>

    <h3 style="color:var(--white); margin-bottom:12px;">All Students</h3>
    <div class="card">
      <p style="color:var(--ink-soft); font-size:0.85rem; margin-bottom:14px;">Tap a student to see their full per-module breakdown.</p>
      <table class="course-table">
        <thead><tr><th>Student</th><th>School</th><th>Current Module</th><th>Completed</th><th>Avg Score</th><th>Access</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function attachTeacherEvents() {
  if (!(state.user.isTeacher || state.user.isAdmin)) return;
  $all(".teacher-row").forEach((row) => {
    row.addEventListener("click", () => openStudentDetailModal(row.dataset.email));
  });

  const exportBtn = $("#teacher-export-csv");
  if (exportBtn) exportBtn.addEventListener("click", downloadTeacherGradebookCSV);
}

// Read-only per-module breakdown for one student, opened from the Teacher
// table. Reuses the generic modal shell (showModal/showFormModal build
// their own markup, so this one constructs the modal directly).
function openStudentDetailModal(email) {
  const user = loadUsers().find((u) => u.email === email);
  if (!user) return;
  const summary = studentSummary(user);

  const rowsHtml = getAllModules()
    .slice()
    .sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id))
    .map((m) => {
      const completed = summary.progress.completed[m.id];
      const score = summary.progress.highest[m.id] || 0;
      const attempts = (summary.progress.history[m.id] || []).length;
      const isCurrent = summary.currentModule.status === "in-progress" && summary.currentModule.module.id === m.id;
      let statusLabel = completed ? "Completed" : attempts ? "In Progress" : "Not Started";
      let statusClass = completed ? "done" : attempts ? "progress" : "locked";
      if (isCurrent) { statusLabel = "Current Module"; statusClass = "progress"; }
      return `
        <tr class="${isCurrent ? "current-module-row" : ""}">
          <td>Grade ${m.grade}: ${escapeHtml(m.title)}</td>
          <td>${attempts ? `${score}%` : "—"}</td>
          <td>${attempts}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
        </tr>`;
    })
    .join("");

  const currentSummaryLine = summary.currentModule.status === "in-progress"
    ? `Currently on: <strong>Grade ${summary.currentModule.module.grade} — ${escapeHtml(summary.currentModule.module.title)}</strong>`
    : summary.currentModule.status === "done"
      ? "All accessible modules completed"
      : "No grade access yet";

  const root = $("#modal-root");
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width:560px; text-align:left;">
        <div style="text-align:center; margin-bottom:18px;">
          ${renderUserAvatar(user, 64)}
          <h3 style="margin-top:10px; margin-bottom:2px;">${escapeHtml(user.nickname || user.name)}</h3>
          <p style="margin:0;">${escapeHtml(user.email)}${user.school ? ` &middot; ${escapeHtml(user.school)}` : ""}</p>
          <p style="margin-top:6px; font-size:0.85rem; color:var(--ink-soft);">${currentSummaryLine}</p>
        </div>
        <div style="max-height:360px; overflow-y:auto;">
          <table class="course-table">
            <thead><tr><th>Module</th><th>Best Score</th><th>Attempts</th><th>Status</th></tr></thead>
            <tbody>${rowsHtml || `<tr><td colspan="4" style="color:var(--ink-soft); text-align:center; padding:14px 0;">No modules exist yet.</td></tr>`}</tbody>
          </table>
        </div>
        <div class="modal-actions" style="margin-top:18px;">
          <button class="btn btn-primary" id="modal-cancel" style="width:100%;">Close</button>
        </div>
      </div>
    </div>`;
  root.querySelector("#modal-cancel").addEventListener("click", () => (root.innerHTML = ""));
}

/* ---- Teacher: export gradebook as CSV (opens cleanly in Excel/Sheets) ----
   Fixed format: one row per student, one column per module (in Grade →
   order sequence), plus summary columns at the end. Column set is the
   same every export — a student with no attempts on a module just gets
   a blank cell there, so the sheet lines up the same way every time,
   the way a teacher's existing gradebook usually does. */

// Wraps a single CSV field in quotes (and escapes any quotes inside it)
// whenever it contains a comma, quote, or newline — otherwise returns it
// as-is. Needed because names/schools can contain commas.
function csvField(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildTeacherGradebookCSV() {
  const summaries = visibleStudentsFor(state.user);
  const modules = getAllModules()
    .slice()
    .sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id));

  const header = [
    "Name",
    "Email",
    "School",
    ...modules.map((m) => `Grade ${m.grade}: ${m.title}`),
    "Completed Modules",
    "Total Modules",
    "Average Score (%)",
    "Access Status",
  ];

  const rows = summaries.map((s) => {
    const moduleScores = modules.map((m) => {
      const attempts = (s.progress.history[m.id] || []).length;
      return attempts ? (s.progress.highest[m.id] || 0) : ""; // blank = never attempted
    });
    return [
      s.user.nickname || s.user.name,
      s.user.email,
      s.user.school || "",
      ...moduleScores,
      s.completedCount,
      s.totalModules,
      s.avgScore,
      s.accessActive ? "Active" : "No Access",
    ];
  });

  return [header, ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\n");
}

function downloadTeacherGradebookCSV() {
  const summaries = visibleStudentsFor(state.user);
  if (!summaries.length) {
    showToast("No students to export yet.");
    return;
  }

  const csvContent = buildTeacherGradebookCSV();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const scopeLabel = state.user.isAdmin ? "all-students" : (state.user.classCode || "my-class");
  const a = document.createElement("a");
  a.href = url;
  a.download = `creobotics-gradebook-${scopeLabel}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Gradebook CSV downloaded.");
}

/* ---- Leaderboard ---- */
// Ranked by total modules completed (across every grade), tie-broken by
// average quiz score, WITHIN the viewer's own class (see
// visibleStudentsFor) — not every student on the device. Visible to
// every logged-in user, not just teachers/admins — it's meant as light
// gamification for students too, but only against their actual classmates.
function renderLeaderboard() {
  const pool = visibleStudentsFor(state.user);
  const ranked = pool.slice().sort((a, b) => {
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return b.avgScore - a.avgScore;
  });
  const myEmail = state.user.email;
  const medals = ["🥇", "🥈", "🥉"];

  const noClassMessage = (!state.user.isAdmin && !state.user.isTeacher && !state.user.teacherEmail)
    ? `<div style="color:var(--ink-soft); text-align:center; padding:18px 0;">Join a class from Settings &rarr; My Class to see how you rank against your classmates.</div>`
    : `<div style="color:var(--ink-soft); text-align:center; padding:18px 0;">No students here yet — be the first to complete a module!</div>`;

  const rows = ranked.length
    ? ranked
        .map((s, i) => {
          const isMe = s.user.email === myEmail;
          const rankLabel = i < 3 ? medals[i] : `#${i + 1}`;
          return `
        <div class="leaderboard-row ${isMe ? "me" : ""} ${i < 3 ? "top3" : ""}">
          <div class="lb-rank">${rankLabel}</div>
          ${renderUserAvatar(s.user, 46)}
          <div class="lb-info">
            <div class="lb-name">${escapeHtml(s.user.nickname || s.user.name)}${isMe ? " (You)" : ""}</div>
            <div class="lb-sub">${escapeHtml(s.user.school || "—")}</div>
          </div>
          <div class="lb-stats">
            <div class="lb-completed">${s.completedCount} module${s.completedCount === 1 ? "" : "s"}</div>
            <div class="lb-score">${s.avgScore}% avg score</div>
          </div>
        </div>`;
        })
        .join("")
    : noClassMessage;

  const subtitle = state.user.isAdmin
    ? "Ranked by modules completed across every grade — every student"
    : "Ranked by modules completed across every grade — your class only";

  return `
    <div class="topbar">
      <div>
        <div class="page-title">Leaderboard</div>
        <div class="page-subtitle">${subtitle}</div>
      </div>
    </div>
    <div class="card" style="padding:14px;">${rows}</div>
  `;
}

function attachLeaderboardEvents() {}

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