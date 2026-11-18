/**
 * app.js — UI layer: state, rendering, events, localStorage.
 * The task logic itself lives in tasks.js (TaskLogic).
 */
(function () {
  "use strict";

  const T = window.TaskLogic;
  const STORAGE_KEY = "taskflow.tasks.v1";

  // ---- State ---------------------------------------------------------------
  const state = {
    tasks: [],            // the source of truth
    status: "all",        // all | active | completed
    category: "all",
    query: "",
    editingId: null,
    lastAddedId: null,    // for the "slide in" animation
  };

  // ---- localStorage persistence ----------------------------------------------
  /** Save the current tasks array. */
  function saveToLocalStorage() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); } catch (_) { /* storage blocked/full */ }
  }
  /** Load tasks; on the very first visit (nothing stored) show a few sample tasks. */
  function loadFromLocalStorage() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    if (raw === null) return sampleTasks();
    return T.parseStored(raw);
  }

  function sampleTasks() {
    const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return T.todayStr(d); };
    let list = [];
    list = T.addTask(list, { title: "Add your own task using the form above", category: "Other" });
    list = T.addTask(list, { title: "Drag me by the ⋮⋮ handle to reorder", category: "Study", due: addDays(2) });
    list = T.addTask(list, { title: "Tick the circle to complete me", category: "Personal", due: T.todayStr() });
    list = T.addTask(list, { title: "Finish internship project README", category: "Work", due: addDays(-1) });
    return list;
  }

  // ---- DOM ---------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    list: $("list"), empty: $("empty"), live: $("live"),
    form: $("add-form"), title: $("title"), category: $("category"), due: $("due"), error: $("error"),
    tabs: $("tabs"), catFilter: $("cat-filter"), search: $("search"),
    bar: $("bar"), progress: $("progress"), progressText: $("progress-text"), progressPct: $("progress-pct"),
    nAll: $("n-all"), nActive: $("n-active"), nCompleted: $("n-completed"),
    left: $("left"), overdueNote: $("overdue-note"), clear: $("clear-completed"), today: $("today"),
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  const announce = (msg) => { el.live.textContent = ""; setTimeout(() => (el.live.textContent = msg), 30); };

  /** "2026-11-20" -> "Nov 20" (built from parts so the time zone can't shift the day). */
  function prettyDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // ---- Static setup -------------------------------------------------------------
  el.category.innerHTML = T.CATEGORIES.map((c) => `<option>${c}</option>`).join("");
  el.catFilter.innerHTML = '<option value="all">All categories</option>' + T.CATEGORIES.map((c) => `<option>${c}</option>`).join("");
  el.today.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // ---- Rendering ----------------------------------------------------------------
  function categoryOptions(selected) {
    return T.CATEGORIES.map((c) => `<option${c === selected ? " selected" : ""}>${c}</option>`).join("");
  }

  function taskHTML(t) {
    const status = T.dueStatus(t);
    const cls = ["task", t.completed ? "completed" : "", status, t.id === state.lastAddedId ? "enter" : ""].filter(Boolean).join(" ");

    if (t.id === state.editingId) {
      return `
        <li class="${cls} editing" data-id="${esc(t.id)}">
          <form class="edit-form" data-id="${esc(t.id)}">
            <input class="edit-title grow" value="${esc(t.title)}" maxlength="120" aria-label="Task title" />
            <select class="edit-cat" aria-label="Category">${categoryOptions(t.category)}</select>
            <input class="edit-due" type="date" value="${esc(t.due)}" aria-label="Due date" />
            <button type="submit" class="btn primary sm">Save</button>
            <button type="button" class="btn ghost sm cancel">Cancel</button>
          </form>
        </li>`;
    }

    let dueBadge = "";
    if (t.due) {
      const label = status === "overdue" ? "Overdue · " : status === "today" ? "Today · " : "";
      dueBadge = `<span class="due ${status}">📅 ${label}${prettyDate(t.due)}</span>`;
    }

    return `
      <li class="${cls}" data-id="${esc(t.id)}" draggable="true">
        <button class="handle" type="button" aria-label="Reorder “${esc(t.title)}”: drag, or press arrow up or down">⋮⋮</button>
        <input type="checkbox" class="check" ${t.completed ? "checked" : ""} aria-label="Mark “${esc(t.title)}” as ${t.completed ? "not done" : "done"}" />
        <div class="body">
          <span class="title" title="Double-click to edit">${esc(t.title)}</span>
          <div class="meta">
            <span class="cat cat-${esc(t.category.toLowerCase())}">${esc(t.category)}</span>
            ${dueBadge}
          </div>
        </div>
        <div class="actions">
          <button class="icon move-up" type="button" aria-label="Move up">▲</button>
          <button class="icon move-down" type="button" aria-label="Move down">▼</button>
          <button class="icon edit" type="button" aria-label="Edit “${esc(t.title)}”">✎</button>
          <button class="icon del" type="button" aria-label="Delete “${esc(t.title)}”">✕</button>
        </div>
      </li>`;
  }

  function visible() {
    return T.filterTasks(state.tasks, { status: state.status, category: state.category, query: state.query });
  }

  /** Counters, progress bar and footer — cheap, safe to call any time. */
  function renderMeta() {
    const s = T.stats(state.tasks);
    el.nAll.textContent = s.total;
    el.nActive.textContent = s.active;
    el.nCompleted.textContent = s.completed;
    el.progressText.textContent = `${s.completed} of ${s.total} done`;
    el.progressPct.textContent = s.percent + "%";
    el.bar.style.width = s.percent + "%";
    el.progress.setAttribute("aria-valuenow", s.percent);
    el.left.textContent = plural(s.active, "task") + " left";
    el.overdueNote.hidden = s.overdue === 0;
    el.overdueNote.textContent = s.overdue + " overdue";
    el.clear.disabled = s.completed === 0;
  }

  function renderList() {
    const list = visible();
    el.list.innerHTML = list.map(taskHTML).join("");
    state.lastAddedId = null;

    const filtered = state.status !== "all" || state.category !== "all" || state.query.trim();
    el.empty.hidden = list.length > 0;
    if (!list.length) {
      el.empty.innerHTML = state.tasks.length === 0
        ? "<strong>No tasks yet</strong><span>Add your first task above to get started.</span>"
        : filtered ? "<strong>Nothing matches</strong><span>Try a different filter or search.</span>" : "";
    }
  }

  function render() { renderMeta(); renderList(); }

  function commit(next, message) {
    state.tasks = next;
    saveToLocalStorage();
    if (message) announce(message);
  }

  // ---- Add -------------------------------------------------------------------------
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = T.cleanTitle(el.title.value);
    if (!title) {
      el.error.textContent = "Please enter a task title.";
      el.title.focus();
      return;
    }
    el.error.textContent = "";
    const before = state.tasks;
    const next = T.addTask(before, { title, category: el.category.value, due: el.due.value });
    state.lastAddedId = next[0].id;
    // make sure the new task is visible even if a filter is active
    if (state.status === "completed") setStatus("all");
    if (state.category !== "all" && state.category !== el.category.value) { state.category = "all"; el.catFilter.value = "all"; }
    if (state.query) { state.query = ""; el.search.value = ""; }
    commit(next, "Task added");
    el.title.value = "";
    el.due.value = "";
    el.title.focus();
    render();
  });
  el.title.addEventListener("input", () => { if (el.error.textContent) el.error.textContent = ""; });

  // ---- List interactions (event delegation) ----------------------------------------------
  const idOf = (node) => { const li = node.closest(".task"); return li ? li.dataset.id : null; };
  let settleTimer;

  el.list.addEventListener("change", (e) => {
    if (!e.target.classList.contains("check")) return;
    const li = e.target.closest(".task");
    const id = li.dataset.id;
    commit(T.toggleTask(state.tasks, id));
    const done = state.tasks.find((t) => t.id === id).completed;
    li.classList.toggle("completed", done);
    li.classList.remove("overdue", "today");
    li.classList.remove("pop"); void li.offsetWidth; li.classList.add("pop");   // restart the animation
    renderMeta();
    announce(done ? "Task completed" : "Task marked active");
    // let the animation play, then re-render (hides the row if the current filter excludes it)
    clearTimeout(settleTimer);
    settleTimer = setTimeout(renderList, 450);
  });

  el.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = idOf(btn);

    if (btn.classList.contains("del")) {
      const li = btn.closest(".task");
      li.classList.add("removing");
      setTimeout(() => { commit(T.deleteTask(state.tasks, id), "Task deleted"); render(); }, 230);
    } else if (btn.classList.contains("edit")) {
      startEdit(id);
    } else if (btn.classList.contains("cancel")) {
      state.editingId = null; render();
    } else if (btn.classList.contains("move-up")) {
      moveBy(id, -1);
    } else if (btn.classList.contains("move-down")) {
      moveBy(id, +1);
    }
  });

  el.list.addEventListener("dblclick", (e) => {
    if (e.target.classList.contains("title")) startEdit(idOf(e.target));
  });

  // save an edit
  el.list.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const title = T.cleanTitle(form.querySelector(".edit-title").value);
    if (!title) { form.querySelector(".edit-title").focus(); form.classList.add("shake"); return; }
    commit(T.updateTask(state.tasks, form.dataset.id, {
      title,
      category: form.querySelector(".edit-cat").value,
      due: form.querySelector(".edit-due").value,
    }), "Task updated");
    state.editingId = null;
    render();
  });
  el.list.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.editingId) { state.editingId = null; render(); return; }
    // keyboard reordering from the drag handle
    if (e.target.classList.contains("handle") && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      moveBy(idOf(e.target), e.key === "ArrowUp" ? -1 : 1, true);
    }
  });

  function startEdit(id) {
    state.editingId = id;
    render();
    const input = el.list.querySelector(".edit-title");
    if (input) { input.focus(); input.select(); }
  }

  /** Move a task one step up/down relative to the tasks currently VISIBLE (works with filters). */
  function moveBy(id, delta, keepHandleFocus) {
    const list = visible();
    const i = list.findIndex((t) => t.id === id);
    const neighbour = list[i + delta];
    if (!neighbour) return;
    commit(T.moveTask(state.tasks, id, neighbour.id), "Task moved");
    render();
    if (keepHandleFocus) {
      const h = el.list.querySelector(`.task[data-id="${CSS.escape(id)}"] .handle`);
      if (h) h.focus();
    }
  }

  // ---- Drag and drop reordering --------------------------------------------------------------
  let dragId = null;
  const clearDropMarks = () => el.list.querySelectorAll(".drag-over").forEach((n) => n.classList.remove("drag-over"));

  el.list.addEventListener("dragstart", (e) => {
    const li = e.target.closest && e.target.closest(".task");
    if (!li) return;
    dragId = li.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragId);        // required by Firefox
    requestAnimationFrame(() => li.classList.add("dragging"));
  });
  el.list.addEventListener("dragover", (e) => {
    if (!dragId) return;
    e.preventDefault();                                   // allow drop
    e.dataTransfer.dropEffect = "move";
    const li = e.target.closest(".task");
    clearDropMarks();
    if (li && li.dataset.id !== dragId) li.classList.add("drag-over");
  });
  el.list.addEventListener("drop", (e) => {
    if (!dragId) return;
    e.preventDefault();
    const li = e.target.closest(".task");
    if (li && li.dataset.id !== dragId) {
      commit(T.moveTask(state.tasks, dragId, li.dataset.id), "Task moved");
    }
    dragId = null;
    render();
  });
  el.list.addEventListener("dragend", () => {
    dragId = null;
    clearDropMarks();
    el.list.querySelectorAll(".dragging").forEach((n) => n.classList.remove("dragging"));
  });

  // ---- Filters ---------------------------------------------------------------------------------
  function setStatus(status) {
    state.status = status;
    el.tabs.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.status === status;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }
  el.tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab");
    if (!b) return;
    state.editingId = null;
    setStatus(b.dataset.status);
    renderList();
  });
  el.catFilter.addEventListener("change", () => { state.category = el.catFilter.value; renderList(); });
  el.search.addEventListener("input", () => { state.query = el.search.value; renderList(); });

  el.clear.addEventListener("click", () => {
    const n = T.stats(state.tasks).completed;
    if (!n) return;
    if (!confirm(`Remove ${plural(n, "completed task")}?`)) return;
    commit(T.clearCompleted(state.tasks), "Completed tasks cleared");
    render();
  });

  // keep several open tabs in sync
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state.tasks = T.parseStored(e.newValue);
    state.editingId = null;
    render();
  });

  // ---- Boot --------------------------------------------------------------------------------------
  state.tasks = loadFromLocalStorage();
  saveToLocalStorage();           // stores the samples once, so deleting them all really leaves an empty list
  render();
})();
