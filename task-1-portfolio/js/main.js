/**
 * main.js — interactivity for the portfolio:
 * theme toggle · hamburger menu · active-link highlight · typing effect ·
 * scroll reveal · project cards + modal · contact form
 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- 1. Theme toggle (dark / light) ---------- */
  const root = document.documentElement;
  const themeBtn = $("#theme-toggle");
  function applyTheme(theme, save) {
    root.dataset.theme = theme;
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (save) { try { localStorage.setItem("theme", theme); } catch (_) {} }
  }
  applyTheme(root.dataset.theme || "light", false);
  themeBtn.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  // follow the OS setting until the visitor makes an explicit choice
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null; try { saved = localStorage.getItem("theme"); } catch (_) {}
    if (!saved) applyTheme(e.matches ? "dark" : "light", false);
  });

  /* ---------- 2. Mobile hamburger menu ---------- */
  const menuBtn = $("#menu-toggle");
  const navLinks = $("#nav-links");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });   // close after choosing a link
  document.addEventListener("click", (e) => {                                                 // click outside closes
    if (navLinks.classList.contains("open") && !e.target.closest(".nav")) setMenu(false);
  });
  window.matchMedia("(min-width: 860px)").addEventListener("change", () => setMenu(false));

  /* ---------- 3. Highlight the nav link of the section in view ---------- */
  const links = $$(".nav-links a");
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => {
          const on = a.getAttribute("href") === "#" + en.target.id;
          a.classList.toggle("active", on);
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- 4. Typing effect in the hero ---------- */
  const typed = $("#typed");
  const phrases = ["Python programmer", "Java & C++ learner", "web developer in the making", "Chinese language teacher"];
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let p = 0, i = 0, deleting = false;
    (function tick() {
      const word = phrases[p];
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 80;
      if (!deleting && i === word.length) { deleting = true; delay = 1600; }
      else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }
      else i += deleting ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  /* ---------- 5. Reveal-on-scroll ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((r) => io.observe(r));
  } else reveals.forEach((r) => r.classList.add("visible"));

  /* ---------- 6. Projects: cards + modal ---------- */
  const grid = $("#project-grid");
  const projects = window.PROJECTS || [];
  grid.innerHTML = projects.map((p) => `
    <button class="project-card reveal" type="button" data-id="${esc(p.id)}" aria-haspopup="dialog">
      <span class="project-art theme-${esc(p.theme)}" aria-hidden="true">${p.icon}</span>
      <span class="project-body">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        <ul class="chips">${p.stack.slice(0, 3).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <span class="more">View details →</span>
      </span>
    </button>`).join("");
  $$(".reveal", grid).forEach((r) => (("IntersectionObserver" in window) ? null : r.classList.add("visible")));
  if ("IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((entries, obs) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); } }), { threshold: 0.12 });
    $$(".reveal", grid).forEach((r) => io2.observe(r));
  }

  const modal = $("#modal");
  const card = $(".modal-card", modal);
  let lastFocus = null;

  function openModal(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    lastFocus = document.activeElement;
    $("#modal-title").textContent = p.title;
    $("#modal-desc").textContent = p.description;
    $("#modal-features").innerHTML = p.features.map((f) => `<li>${esc(f)}</li>`).join("");
    $("#modal-stack").innerHTML = p.stack.map((s) => `<li>${esc(s)}</li>`).join("");
    $("#modal-links").innerHTML = (p.links || []).map((l) => `<a class="btn primary" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
    const art = $("#modal-art");
    art.className = "modal-art theme-" + p.theme;
    art.textContent = p.icon;
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    card.focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  grid.addEventListener("click", (e) => { const c = e.target.closest(".project-card"); if (c) openModal(c.dataset.id); });
  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {                       // keep keyboard focus inside the dialog
      const f = $$("button, a[href]", card).filter((el) => !el.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- 7. Contact form (opens the visitor's email app) ---------- */
  const form = $("#contact-form");
  const msg = $("#form-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    $$("input, textarea", form).forEach((x) => x.classList.remove("invalid", "ok"));
    msg.className = "form-msg";
    const bad = [];
    if (f.name.value.trim().length < 2) bad.push([f.name, "Please enter your name."]);
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) bad.push([f.email, "Please enter a valid email address."]);
    if (f.message.value.trim().length < 10) bad.push([f.message, "Your message should be at least 10 characters."]);
    if (bad.length) {
      bad.forEach(([el]) => el.classList.add("invalid"));
      msg.textContent = bad[0][1];
      bad[0][0].focus();
      return;
    }
    const subject = encodeURIComponent("Portfolio message from " + f.name.value.trim());
    const body = encodeURIComponent(f.message.value.trim() + "\n\n— " + f.name.value.trim() + " (" + f.email.value.trim() + ")");
    window.location.href = "mailto:sajadafzali983@gmail.com?subject=" + subject + "&body=" + body;
    msg.textContent = "Opening your email app… thank you!";
    msg.classList.add("ok");
    form.reset();
  });

  /* ---------- 8. Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
