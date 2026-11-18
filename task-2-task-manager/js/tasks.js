/**
 * tasks.js — pure task logic (no DOM, no localStorage), so it can be unit-tested in Node.
 *
 * A task looks like:
 *   { id, title, category, due, completed, createdAt }
 *   due is "YYYY-MM-DD" or "" (no due date).
 *
 * Every function returns a NEW array (immutable updates), which keeps the
 * state predictable and makes rendering/persistence simple.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TaskLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const CATEGORIES = ["Work", "Personal", "Study", "Other"];
  const MAX_TITLE = 120;

  // ---- helpers -------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, "0");
  /** Today's date in the user's LOCAL time as YYYY-MM-DD. */
  function todayStr(d = new Date()) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  const isDateStr = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const cleanTitle = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
  const cleanCategory = (c) => (CATEGORIES.includes(c) ? c : "Other");
  const cleanDue = (d) => (isDateStr(d) ? d : "");

  // ---- CREATE ----------------------------------------------------------------
  /** Adds a task at the top of the list. Empty titles are ignored (list returned unchanged). */
  function addTask(tasks, { title, category, due } = {}) {
    const t = cleanTitle(title);
    if (!t) return tasks;
    const task = {
      id: makeId(),
      title: t,
      category: cleanCategory(category),
      due: cleanDue(due),
      completed: false,
      createdAt: Date.now(),
    };
    return [task, ...tasks];
  }

  // ---- UPDATE ----------------------------------------------------------------
  /** Edit title / category / due date. Invalid values are ignored; an empty title keeps the old one. */
  function updateTask(tasks, id, changes = {}) {
    return tasks.map((task) => {
      if (task.id !== id) return task;
      const next = { ...task };
      if ("title" in changes && cleanTitle(changes.title)) next.title = cleanTitle(changes.title);
      if ("category" in changes) next.category = cleanCategory(changes.category);
      if ("due" in changes) next.due = cleanDue(changes.due);
      return next;
    });
  }

  function toggleTask(tasks, id) {
    return tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  }

  // ---- DELETE ----------------------------------------------------------------
  function deleteTask(tasks, id) {
    return tasks.filter((t) => t.id !== id);
  }
  function clearCompleted(tasks) {
    return tasks.filter((t) => !t.completed);
  }

  // ---- READ / FILTER ---------------------------------------------------------
  /** status: all | active | completed — category: all | <category> — query: text search */
  function filterTasks(tasks, { status = "all", category = "all", query = "" } = {}) {
    const q = String(query).trim().toLowerCase();
    return tasks.filter((t) => {
      if (status === "active" && t.completed) return false;
      if (status === "completed" && !t.completed) return false;
      if (category !== "all" && t.category !== category) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  // ---- REORDER (drag and drop) ---------------------------------------------
  /** Move the task `fromId` into the slot currently held by `toId`. */
  function moveTask(tasks, fromId, toId) {
    if (fromId === toId) return tasks;
    const from = tasks.findIndex((t) => t.id === fromId);
    const to = tasks.findIndex((t) => t.id === toId);
    if (from < 0 || to < 0) return tasks;
    const copy = [...tasks];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  // ---- DERIVED DATA ------------------------------------------------------------
  /** "overdue" | "today" | "" for an unfinished task with a due date. */
  function dueStatus(task, today = todayStr()) {
    if (!task.due || task.completed) return "";
    if (task.due < today) return "overdue";   // ISO dates compare correctly as strings
    if (task.due === today) return "today";
    return "";
  }

  function stats(tasks, today = todayStr()) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter((t) => dueStatus(t, today) === "overdue").length;
    return {
      total,
      completed,
      active: total - completed,
      overdue,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }

  // ---- SAFE LOADING ------------------------------------------------------------
  /** Parse whatever was stored; anything malformed is dropped instead of crashing the app. */
  function parseStored(raw) {
    let data;
    try { data = JSON.parse(raw); } catch (_) { return []; }
    if (!Array.isArray(data)) return [];
    const seen = new Set();
    const out = [];
    for (const x of data) {
      if (!x || typeof x !== "object") continue;
      const title = cleanTitle(x.title);
      let id = typeof x.id === "string" && x.id ? x.id : makeId();
      if (!title) continue;
      if (seen.has(id)) id = makeId();
      seen.add(id);
      out.push({
        id,
        title,
        category: cleanCategory(x.category),
        due: cleanDue(x.due),
        completed: x.completed === true,
        createdAt: Number.isFinite(x.createdAt) ? x.createdAt : Date.now(),
      });
    }
    return out;
  }

  return {
    CATEGORIES, MAX_TITLE,
    todayStr, cleanTitle,
    addTask, updateTask, toggleTask, deleteTask, clearCompleted,
    filterTasks, moveTask, dueStatus, stats, parseStored,
  };
});
