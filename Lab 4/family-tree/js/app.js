/**
 * app.js — Entry point and router.
 *
 * Flow:
 *   1. Load + validate data/people.json (data.js).
 *   2. Read the URL hash (e.g. "#/person/p3" or "#/members?gen=2"),
 *      choose the matching view, and render it (views.js).
 *   3. Re-render whenever the hash changes, so the browser's Back and
 *      Forward buttons and bookmarks all work like a multi-page site.
 */

import { loadFamily } from "./data.js";
import {
  renderHome, renderTree, renderMembers, renderPerson, renderRelate,
  renderError, warningBanner,
} from "./views.js";

const DATA_URL = "data/people.json";
const main = document.getElementById("main");

/**
 * Route table: first path segment → view function.
 * Each view receives (mainElement, family, params).
 */
const routes = {
  "": renderHome,
  tree: renderTree,
  members: renderMembers,
  person: renderPerson,
  relate: renderRelate,
};

/**
 * Turn "#/person/p3?x=1" into { name: "person", params: { id: "p3", x: "1" } }.
 */
function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = hash.split("?");
  const [name = "", id] = path.split("/").map(decodeURIComponent);
  const params = Object.fromEntries(new URLSearchParams(query));
  if (id) params.id = id;
  return { name, params };
}

/** Highlight the nav link for the current page. */
function updateNav(name) {
  // A person profile belongs under "Members" in the menu.
  const section = name === "person" ? "members" : name || "home";
  document.querySelectorAll(".main-nav a").forEach((a) => {
    const active = a.dataset.route === section;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

/** Render the page for the current URL. */
function router(family) {
  const { name, params } = parseHash();
  const view = routes[name] || renderHome;

  view(main, family, params);

  // Non-fatal JSON problems are shown above every page.
  if (family.warnings.length) main.insertAdjacentHTML("afterbegin", warningBanner(family.warnings));

  updateNav(name);

  // Page title for browser history / tabs.
  const heading = main.querySelector("h1")?.textContent.trim();
  document.title = `${heading ? `${heading} — ` : ""}${family.title}`;

  // Start each new page at the top (except the tree, which scrolls itself).
  if (name !== "tree") window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

/* ----------------------------------------------------------------------
 * Light / dark theme, remembered between visits
 * ---------------------------------------------------------------------- */
function setupTheme() {
  const KEY = "family-tree-theme";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked — ignore */ }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const apply = (theme) => (document.documentElement.dataset.theme = theme);
  apply(saved || (prefersDark ? "dark" : "light"));

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  });
}

/* ----------------------------------------------------------------------
 * Start the app
 * ---------------------------------------------------------------------- */
async function start() {
  setupTheme();
  try {
    const family = await loadFamily(DATA_URL);
    document.getElementById("family-title").textContent = family.title;
    window.addEventListener("hashchange", () => router(family));
    router(family);
  } catch (err) {
    console.error(err);
    renderError(main, err);
  }
}

start();
