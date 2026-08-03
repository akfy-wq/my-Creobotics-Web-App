// app.js - Complete Version with MySQL Backend Integration
// Location: js/app.js

import * as api from './api.js';

console.log('🚀 Creobotics app.js loaded!');

// ============================================================
// DATA FROM data.js (Global variables from script)
// ============================================================

// The MODULES, GRADES, AVATARS, BUILTIN_GRADE are defined in data.js
// which is loaded as a regular script before this module

// ============================================================
// STATE
// ============================================================

const state = {
    user: null,
    profile: null,
    progress: null,
    currentPage: 'home',
    activeModuleId: null,
    calendarOffset: 0,
    quiz: { questions: [], index: 0, answers: [] },
    expandedGrades: new Set(),
    initialized: false,
    allModules: [],
    students: [] // For teacher/leaderboard
};

const PASSING_SCORE = 80;

// ============================================================
// UI HELPERS
// ============================================================

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

function showModal({ title, body, confirmLabel, confirmClass = 'btn-primary', onConfirm }) {
    const root = $('#modal-root');
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
    root.querySelector('#modal-cancel').addEventListener('click', () => (root.innerHTML = ''));
    root.querySelector('#modal-confirm').addEventListener('click', () => {
        root.innerHTML = '';
        onConfirm();
    });
}

