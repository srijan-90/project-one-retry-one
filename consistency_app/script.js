/* =====================================================================
   CONSISTENCY — script.js
   Everything the app does lives in this one file:
     1. Data (quotes, localStorage helpers, date helpers)
     2. Calculations (streaks, percentages, chart data)
     3. Rendering (turning data into HTML)
     4. Events (clicks, form submits, navigation)
   Read it top to bottom — later sections use functions from earlier ones.
===================================================================== */


/* =====================================================================
   1. DATA
===================================================================== */

// 50+ short lines. One is shown per day, picked automatically below.
const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small steps, repeated daily, outrun big plans made once.",
  "You don't rise to your goals, you fall to your systems.",
  "Consistency turns effort into identity.",
  "Motivation gets you started. Habit keeps you going.",
  "The days you don't feel like it are the ones that count most.",
  "Progress is quiet. Keep showing up anyway.",
  "You are what you repeatedly do.",
  "One more day, one more brick.",
  "The streak is a side effect. The habit is the point.",
  "Show up for yourself the way you'd show up for someone you love.",
  "Slow is smooth, smooth is fast.",
  "Every day is a vote for the person you're becoming.",
  "Don't break the chain.",
  "Comfort and growth rarely live in the same room.",
  "What you do today is what tomorrow is built from.",
  "Small disciplines repeated daily lead to large achievements gained slowly.",
  "The work you avoid is usually the work that matters most.",
  "Consistency is the quietest form of confidence.",
  "Nothing changes if nothing changes.",
  "You won't always feel ready. Start anyway.",
  "A habit missed once is an accident. Twice is the start of a new habit.",
  "Success is a few simple disciplines, practiced every day.",
  "The days feel long. The years feel fast. Keep going.",
  "Effort compounds quietly until it doesn't.",
  "Do it for the version of you a year from now.",
  "Your future is built in ordinary, unremarkable moments like this one.",
  "Focus on the next rep, not the whole mountain.",
  "It's not about being perfect. It's about not quitting.",
  "The floor is showing up. Everything else is a bonus.",
  "Momentum is easier to keep than to build twice.",
  "You are one decision away from a completely different streak.",
  "Small wins, stacked daily, become an identity.",
  "Skip the excuse. Keep the habit.",
  "The best time to start was earlier. The next best time is today.",
  "You're not behind. You're building.",
  "Patience is a habit too.",
  "Every rep you don't want to do is the one that builds character.",
  "Trust the process even on the days it feels invisible.",
  "Discipline weighs ounces. Regret weighs tons.",
  "The gap between who you are and who you want to be is called action.",
  "Keep a promise to yourself today, however small.",
  "Habits are the compound interest of self-improvement.",
  "The obstacle in front of you is the work.",
  "You feel your best after you've done the hard thing, not before.",
  "Today's effort is invisible until it isn't.",
  "Steady beats intense, over and over again.",
  "做完比完美更重要 — done is better than perfect.",
  "Nobody sees the streak build. Everyone sees when it breaks.",
  "The version of you that keeps going wins by default.",
  "One honest day of effort is worth a week of good intentions.",
  "You don't need more time. You need more consistency.",
  "The habit is the goal. Everything else follows.",
  "Quiet, boring, repeated effort is how anything real gets built.",
];

// Keys used to talk to localStorage. Keeping them as constants avoids typos.
const STORAGE_HABITS = "consistency_habits";
const STORAGE_LOGS = "consistency_logs";

/**
 * Loads the list of habits from localStorage.
 * Each habit looks like: { id, name, target, createdAt }
 * "createdAt" is the date (YYYY-MM-DD) the habit was added, so days
 * before that date are never counted against it.
 */
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_HABITS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits));
}

/**
 * Loads the completion history from localStorage.
 * Shape: { "2026-09-12": { "habitId1": true, "habitId2": true }, ... }
 * A missing entry simply means "not completed" — we only store the trues.
 */
function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
}

// In-memory copies we work with. Every change gets written straight
// back to localStorage so a refresh never loses data.
let habits = loadHabits();
let logs = loadLogs();

/* ---------------------- date helpers ---------------------- */

// Turns a Date object into "YYYY-MM-DD" using LOCAL time (not UTC),
// so the date shown always matches the date on the user's device.
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return formatDate(new Date());
}

// Returns a new Date offset by a number of days (can be negative).
function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dayOfYear(date) {
  // Use UTC here so daylight-saving changes cannot shift the day number.
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}


/* =====================================================================
   2. CALCULATIONS
===================================================================== */

// Habits that existed on a given date (added on or before that date).
function activeHabitsOn(dateStr) {
  return habits.filter((h) => h.createdAt <= dateStr);
}

