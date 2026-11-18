# Task 2 — Dynamic Task Manager & Productivity Tracker (CRUD)

**TaskFlow** is an interactive task manager built with **vanilla JavaScript (ES6+), DOM manipulation, the localStorage API and CSS transitions**. It has zero server dependencies: open it in a browser and it works.

**🔗 Live demo:** https://sajadafzali.github.io/Datheon_Full_Stack_Web_Development_Internship/task-2-task-manager/

## Features
- **Full CRUD:** create tasks, read/list them, update (edit title, category and due date inline) and delete them.
- **Categories:** Work, Personal, Study, Other, shown as colour-coded labels.
- **Due dates:** overdue tasks are highlighted in red and tasks due today in amber.
- **Mark complete:** animated round checkbox with strike-through; completed tasks fade.
- **Filter by status:** All / Active / Completed with live counters, plus category filter and text search.
- **Persistence:** everything is saved in `localStorage` (`saveToLocalStorage()` / `loadFromLocalStorage()`), so tasks survive page reloads and stay in sync across browser tabs.
- **Drag-and-drop reordering:** drag the ⋮⋮ handle; keyboard users press ↑ / ↓ on the handle; touch screens get ▲ ▼ buttons.
- **Animations:** slide-in on add, slide-out on delete, completion pop, animated progress bar (all disabled for `prefers-reduced-motion`).
- **Extras:** progress tracker, "clear completed", empty states, automatic dark mode, responsive layout, screen-reader announcements.
- **Safe & robust:** user text is HTML-escaped; corrupted localStorage data is ignored instead of crashing the app.

## Project structure
```
task-2-task-manager/
├── index.html
├── css/styles.css
├── js/
│   ├── tasks.js     # pure logic: add, update, toggle, delete, filter, reorder, stats (no DOM)
│   └── app.js       # state, rendering, events, drag-and-drop, localStorage
└── tests/tasks.test.js
```

## Approach
1. UI with an input bar, category selector, due-date picker and a task list container.
2. State management with a `tasks = []` array. Every change creates a new array, which is then saved and re-rendered.
3. `saveToLocalStorage()` and `loadFromLocalStorage()` keep the data across reloads.
4. HTML5 drag-and-drop (plus keyboard and touch alternatives) for reordering, and live search/filtering.
5. CSS transitions and keyframe animations for adding, completing and deleting tasks.

## Run locally
Open `index.html` in a browser, or:
```bash
cd task-2-task-manager
python -m http.server 8000   # → http://localhost:8000
```

## Run the tests
```bash
cd task-2-task-manager
node tests/tasks.test.js
```

## Tech
JavaScript (ES6+) · DOM manipulation · localStorage API · CSS transitions & animations