function showFormModal({ title, description, fields, confirmLabel, onSubmit }) {
    const root = $('#modal-root');
    const fieldsHtml = fields
        .map(
            (f) => `
        <div class="field" style="text-align:left;">
            <label for="modal-${f.id}">${f.label}</label>
            <div class="input-wrap">
                <input id="modal-${f.id}" type="${f.type || 'text'}" placeholder="${f.placeholder || ''}" autocomplete="${f.autocomplete || 'off'}" />
            </div>
        </div>`
        )
        .join('');

    root.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-box" style="text-align:left; max-width:380px;">
                <h3 style="text-align:center;">${title}</h3>
                ${description ? `<p style="text-align:center;">${description}</p>` : ''}
                <div id="modal-form-error" class="error-banner hidden"></div>
                ${fieldsHtml}
                <div class="modal-actions" style="margin-top:4px;">
                    <button class="btn btn-outline" id="modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="modal-confirm">${confirmLabel}</button>
                </div>
            </div>
        </div>`;

    root.querySelector('#modal-cancel').addEventListener('click', () => (root.innerHTML = ''));
    root.querySelector('#modal-confirm').addEventListener('click', async () => {
        const values = {};
        fields.forEach((f) => (values[f.id] = document.getElementById(`modal-${f.id}`).value));

        const errBox = document.getElementById('modal-form-error');
        errBox.classList.add('hidden');

        const err = await onSubmit(values);
        if (err) {
            errBox.textContent = err;
            errBox.classList.remove('hidden');
        } else {
            root.innerHTML = '';
        }
    });
}

// ============================================================
// AVATAR SETUP
// ============================================================

let avatarSetupSelected = null;

function renderAvatarGrid(selectedId) {
    if (typeof AVATARS === 'undefined') {
        console.error('AVATARS not defined! Make sure data.js is loaded.');
        return '';
    }
    return AVATARS.map(
        (a) => `
        <button type="button" class="avatar-option ${a.id === selectedId ? 'selected' : ''}" data-avatar-id="${a.id}" title="${escapeHtml(a.label)} avatar">
            <img src="${a.src}" alt="${escapeHtml(a.label)} avatar" />
        </button>`
    ).join('');
}

function renderAvatar(styleAttr = '') {
    const av = state.profile?.avatar_id ? AVATARS.find((a) => a.id === state.profile.avatar_id) : null;
    const initialsSource = (state.profile?.nickname || state.profile?.name || '?').trim();
    const initials = initialsSource.charAt(0).toUpperCase() || '?';
    const styleHtml = styleAttr ? ` style="${styleAttr}"` : '';
    if (av) {
        return `<div class="avatar"${styleHtml}><img src="${av.src}" alt="${escapeHtml(av.label)} avatar" /></div>`;
    }
    return `<div class="avatar"${styleHtml}>${initials}</div>`;
}

function renderUserAvatar(user, sizePx) {
    const av = user.avatar_id ? AVATARS.find((a) => a.id === user.avatar_id) : null;
    const initialsSource = (user.nickname || user.name || '?').trim();
    const initials = initialsSource.charAt(0).toUpperCase() || '?';
    const style = `width:${sizePx}px; height:${sizePx}px; font-size:${Math.round(sizePx * 0.42)}px; flex-shrink:0;`;
    if (av) {
        return `<div class="avatar" style="${style}"><img src="${av.src}" alt="${escapeHtml(av.label)} avatar" /></div>`;
    }
    return `<div class="avatar" style="${style}">${initials}</div>`;
}

function showAvatarSetup(opts = {}) {
    const isEdit = !!opts.edit;

    $('#view-login').classList.add('hidden');
    $('#view-signup').classList.add('hidden');
    $('#view-app').classList.add('hidden');
    $('#view-avatar-setup').classList.remove('hidden');

    $('#avatar-setup-heading').textContent = isEdit ? 'Update your profile' : 'Set up your profile';
    $('#avatar-setup-subtitle').textContent = isEdit
        ? 'Change your avatar or nickname anytime'
        : 'Pick an avatar and a nickname to get started';
    $('#avatar-setup-error').classList.add('hidden');
    $('#avatar-setup-cancel-wrap').classList.toggle('hidden', !isEdit);

    avatarSetupSelected = state.profile?.avatar_id || null;
    $('#avatar-grid').innerHTML = renderAvatarGrid(avatarSetupSelected);
    $('#setup-nickname').value = state.profile?.nickname || '';

    $all('.avatar-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            avatarSetupSelected = btn.dataset.avatarId;
            $all('.avatar-option').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    const continueBtn = $('#avatar-setup-continue');
    const freshContinue = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(freshContinue, continueBtn);
    freshContinue.textContent = isEdit ? 'Save Changes' : 'Continue';
    freshContinue.addEventListener('click', async () => {
        const nickname = $('#setup-nickname').value.trim();
        const errBox = $('#avatar-setup-error');
        errBox.classList.add('hidden');

        if (!avatarSetupSelected) {
            errBox.textContent = 'Pick an avatar to continue.';
            errBox.classList.remove('hidden');
            return;
        }
        if (nickname.length < 2) {
            errBox.textContent = 'Enter a nickname (at least 2 characters).';
            errBox.classList.remove('hidden');
            return;
        }

        try {
            await api.updateAvatar(avatarSetupSelected, nickname);
            state.profile = await api.getCurrentUser();
            $('#view-avatar-setup').classList.add('hidden');
            $('#view-app').classList.remove('hidden');
            navigate(isEdit ? 'profile' : 'home');
            showToast(isEdit ? 'Profile updated.' : `Welcome, ${nickname}!`);
        } catch (error) {
            errBox.textContent = error.message || 'Failed to update profile';
            errBox.classList.remove('hidden');
        }
    });

    const cancelBtn = $('#avatar-setup-cancel');
    const freshCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
    if (isEdit) {
        freshCancel.addEventListener('click', () => {
            $('#view-avatar-setup').classList.add('hidden');
            $('#view-app').classList.remove('hidden');
            navigate('profile');
        });
    }
}

// ============================================================
// NAVIGATION / ROUTING
// ============================================================

function switchAuthView(target) {
    $('#view-login').classList.toggle('hidden', target !== 'login');
    $('#view-signup').classList.toggle('hidden', target !== 'signup');
    $('#view-avatar-setup').classList.add('hidden');
    $('#view-app').classList.add('hidden');
}

function showAdminNavItem() {
    const sidebarItem = $('#nav-admin-item');
    const bottomItem = $('#bottom-nav-admin-item');
    const show = !!(state.profile?.is_admin);
    if (sidebarItem) sidebarItem.classList.toggle('hidden', !show);
    if (bottomItem) bottomItem.classList.toggle('hidden', !show);
}

function showTeacherNavItem() {
    const sidebarItem = $('#nav-teacher-item');
    const bottomItem = $('#bottom-nav-teacher-item');
    const show = !!(state.profile && (state.profile.is_teacher || state.profile.is_admin));
    if (sidebarItem) sidebarItem.classList.toggle('hidden', !show);
    if (bottomItem) bottomItem.classList.toggle('hidden', !show);
}

function enterApp() {
    $('#view-login').classList.add('hidden');
    $('#view-signup').classList.add('hidden');
    showAdminNavItem();
    showTeacherNavItem();

    if (!state.profile?.profile_complete) {
        showAvatarSetup();
        return;
    }
    $('#view-app').classList.remove('hidden');
    navigate('home');
}

// ============================================================
// MODULE FUNCTIONS
// ============================================================

async function getAllModules() {
    try {
        const custom = await api.getCustomModules();
        return [...MODULES, ...custom];
    } catch (error) {
        console.error('Error getting modules:', error);
        return MODULES || [];
    }
}

async function modulesByGrade(grade) {
    const all = await getAllModules();
    return all
        .filter((m) => m.grade === grade)
        .sort((a, b) => (a.order || a.id) - (b.order || b.id));
}

function modulesByGradeSync(grade) {
    return (state.allModules || [])
        .filter((m) => m.grade === grade)
        .sort((a, b) => (a.order || a.id) - (b.order || b.id));
}

function hasActiveAccess() {
    return true; // For now, always true for testing
}

function accessDaysRemaining() {
    return 365;
}

function isGradeAccessible(grade) {
    if (grade === BUILTIN_GRADE) return true;
    return hasActiveAccess();
}

function isModuleUnlocked(mod) {
    if (!isGradeAccessible(mod.grade)) return false;
    const siblings = modulesByGradeSync(mod.grade);
    const idx = siblings.findIndex((m) => m.id === mod.id);
    if (idx <= 0) return true;
    const prev = siblings[idx - 1];
    return !!state.progress?.completed[prev.id];
}

function moduleLockedMessage(mod) {
    if (mod && !isGradeAccessible(mod.grade)) {
        return `Grade ${mod.grade} needs an active serial key. Redeem one to unlock it.`;
    }
    return 'Complete the previous module with 80%+ to unlock this one.';
}

// ============================================================
// RENDER FUNCTIONS - HOME, MODULES, LESSON, QUIZ
// ============================================================

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
    const monthLabel = base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const cells = getCalendarCells(base);
    const isCurrentMonth = state.calendarOffset === 0;
    const dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
                ${dow.map((d) => `<div class="mc-dow">${d}</div>`).join('')}
                ${cells
                    .map((c) => {
                        const isToday = isCurrentMonth && !c.muted && c.day === today.getDate();
                        return `<div class="mc-day ${c.muted ? 'muted' : ''} ${isToday ? 'today' : ''}">${c.day}</div>`;
                    })
                    .join('')}
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

async function renderHome(container) {
    if (!state.progress) {
        state.progress = await api.getProgress();
    }
    
    const p = state.progress;
    const allModules = await getAllModules();
    const pool = allModules.filter((m) => isGradeAccessible(m.grade));
    
    let continueId = null;
    const next = pool.find((m) => isModuleUnlocked(m) && !p.completed[m.id]);
    continueId = next ? next.id : (pool[0] ? pool[0].id : null);

    if (!pool.length) {
        container.innerHTML = `
            <div class="topbar">
                <div>
                    <div class="page-title">Dashboard</div>
                    <div class="page-subtitle">Welcome back, ${escapeHtml(state.profile?.nickname || state.profile?.name)}</div>
                </div>
            </div>
            <div class="card" style="text-align:center;">No modules are available yet.</div>
        `;
        return;
    }

    const notCompleted = pool.filter((m) => !p.completed[m.id]);
    const featured = (notCompleted.length ? notCompleted : pool)
        .slice()
        .sort((a, b) => (a.id === continueId ? -1 : b.id === continueId ? 1 : a.id - b.id))
        .slice(0, 3);

    const unlockedModules = pool.filter((m) => isModuleUnlocked(m));
    const progressList = [
        ...unlockedModules.filter((m) => m.id === continueId),
        ...unlockedModules.filter((m) => m.id !== continueId),
    ].slice(0, 3);

    container.innerHTML = `
        <div class="topbar">
            <div>
                <div class="page-title">Dashboard</div>
                <div class="page-subtitle">Welcome back, ${escapeHtml(state.profile?.nickname || state.profile?.name)}</div>
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
                            const unlocked = isModuleUnlocked(m);
                            return `
                            <div class="feature-card ${unlocked ? '' : 'locked'}" style="background:${m.color};" data-module-id="${m.id}">
                                <div>
                                    <div class="fc-icon">${m.id}</div>
                                    <div class="fc-title">${escapeHtml(m.title)}</div>
                                    <div class="fc-sub">${escapeHtml(m.subtitle)}</div>
                                </div>
                                <div class="fc-footer">
                                    <span class="fc-sub">${unlocked ? 'Unlocked' : 'Locked'}</span>
                                    <div class="fc-arrow">${unlocked ? '&rsaquo;' : '&ndash;'}</div>
                                </div>
                            </div>`;
                        })
                        .join('')}
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
                                const unlocked = isModuleUnlocked(m);
                                const completed = p.completed[m.id];
                                const score = p.highest[m.id] || 0;
                                let statusLabel = 'Locked', statusClass = 'locked';
                                if (completed) { statusLabel = 'Completed'; statusClass = 'done'; }
                                else if (unlocked && score > 0) { statusLabel = 'In Progress'; statusClass = 'progress'; }
                                else if (unlocked) { statusLabel = 'Not Started'; statusClass = 'progress'; }

                                return `
                                    <tr class="${unlocked ? '' : 'locked'}" data-module-id="${m.id}">
                                        <td>
                                            <div class="course-name-cell">
                                                <div class="course-mini-icon" style="background:${m.color};">${m.id}</div>
                                                <div>
                                                    <div>Grade ${m.grade} — ${escapeHtml(m.title)}</div>
                                                    <div class="cn-sub">${escapeHtml(m.subtitle)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${unlocked ? `${score}%` : '—'}</td>
                                        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                                    </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside class="right-panel">
                <div class="card profile-panel">
                    ${renderAvatar()}
                    <div class="p-name">${escapeHtml(state.profile?.nickname || state.profile?.name)}</div>
                    <div class="p-role">${escapeHtml(state.profile?.email)}</div>
                </div>

                ${renderMiniCalendar()}

                <div class="card" style="padding-top:16px;">
                    <div style="font-weight:700; margin-bottom:12px;">Quiz Progress</div>
                    ${progressList
                        .map((m, i) => {
                            const score = p.highest[m.id] || 0;
                            const filled = i === 0;
                            return `
                            <div class="progress-item ${filled ? 'filled' : 'outline'}" data-module-id="${m.id}">
                                ${renderSmallRing(score)}
                                <div>
                                    <div class="pi-title">${escapeHtml(m.title)}</div>
                                    <div class="pi-sub">Grade ${m.grade}</div>
                                </div>
                                <div class="pi-arrow">&rsaquo;</div>
                            </div>`;
                        })
                        .join('') || '<div style="color:var(--ink-soft); font-size:0.85rem;">No modules unlocked yet.</div>'}
                </div>
            </aside>
        </div>
    `;

    attachHomeEvents();
}