/**
 * Whether a day counts as "fully completed": every habit that existed
 * on that date was checked off.
 * Returns true / false, or null if there were no habits that day
 * (nothing to judge, so it's treated as a neutral day, not a failure).
 */
function isDayComplete(dateStr) {
  const active = activeHabitsOn(dateStr);
  if (active.length === 0) return null;
  const dayLog = logs[dateStr] || {};
  return active.every((h) => dayLog[h.id] === true);
}

// Percentage of that day's habits that were completed (0-100), or
// null if there were no habits that day.
function dayCompletionPercent(dateStr) {
  const active = activeHabitsOn(dateStr);
  if (active.length === 0) return null;
  const dayLog = logs[dateStr] || {};
  const done = active.filter((h) => dayLog[h.id] === true).length;
  return Math.round((done / active.length) * 100);
}

// Earliest date we have any reason to look at (first habit's start date).
function earliestRelevantDate() {
  if (habits.length === 0) return todayStr();
  return habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), habits[0].createdAt);
}

/**
 * Current streak: consecutive fully-completed days, counting backwards
 * from today. If today isn't finished yet, that's fine — the day isn't
 * over, so we start counting from yesterday instead without breaking
 * anything. Days with no active habits are skipped, not counted as
 * failures.
 */
function currentStreak() {
  const earliest = earliestRelevantDate();
  let streak = 0;
  let cursor = new Date();

  const todayStatus = isDayComplete(todayStr());
  if (todayStatus === true) {
    streak = 1;
    cursor = addDays(cursor, -1);
  } else {
    cursor = addDays(cursor, -1);
  }

  while (formatDate(cursor) >= earliest) {
    const status = isDayComplete(formatDate(cursor));
    if (status === true) {
      streak++;
      cursor = addDays(cursor, -1);
    } else if (status === null) {
      cursor = addDays(cursor, -1); // neutral day, keep looking further back
    } else {
      break; // a real miss — streak ends here
    }
  }
  return streak;
}

// Longest streak ever recorded, scanning from the first habit to today.
function bestStreak() {
  const earliest = new Date(earliestRelevantDate());
  const end = new Date();
  let best = 0;
  let current = 0;

  for (let d = earliest; d <= end; d = addDays(d, 1)) {
    const status = isDayComplete(formatDate(d));
    if (status === true) {
      current++;
      best = Math.max(best, current);
    } else if (status === false) {
      current = 0;
    }
    // null days are neutral — they don't reset or extend the run
  }
  return best;
}

// Total number of individual habit check-ins, ever.
function totalCompletedCount() {
  const activeIds = new Set(habits.map((h) => h.id));
  let total = 0;
  for (const date in logs) {
    const dayLog = logs[date];
    if (!dayLog || typeof dayLog !== "object") continue;
    total += Object.entries(dayLog).filter(([id, done]) => activeIds.has(id) && done === true).length;
  }
  return total;
}

