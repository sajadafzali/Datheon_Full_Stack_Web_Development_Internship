# Task 1 — Personal Developer Portfolio & Project Showcase

A responsive, modern developer portfolio built with **semantic HTML5, mobile-first CSS (Flexbox + Grid) and vanilla JavaScript (ES6+)**. No frameworks or build step.

**🔗 Live site:** https://sajad-afzali.github.io/Datheon_Full_Stack_Web_Development_Internship/

## Features
- **Semantic structure:** `header`, `nav`, `main`, `section`, `article`, `footer`; Hero, About, Skills, Projects, Resume, Contact.
- **Mobile-first responsive layout:** base styles target phones; `min-width` breakpoints at 600px, 860px and 1024px scale up with Flexbox and CSS Grid.
- **Dark / light theme toggle:** follows the OS preference by default, remembers the visitor's choice in `localStorage`, and applies before first paint (no flash).
- **Smooth scrolling navigation:** CSS `scroll-behavior` plus `scroll-padding-top` for the fixed header, and the current section is highlighted in the nav.
- **Mobile hamburger menu:** animated icon, closes on link click, outside click or when resizing to desktop; uses `aria-expanded`.
- **Project modal popups:** cards generated from `js/projects.js`; accessible dialog with focus trap, Esc to close, and focus restored on close.
- **Extras:** typing effect, scroll-reveal animations, validated contact form (opens the visitor's email app, so no backend is needed), downloadable PDF resume.
- **Accessibility:** skip link, ARIA labels, visible focus rings, `prefers-reduced-motion` support, good colour contrast in both themes.

## Structure
```
task-1-portfolio/
├── index.html
├── css/styles.css
├── js/
│   ├── projects.js      # project data (cards + modal are generated from it)
│   └── main.js          # theme, menu, modal, form, effects
└── assets/resume.pdf
```

## Run locally
Open `index.html` in a browser, or:
```bash
cd task-1-portfolio
python -m http.server 8000   # → http://localhost:8000
```

## Deployment
Deployed automatically to **GitHub Pages** by `.github/workflows/pages.yml` on every push to `main`
(Settings → Pages → Source: GitHub Actions).
It can also be deployed on Vercel or Netlify by setting the root directory to `task-1-portfolio` (no build command).

## Tech
HTML5 · CSS3 (custom properties, Grid, Flexbox, `color-mix`) · JavaScript ES6+ · GitHub Pages

## Author
**Sajad Afzali** — [GitHub](https://github.com/Sajad-Afzali) · [LinkedIn](https://www.linkedin.com/in/sajad-afzali-73a87b438/)