function attachHomeEvents() {
    $all('.feature-card').forEach((card) => {
        card.addEventListener('click', () => {
            const id = Number(card.dataset.moduleId);
            navigate('lesson', { moduleId: id });
        });
    });

    $all('.course-table tbody tr').forEach((row) => {
        row.addEventListener('click', () => {
            const id = Number(row.dataset.moduleId);
            navigate('lesson', { moduleId: id });
        });
    });

    $all('.progress-item').forEach((item) => {
        item.addEventListener('click', () => {
            const id = Number(item.dataset.moduleId);
            navigate('lesson', { moduleId: id });
        });
    });

    const viewAllBtn = $('#view-all-modules');
    if (viewAllBtn) viewAllBtn.addEventListener('click', () => navigate('modules'));

    const prevBtn = $('#cal-prev');
    const nextBtn = $('#cal-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { state.calendarOffset--; navigate('home'); });
    if (nextBtn) nextBtn.addEventListener('click', () => { state.calendarOffset++; navigate('home'); });
}

function renderModuleCard(m) {
    const p = state.progress;
    const unlocked = isModuleUnlocked(m);
    const completed = p.completed[m.id];
    const score = p.highest[m.id] || 0;
    let scoreLine = '';
    if (completed) {
        scoreLine = `<div class="module-score pass">Best score: ${score}%</div>`;
    } else if (score > 0) {
        scoreLine = `<div class="module-score retry">Last score: ${score}% (try again)</div>`;
    }
    const statusIcon = !unlocked ? 'Locked' : completed ? 'Done' : 'Go';
    return `
        <div class="card module-card ${unlocked ? '' : 'locked'}" data-module-id="${m.id}" style="margin-bottom:12px;">
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
        card.addEventListener('click', () => {
            const id = Number(card.dataset.moduleId);
            navigate('lesson', { moduleId: id });
        });
    });
}

function renderGradeSection(grade) {
    const mods = modulesByGradeSync(grade.level);
    const hasContent = mods.length > 0;
    const accessible = isGradeAccessible(grade.level);
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
        body = mods.map((m) => renderModuleCard(m)).join('');
    }

    const statusTag = !hasContent
        ? '<span class="grade-status-tag soon">Coming soon</span>'
        : !accessible
            ? '<span class="grade-status-tag locked">Locked</span>'
            : '<span class="grade-status-tag open">Unlocked</span>';

    return `
        <div class="grade-block" data-grade="${grade.level}">
            <button type="button" class="card grade-row ${expanded ? 'expanded' : ''}" data-grade-toggle="${grade.level}">
                <span class="grade-row-title">
                    ${escapeHtml(grade.label)}${grade.seniorHigh ? ' <span class="grade-shs-tag">Senior High</span>' : ''}
                    ${statusTag}
                </span>
                <span class="grade-row-chevron">›</span>
            </button>
            <div class="grade-section ${expanded ? '' : 'hidden'}">${body}</div>
        </div>
    `;
}

async function renderModuleList(container) {
    const accessBanner = accessStatusBanner();
    container.innerHTML = `
        <div class="topbar">
            <div>
                <div class="page-title">Robotics eBook</div>
                <div class="page-subtitle">Grade 4 through Grade 12 — tap a grade to view its modules. Pass each quiz with 80%+ to unlock the next one.</div>
            </div>
        </div>
        ${accessBanner}
        ${GRADES.map(renderGradeSection).join('')}
    `;
    attachModuleListEvents();
}

function accessStatusBanner() {
    if (hasActiveAccess()) {
        const days = accessDaysRemaining();
        return `<div class="card access-banner active">Serial-key access is active for all grades — ${days} day${days === 1 ? '' : 's'} remaining.</div>`;
    }
    return `<div class="card access-banner">All grades (4-12) are locked until you redeem a serial key from an admin. <button class="btn btn-outline btn-sm redeem-serial-btn" style="width:auto; margin-left:8px;">Redeem Serial Key</button></div>`;
}

function attachModuleListEvents() {
    $all('[data-grade-toggle]').forEach((row) => {
        row.addEventListener('click', () => {
            const level = Number(row.dataset.gradeToggle);
            const body = row.parentElement.querySelector('.grade-section');
            const nowExpanded = !state.expandedGrades.has(level);
            if (nowExpanded) {
                state.expandedGrades.add(level);
            } else {
                state.expandedGrades.delete(level);
            }
            row.classList.toggle('expanded', nowExpanded);
            if (body) body.classList.toggle('hidden', !nowExpanded);
        });
    });
    attachModuleCardClicks('#main-content');
    $all('.redeem-serial-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openRedeemSerialModal();
        });
    });
}

function openRedeemSerialModal() {
    showFormModal({
        title: 'Redeem Serial Key',
        description: 'Unlocks every grade (4-12) for one year from today.',
        fields: [{ id: 'code', label: 'Serial Key', type: 'text', placeholder: 'CREO-XXXX-XXXX-XXXX' }],
        confirmLabel: 'Redeem',
        onSubmit: async ({ code }) => {
            try {
                await api.redeemSerialKey(code || '');
                showToast('Serial key redeemed! All grades are unlocked for one year.');
                navigate(state.currentPage === 'home' ? 'home' : 'modules');
                return null;
            } catch (error) {
                return error.message;
            }
        },
    });
}

// ============================================================
// LESSON, QUIZ, RESULT FUNCTIONS
// ============================================================

function renderContentBlock(block) {
    if (block.type === 'h') return `<h2>${escapeHtml(block.text)}</h2>`;
    if (block.type === 'p') return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === 'ul') {
        return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    }
    return '';
}

async function renderLesson(container, moduleId) {
    const allModules = await getAllModules();
    const m = allModules.find((x) => x.id === moduleId);
    if (!m) {
        container.innerHTML = '<div class="card">Module not found.</div>';
        return;
    }
    const color = m.color || 'var(--purple)';
    const siblings = await modulesByGrade(m.grade);
    const position = siblings.findIndex((x) => x.id === m.id) + 1;
    container.innerHTML = `
        <div class="lesson-hero" style="background: linear-gradient(135deg, ${color}, var(--purple));">
            <div class="hero-badge">Grade ${m.grade} · Module ${position} of ${siblings.length}</div>
            <h1>${escapeHtml(m.title)}</h1>
        </div>
        <div class="lesson-body">
            <div class="lesson-content-block" style="border-color: ${color}; background: linear-gradient(135deg, ${color}, var(--purple));">
                <p class="lesson-subtitle">${escapeHtml(m.subtitle)}</p>
                ${m.content.map(renderContentBlock).join('')}
            </div>
            <button class="btn btn-primary" id="take-quiz-btn" style="max-width:240px; margin-top:10px;">Take the Quiz</button>
        </div>
    `;
    attachLessonEvents();
}

function attachLessonEvents() {
    $('#take-quiz-btn').addEventListener('click', () => {
        navigate('quiz', { moduleId: state.activeModuleId });
    });
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function renderQuizStart(container, moduleId) {
    const allModules = await getAllModules();
    const m = allModules.find((x) => x.id === moduleId);
    state.quiz.questions = shuffle(m.quiz);
    state.quiz.index = 0;
    state.quiz.answers = new Array(state.quiz.questions.length).fill(null);
    renderQuizQuestion(container);
    attachQuizEvents();
}

function renderQuizQuestion(container) {
    const { questions, index, answers } = state.quiz;
    const allModules = getAllModules();
    const m = allModules.find((x) => x.id === state.activeModuleId);
    const q = questions[index];
    const pct = Math.round(((index + 1) / questions.length) * 100);
    const letters = ['A', 'B', 'C', 'D'];

    container.innerHTML = `
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
                    let cls = '';
                    if (revealed) {
                        if (i === q.correct) cls = 'correct';
                        else if (i === answers[index]) cls = 'incorrect';
                        cls += ' locked';
                    }
                    return `
                    <div class="option-tile ${cls}" data-option="${i}">
                        <div class="option-letter">${letters[i]}</div>
                        <div>${escapeHtml(opt)}</div>
                    </div>`;
                }).join('')}
            </div>
            ${answers[index] !== null
                ? (answers[index] === q.correct
                    ? `<div class="quiz-feedback quiz-feedback-correct">Correct!</div>`
                    : `<div class="quiz-feedback quiz-feedback-incorrect"><strong>Not quite.</strong> ${escapeHtml(q.explanation || '')}</div>`)
                : ''}
            <div class="quiz-nav-row">
                ${index > 0 ? `<button class="btn btn-outline" id="quiz-prev">← Previous</button>` : ''}
                <button class="btn btn-primary" id="quiz-next" ${answers[index] === null ? "disabled style='opacity:.5;'" : ''}>
                    ${index === questions.length - 1 ? 'Submit' : 'Next →'}
                </button>
            </div>
        </div>
    `;
}

function attachQuizEvents() {
    const container = $('#main-content');

    function refresh() {
        renderQuizQuestion(container);
        attachQuizEvents();
    }

    $all('#quiz-options .option-tile').forEach((tile) => {
        tile.addEventListener('click', () => {
            if (state.quiz.answers[state.quiz.index] !== null) return;
            state.quiz.answers[state.quiz.index] = Number(tile.dataset.option);
            refresh();
        });
    });

    const prevBtn = $('#quiz-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { state.quiz.index--; refresh(); });

    const nextBtn = $('#quiz-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
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

async function submitQuiz() {
    const { questions, answers } = state.quiz;
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    const score = Math.round((correct / questions.length) * 100);

    const progress = state.progress || { completed: {}, highest: {}, history: {} };
    progress.history[state.activeModuleId] = [...(progress.history[state.activeModuleId] || []), score];
    if (score > (progress.highest[state.activeModuleId] || 0)) {
        progress.highest[state.activeModuleId] = score;
    }
    if (score >= PASSING_SCORE) {
        progress.completed[state.activeModuleId] = true;
    }
    state.progress = progress;
    await api.saveProgress(progress);

    navigate('quiz-result', {
        result: { moduleId: state.activeModuleId, score, correct, total: questions.length },
    });
}

async function renderQuizResult(container, result) {
    const allModules = await getAllModules();
    const m = allModules.find((x) => x.id === result.moduleId);
    const passed = result.score >= PASSING_SCORE;
    const siblings = await modulesByGrade(m.grade);
    const hasNext = siblings.findIndex((x) => x.id === m.id) < siblings.length - 1;

    container.innerHTML = `
        <div class="result-wrap" style="margin-top:20px;">
            <div class="card">
                <div class="result-icon">${passed ? 'Passed' : 'Try Again'}</div>
                <h2>${passed ? 'Congratulations!' : 'Almost There!'}</h2>
                <p style="color:var(--ink-soft); margin:8px 0 0;">
                    ${passed ? `You passed "${escapeHtml(m.title)}"` : `You didn't reach 80% on "${escapeHtml(m.title)}"`}
                </p>
                <div class="result-score ${passed ? 'pass' : 'fail'}">${result.score}%</div>
                <p style="color:var(--ink-soft);">${result.correct} out of ${result.total} correct</p>
                <p style="color:var(--ink-soft); font-size:0.8rem; margin-top:6px;">Passing score: ${PASSING_SCORE}%</p>

                ${passed && hasNext ? '<div class="unlock-banner">The next module is now unlocked!</div>' : ''}

                <div style="margin-top:22px; display:flex; flex-direction:column; gap:10px;">
                    <button class="btn btn-primary" id="result-primary-btn">
                        ${passed ? 'Back to Modules' : 'Retry Quiz'}
                    </button>
                    <button class="btn btn-outline" id="result-home-btn">Back to Home</button>
                </div>
            </div>
        </div>
    `;
    attachResultEvents(result);
}

function attachResultEvents(result) {
    const passed = result.score >= PASSING_SCORE;
    $('#result-primary-btn').addEventListener('click', () => {
        if (passed) navigate('modules');
        else navigate('quiz', { moduleId: result.moduleId });
    });
    $('#result-home-btn').addEventListener('click', () => navigate('home'));
}

// ============================================================
// PROFILE, SETTINGS
// ============================================================

async function renderProfile(container) {
    const p = state.progress;
    const allModules = await getAllModules();
    const pool = allModules.filter((m) => isGradeAccessible(m.grade));

    const rows = pool.map((m) => {
        const unlocked = isModuleUnlocked(m);
        const completed = p.completed[m.id];
        const score = p.highest[m.id] || 0;
        let sub = 'Locked';
        if (unlocked) sub = score > 0 ? `Highest score: ${score}%` : 'Not attempted yet';
        const icon = completed ? 'Done' : unlocked ? 'Unlocked' : 'Locked';
        return `
            <div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
                <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--ink-soft); background:#f1ecfd; padding:4px 9px; border-radius:999px; flex-shrink:0;">${icon}</div>
                <div style="flex:1;">
                    <div style="font-weight:700;">Grade ${m.grade}: ${escapeHtml(m.title)}</div>
                    <div style="color:var(--ink-soft); font-size:0.85rem;">${sub}</div>
                </div>
            </div>`;
    }).join('') || '<div class="card" style="text-align:center; color:var(--ink-soft);">No modules available yet.</div>';

    container.innerHTML = `
        <div class="topbar">
            <div class="page-title">Profile</div>
        </div>
        <div class="card profile-hero">
            <div class="profile-hero-fields">
                <div class="profile-field">
                    <div class="profile-field-label">Name</div>
                    <div class="profile-field-value">${escapeHtml(state.profile?.name)}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-field-label">E-mail</div>
                    <div class="profile-field-value">${escapeHtml(state.profile?.email)}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-field-label">School</div>
                    <div class="profile-field-value">${escapeHtml(state.profile?.school || '—')}</div>
                </div>
            </div>
            <div class="profile-hero-side">
                ${renderAvatar('width:128px; height:128px; font-size:2.7rem;')}
                <div class="profile-hero-actions">
                    <button type="button" class="btn btn-outline btn-sm" id="edit-profile-btn">Edit Profile</button>
                    <button type="button" class="btn btn-outline btn-sm" id="edit-avatar-btn">Edit Avatar &amp; Nickname</button>
                </div>
            </div>
        </div>
        <h3 style="color:var(--white); margin-bottom:12px;">Module Scores</h3>
        ${rows}
    `;
    attachProfileEvents();
}

function attachProfileEvents() {
    const avatarBtn = $('#edit-avatar-btn');
    if (avatarBtn) avatarBtn.addEventListener('click', () => showAvatarSetup({ edit: true }));

    const profileBtn = $('#edit-profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showFormModal({
                title: 'Edit Profile',
                description: 'Update your name and school.',
                fields: [
                    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Dela Cruz' },
                    { id: 'school', label: 'School', type: 'text', placeholder: 'Polytechnic University' },
                ],
                confirmLabel: 'Save',
                onSubmit: async ({ name, school }) => {
                    try {
                        await api.updateProfile(name, school);
                        state.profile = await api.getCurrentUser();
                        showToast('Profile updated.');
                        navigate('profile');
                        return null;
                    } catch (error) {
                        return error.message;
                    }
                },
            });
            const nameInput = document.getElementById('modal-name');
            const schoolInput = document.getElementById('modal-school');
            if (nameInput) nameInput.value = state.profile?.name || '';
            if (schoolInput) schoolInput.value = state.profile?.school || '';
        });
    }
}

// ============================================================
// SETTINGS (with Teacher Access and Class Code features)
// ============================================================

async function renderSettings(container) {
    const isDark = document.body.classList.contains('dark');
    const active = hasActiveAccess();
    const days = accessDaysRemaining();

    container.innerHTML = `
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
                    <input type="checkbox" id="dark-toggle" ${isDark ? 'checked' : ''} />
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
                            ${active ? `Active — ${days} day${days === 1 ? '' : 's'} remaining` : 'No active serial key. Every grade stays locked until you redeem one.'}
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" id="settings-redeem-btn">${active ? 'Redeem Another Key' : 'Redeem Serial Key'}</button>
            </div>
        </div>

        <h3 style="color:var(--white); margin-bottom:12px;">Account</h3>
        <div class="card" style="margin-bottom:16px;">
            <div class="settings-row">
                <div class="settings-row-left">
                    <div class="settings-icon"></div>
                    <div>
                        <div style="font-weight:600;">Change Email</div>
                        <div style="color:var(--ink-soft); font-size:0.8rem;">${escapeHtml(state.profile?.email)}</div>
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
                        <div style="font-weight:600;">${state.profile?.is_admin ? 'Admin access is enabled' : 'Enter Admin Code'}</div>
                        <div style="color:var(--ink-soft); font-size:0.8rem;">${state.profile?.is_admin ? 'You can upload modules and generate serial keys.' : 'Have an admin code? Enter it to unlock the Admin page.'}</div>
                    </div>
                </div>
                ${state.profile?.is_admin
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
                        <div style="font-weight:600;">${state.profile?.is_teacher ? 'Teacher access is enabled' : 'Enter Teacher Code'}</div>
                        <div style="color:var(--ink-soft); font-size:0.8rem;">${state.profile?.is_teacher ? 'You can view every student\'s scores and progress.' : 'Ask an admin for a teacher code, then enter it here to unlock the read-only Teacher page.'}</div>
                    </div>
                </div>
                ${state.profile?.is_teacher
                    ? `<button class="btn btn-outline btn-sm" id="go-teacher-btn">Open Teacher</button>`
                    : `<button class="btn btn-outline btn-sm" id="teacher-code-btn">Enter Code</button>`}
            </div>
        </div>

        ${!state.profile?.is_admin ? `
        <h3 style="color:var(--white); margin: 24px 0 12px;">My Class</h3>
        <div class="card">
            <div class="settings-row">
                <div class="settings-row-left">
                    <div class="settings-icon"></div>
                    <div>
                        <div style="font-weight:600;">${state.profile?.teacher_email ? 'Linked to a teacher' : 'Not linked to a teacher yet'}</div>
                        <div style="color:var(--ink-soft); font-size:0.8rem;">${
                            state.profile?.teacher_email
                                ? 'Your scores and progress are visible to your teacher on their Teacher Dashboard.'
                                : 'Get a class code from your teacher and enter it here so your progress shows up on their dashboard.'
                        }</div>
                    </div>
                </div>
                ${state.profile?.teacher_email
                    ? `<button class="btn btn-outline btn-sm" id="leave-class-btn">Leave Class</button>`
                    : `<button class="btn btn-outline btn-sm" id="join-class-btn">Enter Class Code</button>`}
            </div>
        </div>` : ""}
    `;
    attachSettingsEvents();
}

function attachSettingsEvents() {
    $('#dark-toggle').addEventListener('change', (e) => {
        document.body.classList.toggle('dark', e.target.checked);
        localStorage.setItem('creo_theme', e.target.checked ? 'dark' : 'light');
    });

    $('#reset-btn').addEventListener('click', () => {
        showModal({
            title: 'Reset Progress?',
            body: 'This will lock every module you\'ve unlocked and clear all quiz scores. This cannot be undone.',
            confirmLabel: 'Reset',
            confirmClass: 'btn-danger',
            onConfirm: async () => {
                state.progress = { completed: {}, highest: {}, history: {} };
                await api.saveProgress(state.progress);
                showToast('Progress has been reset.');
                navigate('settings');
            },
        });
    });

    $('#change-email-btn').addEventListener('click', () => {
        showFormModal({
            title: 'Change Email',
            description: 'Enter your new email address.',
            fields: [
                { id: 'newEmail', label: 'New Email', type: 'email', placeholder: 'you@example.com' },
            ],
            confirmLabel: 'Save',
            onSubmit: async ({ newEmail }) => {
                if (!newEmail) return 'Enter a new email address.';
                showToast('Email change requires server implementation.');
                return null;
            },
        });
    });

    $('#change-password-btn').addEventListener('click', () => {
        showFormModal({
            title: 'Change Password',
            description: 'Enter your current password and new password.',
            fields: [
                { id: 'currentPassword', label: 'Current Password', type: 'password', placeholder: 'Current password' },
                { id: 'newPassword', label: 'New Password', type: 'password', placeholder: 'At least 6 characters' },
                { id: 'confirmPassword', label: 'Confirm New Password', type: 'password', placeholder: 'Repeat new password' },
            ],
            confirmLabel: 'Save',
            onSubmit: async ({ currentPassword, newPassword, confirmPassword }) => {
                if (newPassword.length < 6) return 'New password must be at least 6 characters.';
                if (newPassword !== confirmPassword) return 'New passwords do not match.';
                try {
                    await api.changePassword(currentPassword, newPassword);
                    showToast('Password updated successfully.');
                    return null;
                } catch (error) {
                    return error.message;
                }
            },
        });
    });

    const settingsRedeemBtn = $('#settings-redeem-btn');
    if (settingsRedeemBtn) settingsRedeemBtn.addEventListener('click', openRedeemSerialModal);

    const goAdminBtn = $('#go-admin-btn');
    if (goAdminBtn) goAdminBtn.addEventListener('click', () => navigate('admin'));

    const adminCodeBtn = $('#admin-code-btn');
    if (adminCodeBtn) {
        adminCodeBtn.addEventListener('click', () => {
            showFormModal({
                title: 'Enter Admin Code',
                description: 'Grants access to the Admin page on this account.',
                fields: [{ id: 'code', label: 'Admin Code', type: 'text', placeholder: 'Admin code' }],
                confirmLabel: 'Unlock',
                onSubmit: async ({ code }) => {
                    if (code?.toUpperCase() === 'CREOADMIN') {
                        try {
                            await api.makeAdmin(code);
                            state.profile = await api.getCurrentUser();
                            showAdminNavItem();
                            showToast('Admin access enabled.');
                            navigate('settings');
                            return null;
                        } catch (error) {
                            return error.message;
                        }
                    }
                    return 'Incorrect admin code.';
                },
            });
        });
    }

    const goTeacherBtn = $('#go-teacher-btn');
    if (goTeacherBtn) goTeacherBtn.addEventListener('click', () => navigate('teacher'));

    const teacherCodeBtn = $('#teacher-code-btn');
    if (teacherCodeBtn) {
        teacherCodeBtn.addEventListener('click', () => {
            showFormModal({
                title: 'Enter Teacher Code',
                description: 'Grants access to the read-only Teacher page on this account.',
                fields: [{ id: 'code', label: 'Teacher Code', type: 'text', placeholder: 'Teacher code' }],
                confirmLabel: 'Unlock',
                onSubmit: async ({ code }) => {
                    try {
                        await api.redeemTeacherCode(code || '');
                        state.profile = await api.getCurrentUser();
                        showTeacherNavItem();
                        showToast('Teacher access enabled.');
                        navigate('settings');
                        return null;
                    } catch (error) {
                        return error.message;
                    }
                },
            });
        });
    }

    const joinClassBtn = $('#join-class-btn');
    if (joinClassBtn) {
        joinClassBtn.addEventListener('click', () => {
            showFormModal({
                title: 'Enter Class Code',
                description: 'Ask your teacher for their class code so your progress shows up on their dashboard.',
                fields: [{ id: 'code', label: 'Class Code', type: 'text', placeholder: 'e.g. CLS-4F9K2P' }],
                confirmLabel: 'Join',
                onSubmit: async ({ code }) => {
                    try {
                        await api.joinClass(code || '');
                        state.profile = await api.getCurrentUser();
                        showToast("You've joined your teacher's class.");
                        navigate('settings');
                        return null;
                    } catch (error) {
                        return error.message;
                    }
                },
            });
        });
    }

    const leaveClassBtn = $('#leave-class-btn');
    if (leaveClassBtn) {
        leaveClassBtn.addEventListener('click', () => {
            showModal({
                title: 'Leave this class?',
                body: "Your teacher will no longer see your scores or progress on their dashboard. You can rejoin anytime with a class code.",
                confirmLabel: 'Leave Class',
                confirmClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        await api.leaveClass();
                        state.profile = await api.getCurrentUser();
                        showToast("You've left the class.");
                        navigate('settings');
                    } catch (error) {
                        showToast(error.message || 'Failed to leave class');
                    }
                },
            });
        });
    }
}

// ============================================================
// TEACHER DASHBOARD
// ============================================================

async function renderTeacher(container) {
    if (!(state.profile?.is_teacher || state.profile?.is_admin)) {
        container.innerHTML = `
            <div class="topbar"><div class="page-title">Teacher</div></div>
            <div class="card" style="text-align:center;">You don't have teacher access. Unlock it from Settings &rarr; Teacher Access.</div>
        `;
        return;
    }

    try {
        const students = await api.getTeacherStudents();
        state.students = students;

        const totalStudents = students.length;
        const avgClassScore = totalStudents
            ? Math.round(students.reduce((sum, s) => sum + (s.avgScore || 0), 0) / totalStudents)
            : 0;
        const activeCount = students.filter((s) => s.hasAccess).length;

        const emptyMessage = state.profile?.is_admin
            ? "No students have signed up yet."
            : "No students have joined your class yet — share your class code above so they can link their account to you.";

        const classCodeCard = (!state.profile?.is_admin && state.profile?.is_teacher)
            ? `
            <div class="card" style="margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
                <div>
                    <div style="font-weight:600;">Your Class Code</div>
                    <div style="color:var(--ink-soft); font-size:0.85rem;">Share this with your students — they enter it in Settings &rarr; My Class to link their progress to you.</div>
                </div>
                <div style="font-family:monospace; font-size:1.3rem; font-weight:700; letter-spacing:0.05em; background:#f1ecfd; color:var(--purple); padding:8px 16px; border-radius:10px;">${escapeHtml(state.profile?.class_code || 'Generate one')}</div>
                <button class="btn btn-primary btn-sm" id="generate-class-code-btn" style="width:auto;">Generate New Code</button>
            </div>`
            : "";

        const rows = students.length
            ? students
                .map((s) => `
                <tr data-email="${escapeHtml(s.email)}" class="teacher-row">
                    <td>
                        <div class="course-name-cell">
                            ${renderUserAvatar(s, 34)}
                            <div>
                                <div>${escapeHtml(s.nickname || s.name)}</div>
                                <div class="cn-sub">${escapeHtml(s.email)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(s.school || '—')}</td>
                    <td>
                        ${s.completedCount || 0} / ${s.totalModules || 0}
                    </td>
                    <td>${s.avgScore || 0}%</td>
                    <td><span class="status-pill ${s.hasAccess ? 'done' : 'locked'}">${s.hasAccess ? 'Active' : 'No Access'}</span></td>
                </tr>`)
                .join('')
            : `<tr><td colspan="5" style="color:var(--ink-soft); text-align:center; padding:18px 0;">${emptyMessage}</td></tr>`;

        container.innerHTML = `
            <div class="topbar">
                <div>
                    <div class="page-title">Teacher Dashboard</div>
                    <div class="page-subtitle">${state.profile?.is_admin ? "Every student's progress" : "Students who have joined your class"}</div>
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
                    <thead><tr><th>Student</th><th>School</th><th>Completed</th><th>Avg Score</th><th>Access</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
        attachTeacherEvents();
    } catch (error) {
        container.innerHTML = `
            <div class="topbar"><div class="page-title">Teacher</div></div>
            <div class="card" style="text-align:center; color:var(--danger);">Error loading teacher data: ${escapeHtml(error.message)}</div>
        `;
    }
}

