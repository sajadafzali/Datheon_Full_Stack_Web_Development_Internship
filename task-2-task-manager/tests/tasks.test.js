// Run with:  node tests/tasks.test.js   (no dependencies needed)
const assert = require("assert");
const T = require("../js/tasks.js");

// ---- CREATE
let tasks = [];
tasks = T.addTask(tasks, { title: "  Write   report ", category: "Work", due: "2026-11-20" });
assert.strictEqual(tasks.length, 1);
assert.strictEqual(tasks[0].title, "Write report", "title is trimmed and whitespace collapsed");
assert.strictEqual(tasks[0].completed, false);
assert.strictEqual(T.addTask(tasks, { title: "   " }).length, 1, "empty title is ignored");
assert.strictEqual(T.addTask(tasks, { title: "x", category: "Hacker" })[0].category, "Other", "unknown category -> Other");
assert.strictEqual(T.addTask(tasks, { title: "x", due: "not-a-date" })[0].due, "", "bad date is dropped");
assert.strictEqual(T.addTask([], { title: "y".repeat(500) })[0].title.length, T.MAX_TITLE, "title length is capped");

tasks = T.addTask(tasks, { title: "Read chapter 3", category: "Study" });
tasks = T.addTask(tasks, { title: "Buy milk", category: "Personal" });
assert.deepStrictEqual(tasks.map((t) => t.title), ["Buy milk", "Read chapter 3", "Write report"], "newest first");
const [milk, chapter, report] = tasks;

// ---- UPDATE
let u = T.updateTask(tasks, report.id, { title: "Write final report", category: "Study", due: "" });
assert.strictEqual(u.find((t) => t.id === report.id).title, "Write final report");
assert.strictEqual(u.find((t) => t.id === report.id).category, "Study");
assert.strictEqual(u.find((t) => t.id === report.id).due, "");
assert.strictEqual(T.updateTask(tasks, report.id, { title: "  " }).find((t) => t.id === report.id).title, "Write report", "blank title keeps old title");
assert.strictEqual(report.title, "Write report", "original task is not mutated");

// ---- TOGGLE / FILTER
let t2 = T.toggleTask(tasks, chapter.id);
assert.strictEqual(t2.find((t) => t.id === chapter.id).completed, true);
assert.strictEqual(T.toggleTask(t2, chapter.id).find((t) => t.id === chapter.id).completed, false, "toggle twice = back");
assert.deepStrictEqual(T.filterTasks(t2, { status: "active" }).map((t) => t.title), ["Buy milk", "Write report"]);
assert.deepStrictEqual(T.filterTasks(t2, { status: "completed" }).map((t) => t.title), ["Read chapter 3"]);
assert.strictEqual(T.filterTasks(t2, { status: "all" }).length, 3);
assert.deepStrictEqual(T.filterTasks(t2, { category: "Work" }).map((t) => t.title), ["Write report"]);
assert.deepStrictEqual(T.filterTasks(t2, { query: "MILK" }).map((t) => t.title), ["Buy milk"], "search is case-insensitive");
assert.strictEqual(T.filterTasks(t2, { status: "active", category: "Study" }).length, 0, "filters combine");

// ---- REORDER
assert.deepStrictEqual(T.moveTask(tasks, milk.id, report.id).map((t) => t.title), ["Read chapter 3", "Write report", "Buy milk"], "drag first item to last slot");
assert.deepStrictEqual(T.moveTask(tasks, report.id, milk.id).map((t) => t.title), ["Write report", "Buy milk", "Read chapter 3"], "drag last item to first slot");
assert.strictEqual(T.moveTask(tasks, milk.id, milk.id), tasks, "same id = no change");
assert.strictEqual(T.moveTask(tasks, "nope", milk.id), tasks, "unknown id = no change");

// ---- DELETE
assert.deepStrictEqual(T.deleteTask(tasks, chapter.id).map((t) => t.title), ["Buy milk", "Write report"]);
assert.strictEqual(T.clearCompleted(T.toggleTask(T.toggleTask(tasks, milk.id), report.id)).length, 1);

// ---- DUE STATUS / STATS
const mk = (due, completed = false) => ({ id: "x", title: "t", category: "Work", due, completed });
assert.strictEqual(T.dueStatus(mk("2026-11-17"), "2026-11-18"), "overdue");
assert.strictEqual(T.dueStatus(mk("2026-11-18"), "2026-11-18"), "today");
assert.strictEqual(T.dueStatus(mk("2026-11-19"), "2026-11-18"), "");
assert.strictEqual(T.dueStatus(mk("2026-11-01", true), "2026-11-18"), "", "completed tasks are never overdue");
assert.strictEqual(T.dueStatus(mk(""), "2026-11-18"), "", "no due date");
assert.strictEqual(T.dueStatus(mk("2026-12-01"), "2026-11-30"), "", "month boundary");
assert.strictEqual(T.todayStr(new Date(2026, 0, 5)), "2026-01-05", "local date, zero padded");

const s = T.stats([mk("2026-11-01"), mk("", true), mk("", true), mk("")], "2026-11-18");
assert.deepStrictEqual(s, { total: 4, completed: 2, active: 2, overdue: 1, percent: 50 });
assert.strictEqual(T.stats([]).percent, 0, "empty list -> 0%, no NaN");

// ---- SAFE LOADING
assert.deepStrictEqual(T.parseStored("not json"), [], "corrupt JSON -> empty list");
assert.deepStrictEqual(T.parseStored('{"a":1}'), [], "wrong shape -> empty list");
const parsed = T.parseStored(JSON.stringify([
  { id: "a", title: "Good", category: "Work", due: "2026-11-20", completed: true },
  { id: "a", title: "Duplicate id", category: "Nope" },
  { id: "b", title: "" },
  null, 5, "str",
]));
assert.strictEqual(parsed.length, 2, "invalid entries are dropped");
assert.notStrictEqual(parsed[0].id, parsed[1].id, "duplicate ids are fixed");
assert.strictEqual(parsed[1].category, "Other");
assert.strictEqual(parsed[0].completed, true);
const round = T.parseStored(JSON.stringify(tasks));
assert.deepStrictEqual(round.map((t) => t.title), tasks.map((t) => t.title), "save → load round trip keeps order");

console.log("All task tests passed ✅");