// Average of dayCompletionPercent() over the last N days (today included).
// Days with no active habits are left out of the average entirely.
function averageOverLastDays(n) {
  const values = [];
  let cursor = new Date();
  for (let i = 0; i < n; i++) {
    const pct = dayCompletionPercent(formatDate(cursor));
    if (pct !== null) values.push(pct);
    cursor = addDays(cursor, -1);
  }
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

// The big ring at the top uses this: the 30-day average completion rate.
function consistencyScore() {
  return averageOverLastDays(30);
}


/* =====================================================================
   3. RENDERING
===================================================================== */

function renderQuote() {
  const index = dayOfYear(new Date()) % QUOTES.length;
  document.getElementById("quote-text").textContent = QUOTES[index];
}

function renderHero() {
  const score = consistencyScore();
  document.getElementById("score-number").textContent = `${score}%`;
  document.getElementById("streak-number").textContent = currentStreak();
  document.getElementById("best-streak-number").textContent = bestStreak();

  // Circle circumference = 2 * PI * r, r = 70 (see style.css / index.html)
  const circumference = 439.8;
  const offset = circumference - (score / 100) * circumference;
  document.getElementById("ring-progress").style.strokeDashoffset = offset;
}

function renderHabitList() {
  const list = document.getElementById("habit-list");
  const emptyState = document.getElementById("empty-state");
  list.innerHTML = "";

  if (habits.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const today = todayStr();
  const todayLog = logs[today] || {};

  habits.forEach((habit) => {
    const done = todayLog[habit.id] === true;

    const li = document.createElement("li");
    li.className = "habit-row" + (done ? " is-done" : "");

    li.innerHTML = `
      <button class="habit-check ${done ? "done" : ""}" data-id="${habit.id}" aria-label="Mark ${habit.name} complete"></button>
      <div class="habit-info">
        <div class="habit-name">${escapeHtml(habit.name)}</div>
        ${habit.target ? `<div class="habit-target">${escapeHtml(habit.target)}</div>` : ""}
      </div>
      <button class="habit-edit" data-id="${habit.id}" aria-label="Edit ${habit.name}">&#8942;</button>
    `;
    list.appendChild(li);
  });
}

// Basic protection so a habit name typed with < or > doesn't break the page.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderStatsPage() {
  document.getElementById("mc-streak").textContent = currentStreak();
  document.getElementById("mc-best").textContent = bestStreak();
  document.getElementById("mc-total").textContent = totalCompletedCount();
  document.getElementById("mc-week").textContent = `${averageOverLastDays(7)}%`;
  document.getElementById("mc-month").textContent = `${averageOverLastDays(30)}%`;

  renderBarChart("chart-7", 7, true);
  renderBarChart("chart-30", 30, false);
}

// Builds a simple bar chart out of plain divs — no chart library needed.
// showLabels adds a weekday letter under each bar (used for the 7-day view).
function renderBarChart(containerId, days, showLabels) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const weekdayLetters = ["S", "M", "T", "W", "T", "F", "S"];
  const dates = [];
  let cursor = new Date();
  for (let i = 0; i < days; i++) {
    dates.unshift(new Date(cursor));
    cursor = addDays(cursor, -1);
  }

  dates.forEach((date) => {
    const dateStr = formatDate(date);
    const pct = dayCompletionPercent(dateStr);
    const height = pct === null ? 2 : Math.max(pct, 3); // tiny sliver if 0%, for visibility

    const col = document.createElement("div");
    col.className = "bar-col";

    const bar = document.createElement("div");
    bar.className = "bar" + (pct === 100 ? " full" : "");
    bar.style.height = `${height}%`;
    bar.title = `${dateStr}: ${pct === null ? "no habits" : pct + "%"}`;

    col.appendChild(bar);

    if (showLabels) {
      const label = document.createElement("span");
      label.className = "bar-day-label";
      label.textContent = weekdayLetters[date.getDay()];
      col.appendChild(label);
    }

    container.appendChild(col);
  });
}

/* ---------------------- calendar ---------------------- */

// Which month the calendar is currently showing.
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function renderCalendarPage() {
  document.getElementById("month-label").textContent =
    `${MONTH_NAMES[calendarMonth]} ${calendarYear}`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday

  // Blank cells so day 1 lines up under the correct weekday column.
  for (let i = 0; i < startWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day empty";
    grid.appendChild(blank);
  }

  const today = todayStr();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(calendarYear, calendarMonth, day);
    const dateStr = formatDate(date);
    const cell = document.createElement("button");
    cell.className = "cal-day";
    cell.textContent = day;

    if (dateStr > today) {
      cell.classList.add("future");
      cell.disabled = true;
      cell.setAttribute("aria-label", `${formatDateForHumans(dateStr)} — future date`);
    } else {
      const status = isDayComplete(dateStr);
      if (status === true) cell.classList.add("full");
      else {
        const pct = dayCompletionPercent(dateStr);
        if (pct !== null && pct > 0) cell.classList.add("partial");
      }
      cell.addEventListener("click", () => openDayModal(dateStr));
    }

    if (dateStr === today) cell.classList.add("today");

    grid.appendChild(cell);
  }
}

function renderAll() {
  renderQuote();
  renderHero();
  renderHabitList();
  renderStatsPage();
  renderCalendarPage();
}


/* =====================================================================
   4. EVENTS
===================================================================== */

/* ---------------------- navigation ---------------------- */

const pages = {
  home: document.getElementById("page-home"),
  stats: document.getElementById("page-stats"),
  calendar: document.getElementById("page-calendar"),
};

function goToPage(name) {
  Object.keys(pages).forEach((key) => {
    pages[key].hidden = key !== name;
  });
  document.querySelectorAll(".nav-link, .bottom-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === name);
  });
}

document.querySelectorAll("[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => goToPage(btn.dataset.page));
});

/* ---------------------- completing a habit ---------------------- */

document.getElementById("habit-list").addEventListener("click", (e) => {
  const checkBtn = e.target.closest(".habit-check");
  const editBtn = e.target.closest(".habit-edit");

  if (checkBtn) {
    toggleHabitToday(checkBtn.dataset.id);
    checkBtn.classList.add("pulse");
    setTimeout(() => checkBtn.classList.remove("pulse"), 400);
  } else if (editBtn) {
    openHabitModal(editBtn.dataset.id);
  }
});