function attachTeacherEvents() {
    if (!(state.profile?.is_teacher || state.profile?.is_admin)) return;

    $all('.teacher-row').forEach((row) => {
        row.addEventListener('click', () => {
            const email = row.dataset.email;
            const student = state.students.find(s => s.email === email);
            if (student) openStudentDetailModal(student);
        });
    });

    const exportBtn = $('#teacher-export-csv');
    if (exportBtn) exportBtn.addEventListener('click', downloadTeacherGradebookCSV);

    const generateClassCodeBtn = $('#generate-class-code-btn');
    if (generateClassCodeBtn) {
        generateClassCodeBtn.addEventListener('click', async () => {
            try {
                const classCode = await api.generateClassCode();
                state.profile = await api.getCurrentUser();
                showToast(`New class code generated: ${classCode}`);
                navigate('teacher');
            } catch (error) {
                showToast(error.message || 'Failed to generate class code');
            }
        });
    }
}

function openStudentDetailModal(student) {
    const rowsHtml = getAllModules()
        .slice()
        .sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id))
        .map((m) => {
            const completed = student.progress?.completed?.[m.id];
            const score = student.progress?.highest?.[m.id] || 0;
            const attempts = (student.progress?.history?.[m.id] || []).length;
            let statusLabel = completed ? 'Completed' : attempts ? 'In Progress' : 'Not Started';
            let statusClass = completed ? 'done' : attempts ? 'progress' : 'locked';
            return `
                <tr>
                    <td>Grade ${m.grade}: ${escapeHtml(m.title)}</td>
                    <td>${attempts ? `${score}%` : '—'}</td>
                    <td>${attempts}</td>
                    <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                </tr>`;
        })
        .join('');

    const root = $('#modal-root');
    root.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-box" style="max-width:560px; text-align:left;">
                <div style="text-align:center; margin-bottom:18px;">
                    ${renderUserAvatar(student, 64)}
                    <h3 style="margin-top:10px; margin-bottom:2px;">${escapeHtml(student.nickname || student.name)}</h3>
                    <p style="margin:0;">${escapeHtml(student.email)}${student.school ? ` &middot; ${escapeHtml(student.school)}` : ''}</p>
                    <p style="margin-top:6px; font-size:0.85rem; color:var(--ink-soft);">${student.completedCount || 0} of ${student.totalModules || 0} modules completed</p>
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
    root.querySelector('#modal-cancel').addEventListener('click', () => (root.innerHTML = ''));
}

