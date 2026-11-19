/**
 * views.js — Presentation layer.
 *
 * Each exported `render…` function receives the Family object (from data.js)
 * plus route parameters, writes HTML into the <main> element, and wires up
 * that page's event listeners. Views never fetch data themselves.
 *
 * All text that comes from the JSON file is passed through `esc()` before it
 * is inserted as HTML, so a name like "<script>" can never run as code.
 */

/* ======================================================================
 * Small helpers
 * ====================================================================== */

/** Escape text for safe insertion into HTML. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "1960-03-09" → "9 Mar 1960" */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const year = (iso) => (iso ? iso.slice(0, 4) : "?");

/** "1935 – 2010" or "b. 1986" */
function lifespan(p) {
  if (!p.dob && !p.dateOfDeath) return "";
  return p.dateOfDeath ? `${year(p.dob)} – ${year(p.dateOfDeath)}` : `b. ${year(p.dob)}`;
}

/** Initials for the avatar placeholder, skipping "bin"/"binti"/"Haji" etc. */
function initials(name) {
  const skip = new Set(["bin", "binti", "bt", "b", "haji", "hajah", "hj", "hjh", "dr"]);
  const words = name.split(/\s+/).filter((w) => !skip.has(w.toLowerCase()));
  return (words[0]?.[0] || "") + (words[1]?.[0] || "");
}

/** Avatar: the photo if the JSON has one, otherwise coloured initials. */
function avatar(p, size = "md") {
  const cls = `avatar avatar-${size} ${p.gender === "female" ? "is-female" : "is-male"}`;
  if (p.photo) {
    return `<img class="${cls}" src="${esc(p.photo)}" alt="" loading="lazy" />`;
  }
  return `<span class="${cls}" aria-hidden="true">${esc(initials(p.name))}</span>`;
}

/** Status badge for deceased members / in-laws. */
function badges(p) {
  let out = "";
  if (p.dateOfDeath) out += `<span class="badge badge-muted">Deceased</span>`;
  if (p.isInLaw) out += `<span class="badge">In-law</span>`;
  return out;
}

/** Compact clickable "chip" linking to a person's profile. */
function chip(p, note = "") {
  return `
    <a class="chip ${p.dateOfDeath ? "is-deceased" : ""}" href="#/person/${encodeURIComponent(p.id)}">
      ${avatar(p, "sm")}
      <span class="chip-text">
        <span class="chip-name">${esc(p.name)}</span>
        <span class="chip-meta">${esc(note || lifespan(p))}</span>
      </span>
    </a>`;
}

/** Empty state block. */
function empty(message) {
  return `<p class="empty">${esc(message)}</p>`;
}

/* ======================================================================
 * HOME — overview, statistics, generations chart
 * ====================================================================== */