function toggleHabitToday(habitId) {
  const today = todayStr();
  if (!logs[today]) logs[today] = {};
  logs[today][habitId] = !logs[today][habitId];
  saveLogs(logs);
  renderAll();
}

/* ---------------------- add / edit / delete habit modal ---------------------- */

const habitModal = document.getElementById("habit-modal");
const nameInput = document.getElementById("habit-name-input");
const targetInput = document.getElementById("habit-target-input");
const deleteBtn = document.getElementById("delete-habit-btn");
let editingHabitId = null;

document.getElementById("add-habit-btn").addEventListener("click", () => openHabitModal(null));
document.getElementById("cancel-habit-btn").addEventListener("click", closeHabitModal);

function openHabitModal(habitId) {
  editingHabitId = habitId;
  const habit = habits.find((h) => h.id === habitId);

  document.getElementById("modal-title").textContent = habit ? "Edit habit" : "New habit";
  nameInput.value = habit ? habit.name : "";
  targetInput.value = habit ? habit.target || "" : "";
  deleteBtn.hidden = !habit;

  habitModal.hidden = false;
  setTimeout(() => nameInput.focus(), 50);
}

function closeHabitModal() {
  habitModal.hidden = true;
  editingHabitId = null;
}

document.getElementById("save-habit-btn").addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }
  const target = targetInput.value.trim();

  if (editingHabitId) {
    const habit = habits.find((h) => h.id === editingHabitId);
    habit.name = name;
    habit.target = target;
  } else {
    habits.push({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      target,
      createdAt: todayStr(),
    });
  }
  saveHabits(habits);
  closeHabitModal();
  renderAll();
});

deleteBtn.addEventListener("click", () => {
  const deletedId = editingHabitId;
  habits = habits.filter((h) => h.id !== deletedId);

  // Remove old check-ins for the deleted habit so statistics and calendar
  // cannot keep counting a habit that no longer exists.
  for (const date in logs) {
    if (logs[date] && typeof logs[date] === "object") {
      delete logs[date][deletedId];
      if (Object.keys(logs[date]).length === 0) delete logs[date];
    }
  }

  saveHabits(habits);
  saveLogs(logs);
  closeHabitModal();
  renderAll();
});

// Clicking the dark backdrop (not the card itself) closes a modal.
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.hidden = true;
  });
});

/* ---------------------- calendar navigation + day detail ---------------------- */

document.getElementById("prev-month").addEventListener("click", () => {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendarPage();
});

document.getElementById("next-month").addEventListener("click", () => {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendarPage();
});

const dayModal = document.getElementById("day-modal");

function openDayModal(dateStr) {
  document.getElementById("day-modal-title").textContent = formatDateForHumans(dateStr);

  const list = document.getElementById("day-habit-list");
  list.innerHTML = "";

  const active = activeHabitsOn(dateStr);
  if (active.length === 0) {
    list.innerHTML = `<p class="empty-state">No habits existed yet on this day.</p>`;
  } else {
    const dayLog = logs[dateStr] || {};
    active.forEach((habit) => {
      const done = dayLog[habit.id] === true;
      const row = document.createElement("li");
      row.className = "day-habit-row";
      row.innerHTML = `
        <button class="habit-check ${done ? "done" : ""}" data-id="${habit.id}" data-date="${dateStr}"></button>
        <span>${escapeHtml(habit.name)}</span>
      `;
      list.appendChild(row);
    });
  }

  dayModal.hidden = false;
}

// Let people correct a past day directly from the calendar, in case
// they forgot to log something at the time.
document.getElementById("day-habit-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".habit-check");
  if (!btn) return;
  const { id, date } = btn.dataset;
  if (!logs[date]) logs[date] = {};
  logs[date][id] = !logs[date][id];
  saveLogs(logs);
  renderAll();
  openDayModal(date); // refresh the modal's own checkmarks
});

document.getElementById("close-day-modal-btn").addEventListener("click", () => {
  dayModal.hidden = true;
});

// Escape closes whichever modal is open.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  habitModal.hidden = true;
  dayModal.hidden = true;
  editingHabitId = null;
});

function formatDateForHumans(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}


/* =====================================================================
   STARTUP
===================================================================== */

renderAll();

// Register the service worker so the app keeps working offline after
// the very first visit. This is what makes "Add to Home Screen" behave
// like a real installed app instead of just a bookmark.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // If this fails (e.g. running from file:// during local testing),
      // the app still works — it just won't cache for offline use.
    });
  });
}