function downloadTeacherGradebookCSV() {
    const students = state.students || [];
    if (!students.length) {
        showToast('No students to export yet.');
        return;
    }

    const modules = getAllModules().slice().sort((a, b) => a.grade - b.grade || (a.order || a.id) - (b.order || b.id));
    
    let csv = 'Name,Email,School,' + modules.map(m => `"${m.title}"`).join(',') + ',Completed,Total,Avg Score,Access\n';
    
    students.forEach(s => {
        const scores = modules.map(m => s.progress?.highest?.[m.id] || '');
        csv += [
            `"${s.nickname || s.name}"`,
            `"${s.email}"`,
            `"${s.school || ''}"`,
            ...scores,
            s.completedCount || 0,
            s.totalModules || 0,
            s.avgScore || 0,
            s.hasAccess ? 'Active' : 'No Access'
        ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creobotics-gradebook-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Gradebook CSV downloaded.');
}

// ============================================================
// LEADERBOARD
// ============================================================

async function renderLeaderboard(container) {
    try {
        const students = await api.getTeacherStudents();
        state.students = students;

        const ranked = students.slice().sort((a, b) => {
            if ((b.completedCount || 0) !== (a.completedCount || 0)) return (b.completedCount || 0) - (a.completedCount || 0);
            return (b.avgScore || 0) - (a.avgScore || 0);
        });
        const myEmail = state.profile?.email;
        const medals = ['🥇', '🥈', '🥉'];

        const noClassMessage = (!state.profile?.is_admin && !state.profile?.is_teacher && !state.profile?.teacher_email)
            ? `<div style="color:var(--ink-soft); text-align:center; padding:18px 0;">Join a class from Settings &rarr; My Class to see how you rank against your classmates.</div>`
            : `<div style="color:var(--ink-soft); text-align:center; padding:18px 0;">No students here yet — be the first to complete a module!</div>`;

        const rows = ranked.length
            ? ranked
                .map((s, i) => {
                    const isMe = s.email === myEmail;
                    const rankLabel = i < 3 ? medals[i] : `#${i + 1}`;
                    return `
                        <div class="leaderboard-row ${isMe ? 'me' : ''} ${i < 3 ? 'top3' : ''}">
                            <div class="lb-rank">${rankLabel}</div>
                            ${renderUserAvatar(s, 46)}
                            <div class="lb-info">
                                <div class="lb-name">${escapeHtml(s.nickname || s.name)}${isMe ? ' (You)' : ''}</div>
                                <div class="lb-sub">${escapeHtml(s.school || '—')}</div>
                            </div>
                            <div class="lb-stats">
                                <div class="lb-completed">${s.completedCount || 0} module${(s.completedCount || 0) === 1 ? '' : 's'}</div>
                                <div class="lb-score">${s.avgScore || 0}% avg score</div>
                            </div>
                        </div>`;
                })
                .join('')
            : noClassMessage;

        const subtitle = state.profile?.is_admin
            ? 'Ranked by modules completed across every grade — every student'
            : 'Ranked by modules completed across every grade — your class only';

        container.innerHTML = `
            <div class="topbar">
                <div>
                    <div class="page-title">Leaderboard</div>
                    <div class="page-subtitle">${subtitle}</div>
                </div>
            </div>
            <div class="card" style="padding:14px;">${rows}</div>
        `;
        attachLeaderboardEvents();
    } catch (error) {
        container.innerHTML = `
            <div class="topbar"><div class="page-title">Leaderboard</div></div>
            <div class="card" style="text-align:center; color:var(--danger);">Error loading leaderboard: ${escapeHtml(error.message)}</div>
        `;
    }
}

function attachLeaderboardEvents() {}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

let adminQuizRows = 1;

function renderAdminQuizRow(n) {
    return `
        <div class="card admin-quiz-row" data-row="${n}" style="margin-bottom:12px;">
            <div class="field"><label>Question ${n}</label><div class="input-wrap"><input type="text" class="aq-question" placeholder="Question text" /></div></div>
            <div class="grid grid-2" style="margin-top:4px;">
                ${['A', 'B', 'C', 'D'].map((l, i) => `
                    <div class="field">
                        <label>Option ${l}</label>
                        <div class="input-wrap" style="display:flex; align-items:center; gap:8px;">
                            <input type="radio" name="aq-correct-${n}" value="${i}" ${i === 0 ? 'checked' : ''} style="width:auto;" />
                            <input type="text" class="aq-option" data-index="${i}" placeholder="Option ${l}" />
                        </div>
                    </div>`).join('')}
            </div>
            <div class="field"><label>Explanation (shown if wrong)</label><div class="input-wrap"><input type="text" class="aq-explanation" placeholder="Why the correct answer is correct" /></div></div>
        </div>`;
}

function parseLessonText(text) {
    const blocks = [];
    const chunks = text.split(/\r?\n\s*\r?\n/).map((c) => c.trim()).filter(Boolean);
    chunks.forEach((chunk) => {
        const lines = chunk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => l.startsWith('- '))) {
            blocks.push({ type: 'ul', items: lines.map((l) => l.replace(/^-\s*/, '')) });
        } else {
            blocks.push({ type: 'p', text: lines.join(' ') });
        }
    });
    return blocks;
}

async function renderAdmin(container) {
    if (!state.profile?.is_admin) {
        container.innerHTML = `
            <div class="topbar"><div class="page-title">Admin</div></div>
            <div class="card" style="text-align:center;">You don't have admin access.</div>
        `;
        return;
    }

    try {
        const keys = await api.getSerialKeys();
        const keyRows = keys.length
            ? keys.slice().reverse().map((k) => `
                <tr>
                    <td style="font-family:monospace;">${escapeHtml(k.code)}</td>
                    <td><span class="status-pill ${k.used_by ? 'done' : 'progress'}">${k.used_by ? 'Used' : 'Available'}</span></td>
                    <td>${k.used_by ? escapeHtml(k.used_by) : '—'}</td>
                </tr>`).join('')
            : '<tr><td colspan="3" style="color:var(--ink-soft);">No serial keys generated yet.</td></tr>';

        const teacherCodes = await api.getTeacherCodes();
        const teacherCodeRows = teacherCodes.length
            ? teacherCodes.slice().reverse().map((k) => `
                <tr>
                    <td style="font-family:monospace;">${escapeHtml(k.code)}</td>
                    <td><span class="status-pill ${k.used_by ? 'done' : 'progress'}">${k.used_by ? 'Used' : 'Available'}</span></td>
                    <td>${k.used_by ? escapeHtml(k.used_by) : '—'}</td>
                </tr>`).join('')
            : '<tr><td colspan="3" style="color:var(--ink-soft);">No teacher codes generated yet.</td></tr>';

        const customModules = await api.getCustomModules();
        const uploadedModulesHtml = customModules.length
            ? customModules.map((m) => `
                <div class="settings-row">
                    <div class="settings-row-left">
                        <div class="settings-icon"></div>
                        <div>
                            <div style="font-weight:600;">Grade ${m.grade}: ${escapeHtml(m.title)}</div>
                            <div style="color:var(--ink-soft); font-size:0.8rem;">${escapeHtml(m.subtitle)}</div>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm admin-delete-module" data-id="${m.id}">Delete</button>
                </div>`).join('')
            : '<div style="color:var(--ink-soft); text-align:center;">No uploaded modules yet.</div>';

        const gradeOptions = GRADES.filter((g) => g.level !== BUILTIN_GRADE)
            .map((g) => `<option value="${g.level}">${escapeHtml(g.label)}</option>`).join('');

        const catalogRows = GRADES.map((g) => {
            const count = modulesByGradeSync(g.level).length;
            return `
                <div class="settings-row">
                    <div class="settings-row-left">
                        <div class="settings-icon"></div>
                        <div>
                            <div style="font-weight:600;">${escapeHtml(g.label)}</div>
                            <div style="color:var(--ink-soft); font-size:0.8rem;">${count} module${count === 1 ? '' : 's'}${g.level === BUILTIN_GRADE ? ' · Built-in' : ''} · Requires serial key</div>
                        </div>
                    </div>
                    ${g.level === BUILTIN_GRADE ? '' : `<button class="btn btn-outline btn-sm admin-manage-grade" data-grade="${g.level}" ${count ? '' : "disabled style='opacity:.5;'"}>Manage</button>`}
                </div>`;
        }).join('');

        container.innerHTML = `
            <div class="topbar"><div class="page-title">Admin</div></div>

            <h3 style="color:var(--white); margin-bottom:12px;">Grade Catalog</h3>
            <div class="card" style="margin-bottom:20px;">${catalogRows}</div>

            <h3 style="color:var(--white); margin-bottom:12px;">Serial Keys</h3>
            <div class="card" style="margin-bottom:20px;">
                <p style="color:var(--ink-soft); font-size:0.85rem; margin-bottom:12px;">Each key grants one student one year of access to every grade (4-12) once redeemed.</p>
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
                <p style="color:var(--ink-soft); font-size:0.85rem; margin-bottom:12px;">Each code grants one account permanent teacher access. Give one to a teacher, then have them redeem it from Settings → Teacher Access.</p>
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
                ${uploadedModulesHtml}
            </div>
        `;
        attachAdminEvents();
    } catch (error) {
        container.innerHTML = `
            <div class="topbar"><div class="page-title">Admin</div></div>
            <div class="card" style="text-align:center; color:var(--danger);">Error loading admin data: ${escapeHtml(error.message)}</div>
        `;
    }
}

function attachAdminEvents() {
    if (!state.profile?.is_admin) return;

    adminQuizRows = 1;

    const generateKeysBtn = $('#admin-generate-keys');
    if (generateKeysBtn) {
        generateKeysBtn.addEventListener('click', async () => {
            const count = Math.max(1, Math.min(100, Number($('#admin-key-count').value) || 1));
            try {
                await api.generateSerialKeys(count);
                showToast(`Generated ${count} serial key${count === 1 ? '' : 's'}.`);
                navigate('admin');
            } catch (error) {
                showToast(error.message || 'Failed to generate keys');
            }
        });
    }

    const generateTeacherCodesBtn = $('#admin-generate-teacher-codes');
    if (generateTeacherCodesBtn) {
        generateTeacherCodesBtn.addEventListener('click', async () => {
            const count = Math.max(1, Math.min(100, Number($('#admin-teacher-code-count').value) || 1));
            try {
                await api.generateTeacherCodes(count);
                showToast(`Generated ${count} teacher code${count === 1 ? '' : 's'}.`);
                navigate('admin');
            } catch (error) {
                showToast(error.message || 'Failed to generate teacher codes');
            }
        });
    }

    const addQuestionBtn = $('#admin-add-question');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            adminQuizRows++;
            $('#admin-quiz-rows').insertAdjacentHTML('beforeend', renderAdminQuizRow(adminQuizRows));
        });
    }

    const publishBtn = $('#admin-publish-module');
    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            const errBox = $('#admin-upload-error');
            errBox.classList.add('hidden');

            const grade = Number($('#admin-grade').value);
            const title = $('#admin-title').value.trim();
            const subtitle = $('#admin-subtitle').value.trim();
            const contentText = $('#admin-content').value.trim();

            if (!title) return showAdminError(errBox, 'Enter a module title.');
            if (!subtitle) return showAdminError(errBox, 'Enter a subtitle.');
            if (!contentText) return showAdminError(errBox, 'Enter the lesson content.');

            const quiz = [];
            const rows = $all('#admin-quiz-rows .admin-quiz-row');
            for (const row of rows) {
                const qText = row.querySelector('.aq-question').value.trim();
                const optionInputs = Array.from(row.querySelectorAll('.aq-option'));
                const options = optionInputs.map((i) => i.value.trim());
                const explanation = row.querySelector('.aq-explanation').value.trim();
                const correctRadio = row.querySelector('input[type="radio"]:checked');
                if (!qText || options.some((o) => !o)) {
                    return showAdminError(errBox, 'Fill in every question and all four options.');
                }
                quiz.push({ q: qText, options, correct: Number(correctRadio.value), explanation });
            }
            if (!quiz.length) return showAdminError(errBox, 'Add at least one quiz question.');

            const allModules = await getAllModules();
            const nextId = allModules.length ? Math.max(...allModules.map((m) => m.id)) + 1 : 1;
            const mod = {
                id: nextId,
                grade,
                order: (await modulesByGrade(grade)).length + 1,
                title,
                subtitle,
                color: 'var(--purple)',
                content: parseLessonText(contentText),
                quiz,
            };
            try {
                await api.addCustomModule(mod);
                showToast(`Module published to Grade ${grade}.`);
                navigate('admin');
            } catch (error) {
                showAdminError(errBox, error.message || 'Failed to publish module');
            }
        });
    }

    $all('.admin-manage-grade').forEach((btn) => {
        btn.addEventListener('click', () => {
            const list = $('#admin-uploaded-list');
            if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    $all('.admin-delete-module').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            showModal({
                title: 'Delete Module?',
                body: 'Students will lose access to this module. This cannot be undone.',
                confirmLabel: 'Delete',
                confirmClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        await api.deleteCustomModule(id);
                        showToast('Module deleted.');
                        navigate('admin');
                    } catch (error) {
                        showToast(error.message || 'Failed to delete module');
                    }
                },
            });
        });
    });

    function showAdminError(box, msg) {
        box.textContent = msg;
        box.classList.remove('hidden');
    }
}