export function renderHome(main, family) {
  const people = family.people;
  const living = people.filter((p) => !p.dateOfDeath).length;
  const places = new Set(people.map((p) => p.address.split(",").pop().trim()).filter(Boolean));
  const gens = family.generationCount;

  // Count members per generation for the bar chart.
  const perGen = Array.from({ length: gens }, (_, i) =>
    people.filter((p) => family.generation(p.id) === i + 1)
  );
  const maxCount = Math.max(...perGen.map((g) => g.length));

  // Oldest living member and youngest member — a nice "did you know" touch.
  const byAge = [...people].filter((p) => p.dob).sort((a, b) => a.dob.localeCompare(b.dob));
  const eldest = byAge.find((p) => !p.dateOfDeath);
  const youngest = byAge[byAge.length - 1];

  const root = family.roots[0];

  main.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Family heritage</p>
        <h1>${esc(family.title)}</h1>
        <p class="lead">
          ${gens} generations of the family${root ? `, beginning with <a href="#/person/${esc(root.id)}">${esc(root.name)}</a>` : ""}.
          Explore the tree, search for members, or find out how any two people are related.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/tree">View the family tree</a>
          <a class="btn" href="#/members">Browse members</a>
        </div>
      </div>
    </section>

    <section class="stats" aria-label="Family statistics">
      <div class="stat"><span class="stat-value">${people.length}</span><span class="stat-label">Members</span></div>
      <div class="stat"><span class="stat-value">${gens}</span><span class="stat-label">Generations</span></div>
      <div class="stat"><span class="stat-value">${living}</span><span class="stat-label">Living</span></div>
      <div class="stat"><span class="stat-value">${places.size}</span><span class="stat-label">States / cities</span></div>
    </section>

    <section class="panel-grid">
      <article class="panel">
        <h2>Members by generation</h2>
        <ol class="gen-bars">
          ${perGen.map((list, i) => `
            <li>
              <a class="gen-bar-row" href="#/members?gen=${i + 1}">
                <span class="gen-bar-label">Gen ${i + 1}</span>
                <span class="gen-bar-track"><span class="gen-bar-fill" style="--w:${(list.length / maxCount) * 100}%"></span></span>
                <span class="gen-bar-count">${list.length}</span>
              </a>
            </li>`).join("")}
        </ol>
      </article>

      <article class="panel">
        <h2>Did you know?</h2>
        <ul class="facts">
          ${eldest ? `<li>The eldest living member is ${chip(eldest, `${family.ageOf(eldest)} years old`)}</li>` : ""}
          ${youngest ? `<li>The youngest member is ${chip(youngest, `born ${year(youngest.dob)}`)}</li>` : ""}
          <li>${people.filter((p) => p.isInLaw).length} members joined the family through marriage.</li>
        </ul>
      </article>
    </section>
  `;
}

/* ======================================================================
 * TREE — the visual family tree
 * ====================================================================== */

/** One card inside the tree. */
function treeCard(family, p) {
  return `
    <a class="tree-card ${p.gender === "female" ? "is-female" : "is-male"} ${p.dateOfDeath ? "is-deceased" : ""}"
       href="#/person/${encodeURIComponent(p.id)}" data-id="${esc(p.id)}" data-name="${esc(p.name.toLowerCase())}">
      ${avatar(p, "sm")}
      <span class="tree-card-text">
        <span class="tree-card-name">${esc(p.name)}</span>
        <span class="tree-card-meta">${esc(lifespan(p))}${p.profession ? ` · ${esc(p.profession)}` : ""}</span>
      </span>
    </a>`;
}

/**
 * Build one "family unit": a blood-line person, their spouse(s), and
 * (recursively) their children. Returns an <li> for the nested <ul> tree.
 * `seen` prevents infinite loops if the JSON contains a cycle.
 */
function treeUnit(family, person, seen) {
  if (seen.has(person.id)) return "";
  seen.add(person.id);

  const spouses = family.spousesOf(person.id);
  // Children of this person (with any spouse), oldest first.
  const kids = family.childrenOfPerson(person.id);

  const couple = [
    treeCard(family, person),
    ...spouses.map((s) => `
      <span class="tree-joiner" title="${esc(s.status)}" aria-label="${esc(s.status)} to">${s.status === "married" ? "♥" : "⋯"}</span>
      ${treeCard(family, s)}`),
  ].join("");

  const childList = kids.length
    ? `<ul>${kids.map((k) => treeUnit(family, k, seen)).join("")}</ul>`
    : "";

  return `
    <li class="${kids.length ? "has-children" : ""}">
      <div class="tree-unit">
        ${couple}
        ${kids.length ? `<button class="collapse-btn" type="button" aria-expanded="true" title="Show / hide descendants">−</button>` : ""}
      </div>
      ${childList}
    </li>`;
}

export function renderTree(main, family, params) {
  const seen = new Set();
  const units = family.roots.map((r) => treeUnit(family, r, seen)).join("");

  main.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Family tree</h1>
        <p class="muted">Click any person to open their profile. Use − to fold a branch.</p>
      </div>
      <div class="toolbar" role="toolbar" aria-label="Tree controls">
        <label class="search">
          <span class="visually-hidden">Find a person in the tree</span>
          <input type="search" id="tree-search" placeholder="Find in tree…" autocomplete="off" />
        </label>
        <button class="icon-btn" type="button" data-zoom="-0.1" aria-label="Zoom out">−</button>
        <span class="zoom-level" id="zoom-level">100%</span>
        <button class="icon-btn" type="button" data-zoom="0.1" aria-label="Zoom in">+</button>
        <button class="btn btn-small" type="button" id="zoom-fit">Fit</button>
      </div>
    </section>

    <div class="legend" aria-hidden="true">
      <span><i class="dot is-male"></i>Male</span>
      <span><i class="dot is-female"></i>Female</span>
      <span><i class="dot is-deceased"></i>Deceased</span>
      <span>♥ Married</span>
    </div>

    <div class="tree-viewport" id="tree-viewport">
      <div class="tree" id="tree"><ul>${units}</ul></div>
    </div>
  `;

  const viewport = main.querySelector("#tree-viewport");
  const tree = main.querySelector("#tree");
  const zoomLabel = main.querySelector("#zoom-level");
  let zoom = 1;

  const setZoom = (z) => {
    zoom = Math.min(1.5, Math.max(0.3, Math.round(z * 100) / 100));
    tree.style.zoom = zoom;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  };

  // Zoom buttons
  main.querySelectorAll("[data-zoom]").forEach((btn) =>
    btn.addEventListener("click", () => setZoom(zoom + Number(btn.dataset.zoom)))
  );

  // "Fit" — scale the tree so its full width fits the screen.
  const fit = () => {
    tree.style.zoom = 1;
    const ratio = (viewport.clientWidth - 16) / tree.scrollWidth;
    setZoom(Math.min(1, ratio));
  };
  main.querySelector("#zoom-fit").addEventListener("click", fit);

  // Collapse / expand branches
  tree.addEventListener("click", (e) => {
    const btn = e.target.closest(".collapse-btn");
    if (!btn) return;
    const li = btn.closest("li");
    const collapsed = li.classList.toggle("is-collapsed");
    btn.textContent = collapsed ? "+" : "−";
    btn.setAttribute("aria-expanded", String(!collapsed));
  });

  // Search: highlight matching cards and scroll to the first match.
  const search = main.querySelector("#tree-search");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let first = null;
    tree.querySelectorAll(".tree-card").forEach((card) => {
      const hit = q && card.dataset.name.includes(q);
      card.classList.toggle("is-match", Boolean(hit));
      tree.classList.toggle("is-searching", Boolean(q));
      if (hit && !first) first = card;
    });
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  });

  // Coming from a profile's "Show in tree": highlight that person.
  if (params.focus) {
    const card = tree.querySelector(`.tree-card[data-id="${CSS.escape(params.focus)}"]`);
    if (card) {
      card.classList.add("is-focus");
      requestAnimationFrame(() => card.scrollIntoView({ block: "center", inline: "center" }));
    }
  } else if (viewport.clientWidth < tree.scrollWidth) {
    // Start zoomed out so more of the tree is visible, but never so small
    // that names become unreadable (phones scroll sideways instead).
    fit();
    if (zoom < 0.6) {
      setZoom(0.6);
      // Centre the view on the eldest couple at the top of the tree.
      const top = tree.querySelector(".tree-unit");
      if (top) viewport.scrollLeft = top.offsetLeft * zoom + (top.offsetWidth * zoom - viewport.clientWidth) / 2;
    }
  }
}