// ============================================================
// ABOUT
// ============================================================

function renderAbout(container) {
    container.innerHTML = `
        <div class="topbar"><div class="page-title">About</div></div>
        <div class="card" style="max-width:800px; text-align:center; margin:0 auto;">
            <img src="images/app_logo.png" alt="Creobotics logo" style="width:64px; height:64px; object-fit:contain; margin:0 auto;" />
            <h2 style="margin:10px 0 2px;">Creobotics</h2>
            <p style="color:var(--ink-soft); font-size:0.85rem;">Version 1.0.0 (MySQL Backend)</p>
            <p style="margin-top:18px; line-height:1.6; text-align:left;">
                Creobotics is a browser-based educational app that teaches the fundamentals of
                robotics through structured modules, each paired with a quiz.
                Learn about robot components, hardware, assembly, app-based control, and autonomous
                line-following — all from any device with a web browser.
            </p>
            <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />
            <p style="font-weight:600;">Built with HTML, CSS, JavaScript + MySQL</p>
            <p style="color:var(--ink-soft); font-size:0.8rem;">
                Your account and progress are stored securely in MySQL.
            </p>
        </div>
    `;
}

// ============================================================
// NAVIGATION FUNCTION
// ============================================================

async function navigate(page, opts = {}) {
    state.currentPage = page;
    if (opts.moduleId !== undefined) state.activeModuleId = opts.moduleId;
    state.allModules = await getAllModules();

    $all('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.page === page));
    $all('.bottom-nav-item').forEach((el) => el.classList.toggle('active', el.dataset.page === page));

    const main = $('#main-content');
    switch (page) {
        case 'home': await renderHome(main); break;
        case 'modules': await renderModuleList(main); break;
        case 'lesson': await renderLesson(main, state.activeModuleId); break;
        case 'quiz': await renderQuizStart(main, state.activeModuleId); break;
        case 'quiz-result': await renderQuizResult(main, opts.result); break;
        case 'profile': await renderProfile(main); break;
        case 'settings': await renderSettings(main); break;
        case 'admin': await renderAdmin(main); break;
        case 'teacher': await renderTeacher(main); break;
        case 'leaderboard': await renderLeaderboard(main); break;
        case 'about': renderAbout(main); break;
        default: main.innerHTML = '<p>Page not found.</p>';
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ============================================================
// AUTH STATE OBSERVER
// ============================================================

async function checkAuth() {
    const token = localStorage.getItem('creo_token');
    if (token) {
        try {
            const user = await api.getCurrentUser();
            if (user) {
                state.profile = user;
                state.user = user;
                state.progress = await api.getProgress();
                state.initialized = true;
                
                if (!state.profile.profile_complete) {
                    showAvatarSetup();
                } else {
                    enterApp();
                }
                return;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('creo_token');
        }
    }
    
    state.user = null;
    state.profile = null;
    state.progress = null;
    state.initialized = true;
    switchAuthView('login');
}

// ============================================================
// EVENT HANDLERS - INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, setting up event listeners...');

    if (localStorage.getItem('creo_theme') === 'dark') {
        document.body.classList.add('dark');
    }

    const signupBtn = $('#go-signup');
    const loginBtn = $('#go-login');
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            console.log('🔀 Switching to signup view');
            switchAuthView('signup');
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('🔀 Switching to login view');
            switchAuthView('login');
        });
    }

    $all('.toggle-visibility').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.textContent = isPassword ? 'Hide' : 'Show';
        });
    });

    const loginForm = $('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔐 Login form submitted');
            
            const email = $('#login-email').value.trim();
            const password = $('#login-password').value;
            const errBox = $('#login-error');
            errBox.classList.add('hidden');

            if (!email || !password) {
                errBox.textContent = 'Please enter both email and password.';
                errBox.classList.remove('hidden');
                return;
            }

            try {
                const result = await api.loginUser(email, password);
                if (!result.success) {
                    errBox.textContent = result.error || 'Login failed';
                    errBox.classList.remove('hidden');
                    return;
                }
                
                state.profile = result.user;
                state.user = result.user;
                state.progress = await api.getProgress();
                state.initialized = true;
                
                if (!state.profile.profile_complete) {
                    showAvatarSetup();
                } else {
                    enterApp();
                }
            } catch (error) {
                errBox.textContent = error.message || 'Login failed';
                errBox.classList.remove('hidden');
            }
        });
    }

    const signupForm = $('#signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Signup form submitted');
            
            const name = $('#signup-name').value.trim();
            const email = $('#signup-email').value.trim();
            const school = $('#signup-school').value.trim();
            const password = $('#signup-password').value;
            const confirm = $('#signup-confirm').value;
            const errBox = $('#signup-error');
            errBox.classList.add('hidden');

            if (name.length < 2) {
                errBox.textContent = 'Please enter your full name.';
                errBox.classList.remove('hidden');
                return;
            }
            if (!/^[\w.\-]+@[\w-]+\.[\w.\-]+$/.test(email)) {
                errBox.textContent = 'Enter a valid email address.';
                errBox.classList.remove('hidden');
                return;
            }
            if (school.length < 2) {
                errBox.textContent = 'Please enter your school.';
                errBox.classList.remove('hidden');
                return;
            }
            if (password.length < 6) {
                errBox.textContent = 'Password must be at least 6 characters.';
                errBox.classList.remove('hidden');
                return;
            }
            if (password !== confirm) {
                errBox.textContent = 'Passwords do not match.';
                errBox.classList.remove('hidden');
                return;
            }

            try {
                await api.registerUser(name, email, school, password);
                showToast('Account created! Please log in.');
                switchAuthView('login');
                $('#login-email').value = email;
            } catch (error) {
                errBox.textContent = error.message || 'Registration failed';
                errBox.classList.remove('hidden');
            }
        });
    }

    const forgotLink = $('#forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', () => {
            showFormModal({
                title: 'Reset Your Password',
                description: 'Enter your email to receive a password reset link.',
                fields: [
                    { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' }
                ],
                confirmLabel: 'Send Reset Link',
                onSubmit: async ({ email }) => {
                    if (!email) return 'Enter your account email.';
                    showToast('Password reset feature coming soon.');
                    return null;
                },
            });
        });
    }

    const logoutBtn = $('#sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showModal({
                title: 'Log Out?',
                body: 'You will need to log in again to continue.',
                confirmLabel: 'Log Out',
                confirmClass: 'btn-danger',
                onConfirm: async () => {
                    await api.logoutUser();
                    state.user = null;
                    state.profile = null;
                    state.progress = null;
                    switchAuthView('login');
                    showToast('Logged out successfully.');
                },
            });
        });
    }

    $all('.nav-item, .bottom-nav-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            console.log(`🔀 Navigating to: ${page}`);
            navigate(page);
        });
    });

    checkAuth();

    console.log('🔥 Creobotics with MySQL backend initialized!');
});