/* ======================================================================
 * MEMBERS — searchable, filterable directory
 * ====================================================================== */

/** Filter state survives navigating to a profile and back. */
const memberFilters = { q: "", gender: "", gen: "", status: "", type: "", place: "", sort: "name" };

export function renderMembers(main, family, params) {
  // A link like #/members?gen=2 pre-selects a filter.
  if (params.gen) memberFilters.gen = params.gen;

  const places = [...new Set(family.people.map((p) => p.address).filter(Boolean))].sort();
  const gens = Array.from({ length: family.generationCount }, (_, i) => i + 1);
  const option = (value, label, current) =>
    `<option value="${esc(value)}" ${String(current) === String(value) ? "selected" : ""}>${esc(label)}</option>`;

  main.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Members</h1>
        <p class="muted" id="result-count" aria-live="polite"></p>
      </div>
    </section>

    <form class="filters" id="filters" role="search" onsubmit="return false">
      <label class="search filters-search">
        <span class="visually-hidden">Search by name, profession or place</span>
        <input type="search" name="q" placeholder="Search name, profession, place…" value="${esc(memberFilters.q)}" autocomplete="off" />
      </label>
      <label><span>Gender</span>
        <select name="gender">${option("", "All", memberFilters.gender)}${option("male", "Male", memberFilters.gender)}${option("female", "Female", memberFilters.gender)}</select>
      </label>
      <label><span>Generation</span>
        <select name="gen">${option("", "All", memberFilters.gen)}${gens.map((g) => option(g, `Generation ${g}`, memberFilters.gen)).join("")}</select>
      </label>
      <label><span>Status</span>
        <select name="status">${option("", "All", memberFilters.status)}${option("living", "Living", memberFilters.status)}${option("deceased", "Deceased", memberFilters.status)}</select>
      </label>
      <label><span>Member type</span>
        <select name="type">${option("", "All", memberFilters.type)}${option("blood", "Blood relative", memberFilters.type)}${option("inlaw", "In-law", memberFilters.type)}</select>
      </label>
      <label><span>Location</span>
        <select name="place">${option("", "All", memberFilters.place)}${places.map((pl) => option(pl, pl, memberFilters.place)).join("")}</select>
      </label>
      <label><span>Sort by</span>
        <select name="sort">${option("name", "Name (A–Z)", memberFilters.sort)}${option("oldest", "Oldest first", memberFilters.sort)}${option("youngest", "Youngest first", memberFilters.sort)}${option("gen", "Generation", memberFilters.sort)}</select>
      </label>
      <button class="btn btn-small" type="reset" id="reset-filters">Clear</button>
    </form>

    <ul class="member-grid" id="member-grid"></ul>
  `;

  const form = main.querySelector("#filters");
  const grid = main.querySelector("#member-grid");
  const count = main.querySelector("#result-count");

  const update = () => {
    const f = memberFilters;
    const q = f.q.trim().toLowerCase();

    let list = family.people.filter((p) => {
      if (q && ![p.name, p.profession, p.address].some((v) => v.toLowerCase().includes(q))) return false;
      if (f.gender && p.gender !== f.gender) return false;
      if (f.gen && family.generation(p.id) !== Number(f.gen)) return false;
      if (f.status === "living" && p.dateOfDeath) return false;
      if (f.status === "deceased" && !p.dateOfDeath) return false;
      if (f.type === "blood" && p.isInLaw) return false;
      if (f.type === "inlaw" && !p.isInLaw) return false;
      if (f.place && p.address !== f.place) return false;
      return true;
    });

    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name),
      oldest: (a, b) => (a.dob || "9999").localeCompare(b.dob || "9999"),
      youngest: (a, b) => (b.dob || "").localeCompare(a.dob || ""),
      gen: (a, b) => family.generation(a.id) - family.generation(b.id) || a.name.localeCompare(b.name),
    };
    list.sort(sorters[f.sort] || sorters.name);

    count.textContent = `Showing ${list.length} of ${family.people.length} members`;
    grid.innerHTML = list.length
      ? list.map((p) => memberCard(family, p)).join("")
      : `<li>${empty("No members match these filters.")}</li>`;
  };

  // Any change in the form updates the state and re-renders the list.
  form.addEventListener("input", (e) => {
    if (!e.target.name) return;
    memberFilters[e.target.name] = e.target.value;
    update();
  });
  form.addEventListener("reset", () => {
    Object.assign(memberFilters, { q: "", gender: "", gen: "", status: "", type: "", place: "", sort: "name" });
    // Wait for the browser to reset the inputs, then refresh the list.
    setTimeout(update);
  });

  update();
}

function memberCard(family, p) {
  const age = family.ageOf(p);
  return `
    <li>
      <a class="member-card ${p.dateOfDeath ? "is-deceased" : ""}" href="#/person/${encodeURIComponent(p.id)}">
        ${avatar(p, "md")}
        <span class="member-card-body">
          <span class="member-card-name">${esc(p.name)}</span>
          <span class="member-card-meta">${esc(p.profession || "—")}</span>
          <span class="member-card-meta">${esc(lifespan(p))}${age !== null ? ` · ${p.dateOfDeath ? "aged" : "age"} ${age}` : ""}</span>
          <span class="member-card-tags">
            <span class="badge badge-gen">Gen ${family.generation(p.id)}</span>${badges(p)}
          </span>
        </span>
      </a>
    </li>`;
}

/* ======================================================================
 * PERSON — profile page with all relationships
 * ====================================================================== */

export function renderPerson(main, family, params) {
  const p = family.get(params.id);
  if (!p) {
    main.innerHTML = `
      <section class="panel narrow">
        <h1>Person not found</h1>
        <p>There is nobody with id “${esc(params.id)}” in the dataset.</p>
        <a class="btn" href="#/members">Back to members</a>
      </section>`;
    return;
  }

  const age = family.ageOf(p);
  const parents = family.parentsOf(p.id);
  const spouses = family.spousesOf(p.id);
  const siblings = family.siblingsOf(p.id);
  const children = family.childrenOfPerson(p.id);
  const grandchildren = family.grandchildrenOf(p.id);
  const lineage = family.lineageOf(p.id);

  // Previous / next person in the same generation, for quick browsing.
  const sameGen = family.people
    .filter((x) => family.generation(x.id) === family.generation(p.id))
    .sort((a, b) => (a.dob || "").localeCompare(b.dob || ""));
  const idx = sameGen.findIndex((x) => x.id === p.id);
  const prev = sameGen[idx - 1];
  const next = sameGen[idx + 1];

  const relSection = (title, list, noteFn) => `
    <section class="relations">
      <h2>${title} <span class="count">${list.length}</span></h2>
      ${list.length ? `<div class="chip-list">${list.map((x) => chip(x, noteFn ? noteFn(x) : "")).join("")}</div>` : empty("None recorded")}
    </section>`;

  const detail = (label, value) => `<div><dt>${label}</dt><dd>${value || "—"}</dd></div>`;

  main.innerHTML = `
    <nav class="breadcrumb" aria-label="Lineage">
      <span class="muted">Lineage:</span>
      ${lineage.map((x, i) => i === lineage.length - 1
        ? `<span aria-current="page">${esc(x.name)}</span>`
        : `<a href="#/person/${encodeURIComponent(x.id)}">${esc(x.name)}</a><span class="sep" aria-hidden="true">›</span>`).join("")}
    </nav>

    <article class="profile">
      <header class="profile-head ${p.gender === "female" ? "is-female" : "is-male"}">
        ${avatar(p, "lg")}
        <div>
          <p class="eyebrow">Generation ${family.generation(p.id)}${p.isInLaw ? " · joined by marriage" : ""}</p>
          <h1>${esc(p.name)}</h1>
          <p class="lead">${esc(p.profession || "")}${p.profession && p.address ? " · " : ""}${esc(p.address)}</p>
          <div class="profile-tags">${badges(p)}</div>
        </div>
        <div class="profile-actions">
          <a class="btn btn-small" href="#/tree?focus=${encodeURIComponent(p.id)}">Show in tree</a>
          <a class="btn btn-small" href="#/relate?a=${encodeURIComponent(p.id)}">Compare with…</a>
        </div>
      </header>

      <dl class="details">
        ${detail("Gender", p.gender === "female" ? "Female" : "Male")}
        ${detail("Date of birth", formatDate(p.dob))}
        ${p.dateOfDeath ? detail("Date of death", formatDate(p.dateOfDeath)) : ""}
        ${detail(p.dateOfDeath ? "Age at death" : "Age", age !== null ? `${age} years` : "")}
        ${detail("Blood group", esc(p.bloodGroup))}
        ${detail("Hometown", esc(p.address))}
        ${p.phone ? detail("Phone", `<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`) : ""}
      </dl>

      <div class="relations-grid">
        ${relSection("Parents", parents, (x) => (x.gender === "female" ? "Mother" : "Father"))}
        ${relSection("Spouse", spouses, (x) => `${x.status[0].toUpperCase()}${x.status.slice(1)}`)}
        ${relSection("Siblings", siblings, (x) => (x.gender === "female" ? "Sister" : "Brother") + (x.dob ? ` · b. ${year(x.dob)}` : ""))}
        ${relSection("Children", children, (x) => (x.gender === "female" ? "Daughter" : "Son") + (x.dob ? ` · b. ${year(x.dob)}` : ""))}
        ${grandchildren.length ? relSection("Grandchildren", grandchildren) : ""}
      </div>

      <nav class="pager" aria-label="Same generation">
        ${prev ? `<a class="btn" href="#/person/${encodeURIComponent(prev.id)}">‹ ${esc(prev.name)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/person/${encodeURIComponent(next.id)}">${esc(next.name)} ›</a>` : "<span></span>"}
      </nav>
    </article>
  `;
}

/* ======================================================================
 * RELATE — "How are we related?" calculator
 * ====================================================================== */

export function renderRelate(main, family, params) {
  const people = [...family.people].sort((a, b) => a.name.localeCompare(b.name));
  const options = (selected) =>
    people.map((p) => `<option value="${esc(p.id)}" ${p.id === selected ? "selected" : ""}>${esc(p.name)}</option>`).join("");

  const aId = family.get(params.a) ? params.a : people[0].id;
  const bId = family.get(params.b) ? params.b : (people.find((p) => p.id !== aId) || people[0]).id;

  main.innerHTML = `
    <section class="page-head">
      <div>
        <h1>How are we related?</h1>
        <p class="muted">Pick any two members and the app works out the relationship by tracing their common ancestors.</p>
      </div>
    </section>

    <form class="relate-form panel" id="relate-form" onsubmit="return false">
      <label><span>Person A</span><select name="a">${options(aId)}</select></label>
      <button class="icon-btn swap" type="button" id="swap" aria-label="Swap the two people" title="Swap">⇄</button>
      <label><span>Person B</span><select name="b">${options(bId)}</select></label>
    </form>

    <section class="relate-result panel" id="relate-result" aria-live="polite"></section>
  `;

  const form = main.querySelector("#relate-form");
  const out = main.querySelector("#relate-result");

  const update = () => {
    const a = family.get(form.a.value);
    const b = family.get(form.b.value);
    const rel = family.relation(a.id, b.id);
    const reverse = family.relation(b.id, a.id);

    out.innerHTML = `
      <div class="relate-people">
        ${chip(a)}
        <span class="relate-arrow" aria-hidden="true">→</span>
        ${chip(b)}
      </div>
      <p class="relate-sentence">
        <strong>${esc(a.name)}</strong> is <strong>${esc(b.name)}</strong>'s
        <span class="relate-word">${esc(rel.text)}</span>.
      </p>
      ${rel.via ? `<p class="muted">Linked through ${chip(rel.via, "spouse")}</p>` : ""}
      <p class="muted">And the other way: ${esc(b.name)} is ${esc(a.name)}'s <strong>${esc(reverse.text)}</strong>.</p>
    `;
    // Keep the URL in sync so the result can be bookmarked or shared.
    history.replaceState(null, "", `#/relate?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`);
  };

  form.addEventListener("change", update);
  main.querySelector("#swap").addEventListener("click", () => {
    [form.a.value, form.b.value] = [form.b.value, form.a.value];
    update();
  });

  update();
}

/* ======================================================================
 * ERROR — shown when the JSON cannot be loaded
 * ====================================================================== */

export function renderError(main, error) {
  main.innerHTML = `
    <section class="panel narrow error-panel" role="alert">
      <h1>Couldn't load the family data</h1>
      <p>${esc(error.message)}</p>
      <button class="btn btn-primary" type="button" onclick="location.reload()">Try again</button>
    </section>`;
}

/** Banner listing non-fatal data problems found while validating the JSON. */
export function warningBanner(warnings) {
  if (!warnings.length) return "";
  return `
    <details class="warning-banner">
      <summary>${warnings.length} problem(s) found in people.json</summary>
      <ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
    </details>`;
}
