/**
 * data.js — Data layer of the Family Tree app.
 *
 * Responsibilities:
 *   1. Fetch the family heritage dataset (JSON) from the server.
 *   2. Validate it, so a broken or hand-edited file gives clear errors
 *      instead of a blank page.
 *   3. Build fast lookup structures (index by id, children lists,
 *      generation numbers) once, so every view can query relationships
 *      cheaply.
 *   4. Provide relationship helpers: parents, spouses, siblings, children,
 *      lineage, and a "how are A and B related?" calculator.
 *
 * Nothing in this file touches the DOM — it only works with data.
 */

/** Fields every person record must have (same schema as the lab's sample people.json). */
const REQUIRED_FIELDS = ["id", "name", "gender"];

/**
 * Load and prepare the dataset.
 * @param {string} url  Path to the JSON file.
 * @returns {Promise<Family>}  A ready-to-query Family object.
 * @throws {Error} with a user-friendly message if loading or parsing fails.
 */
export async function loadFamily(url) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (err) {
    // fetch() itself fails when the page is opened as a file:// URL
    // or when the network is down.
    throw new Error(
      "Could not reach the data file. If you opened index.html directly from your folder, " +
      "run it through a local web server instead (e.g. VS Code Live Server, or `python -m http.server`)."
    );
  }
  if (!response.ok) {
    throw new Error(`The data file "${url}" could not be loaded (HTTP ${response.status}).`);
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`"${url}" is not valid JSON: ${err.message}`);
  }

  return new Family(json);
}

/**
 * Family wraps the raw JSON and exposes relationship queries.
 */
export class Family {
  constructor(json) {
    if (!json || !Array.isArray(json.people)) {
      throw new Error('The JSON file must contain a "people" array.');
    }

    this.title = json.title || "Family Tree";
    this.warnings = [];         // non-fatal data problems, shown in the UI
    this.byId = new Map();      // id -> person
    this.childrenOf = new Map(); // id -> [child ids]

    // ---- 1. Index people and check required fields / duplicate ids ----
    for (const raw of json.people) {
      const missing = REQUIRED_FIELDS.filter((f) => !raw[f]);
      if (missing.length) {
        this.warnings.push(`Skipped a record with missing field(s): ${missing.join(", ")}.`);
        continue;
      }
      if (this.byId.has(raw.id)) {
        this.warnings.push(`Duplicate id "${raw.id}" — only the first record is used.`);
        continue;
      }
      // Normalise optional fields so views never deal with undefined.
      this.byId.set(raw.id, {
        photo: "", phone: "", address: "", dob: "", dateOfDeath: "",
        profession: "", bloodGroup: "", fatherId: null, motherId: null,
        isInLaw: false,
        ...raw,
        spouses: Array.isArray(raw.spouses) ? raw.spouses : [],
      });
    }

    // ---- 2. Check every reference points to a real person, build children map ----
    for (const p of this.byId.values()) {
      for (const key of ["fatherId", "motherId"]) {
        if (p[key] && !this.byId.has(p[key])) {
          this.warnings.push(`${p.name}: ${key} "${p[key]}" does not exist.`);
          p[key] = null;
        }
      }
      p.spouses = p.spouses.filter((s) => {
        const ok = this.byId.has(s.id);
        if (!ok) this.warnings.push(`${p.name}: spouse "${s.id}" does not exist.`);
        return ok;
      });
      for (const parentId of [p.fatherId, p.motherId]) {
        if (!parentId) continue;
        if (!this.childrenOf.has(parentId)) this.childrenOf.set(parentId, []);
        this.childrenOf.get(parentId).push(p.id);
      }
    }

    // Children are listed oldest first.
    for (const list of this.childrenOf.values()) list.sort((a, b) => this.compareByDob(a, b));

    // ---- 3. Work out generation numbers (1 = oldest ancestors) ----
    this.generationOf = new Map();
    for (const p of this.byId.values()) this.computeGeneration(p.id, new Set());
  }

  /* ------------------------------------------------------------------
   * Basic accessors
   * ------------------------------------------------------------------ */

  /** All people as an array. */
  get people() { return [...this.byId.values()]; }

  get(id) { return this.byId.get(id); }

  /** Oldest-first comparison; people without dob go last. */
  compareByDob(aId, bId) {
    const a = this.get(aId)?.dob || "9999";
    const b = this.get(bId)?.dob || "9999";
    return a.localeCompare(b);
  }

  /**
   * Generation number. Blood relatives are one more than their parents;
   * in-laws (no parents in the tree) take their spouse's generation.
   * `visiting` guards against cycles in a badly edited file.
   */
  computeGeneration(id, visiting) {
    if (this.generationOf.has(id)) return this.generationOf.get(id);
    if (visiting.has(id)) return 1; // cycle — stop recursing
    visiting.add(id);

    const p = this.get(id);
    let gen = 1;
    const parentGens = [p.fatherId, p.motherId]
      .filter(Boolean)
      .map((pid) => this.computeGeneration(pid, visiting));

    if (parentGens.length) {
      gen = Math.max(...parentGens) + 1;
    } else {
      // No parents recorded: use a blood-line spouse's generation if there is one.
      const bloodSpouse = this.spousesOf(id).find((s) => s.fatherId || s.motherId);
      if (bloodSpouse) gen = this.computeGeneration(bloodSpouse.id, visiting);
    }
    this.generationOf.set(id, gen);
    return gen;
  }

  generation(id) { return this.generationOf.get(id) || 1; }

  get generationCount() { return Math.max(1, ...this.generationOf.values()); }

  /* ------------------------------------------------------------------
   * Relationship helpers
   * ------------------------------------------------------------------ */

  parentsOf(id) {
    const p = this.get(id);
    return [p.fatherId, p.motherId].filter(Boolean).map((x) => this.get(x));
  }

  /** Spouse records joined with their marriage status. */
  spousesOf(id) {
    return this.get(id).spouses.map((s) => ({ ...this.get(s.id), status: s.status || "married" }));
  }

  childrenOfPerson(id) {
    return (this.childrenOf.get(id) || []).map((c) => this.get(c));
  }

  /** People sharing at least one parent, oldest first. */
  siblingsOf(id) {
    const p = this.get(id);
    const ids = new Set();
    for (const parentId of [p.fatherId, p.motherId]) {
      if (!parentId) continue;
      for (const c of this.childrenOf.get(parentId) || []) if (c !== id) ids.add(c);
    }
    return [...ids].sort((a, b) => this.compareByDob(a, b)).map((x) => this.get(x));
  }

  grandchildrenOf(id) {
    return this.childrenOfPerson(id).flatMap((c) => this.childrenOfPerson(c.id));
  }

  /**
   * The line of ancestors from the top of the tree down to this person,
   * following the father where known (falls back to the mother).
   */
  lineageOf(id) {
    const line = [];
    let cur = this.get(id);
    const seen = new Set();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      line.unshift(cur);
      cur = this.get(cur.fatherId) || this.get(cur.motherId);
    }
    return line;
  }

  /** Root couples: blood-line people with no parents in the tree. */
  get roots() {
    return this.people
      .filter((p) => !p.fatherId && !p.motherId && !p.isInLaw)
      .sort((a, b) => this.compareByDob(a.id, b.id));
  }

  isDeceased(p) { return Boolean(p.dateOfDeath); }

  /** Age today, or age at death. Returns null if dob is unknown. */
  ageOf(p) {
    if (!p.dob) return null;
    const birth = new Date(p.dob);
    const end = p.dateOfDeath ? new Date(p.dateOfDeath) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      end.getMonth() < birth.getMonth() ||
      (end.getMonth() === birth.getMonth() && end.getDate() < birth.getDate());
    if (beforeBirthday) age--;
    return age;
  }

  /* ------------------------------------------------------------------
   * "How are A and B related?"
   * ------------------------------------------------------------------ */

  /**
   * Map of every blood ancestor of `id` (including itself) to the number
   * of generations up. Breadth-first, so the shortest distance wins.
   */
  ancestorDepths(id) {
    const depths = new Map([[id, 0]]);
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift();
      for (const parent of this.parentsOf(cur)) {
        if (!depths.has(parent.id)) {
          depths.set(parent.id, depths.get(cur) + 1);
          queue.push(parent.id);
        }
      }
    }
    return depths;
  }

  /**
   * Blood relationship of A to B, e.g. "grandfather", "first cousin".
   * Returns null if they share no common ancestor in the dataset.
   */
  bloodRelation(aId, bId) {
    const upA = this.ancestorDepths(aId);
    const upB = this.ancestorDepths(bId);

    // Find the closest common ancestor (smallest combined distance).
    let best = null;
    for (const [anc, dA] of upA) {
      if (!upB.has(anc)) continue;
      const dB = upB.get(anc);
      if (!best || dA + dB < best.dA + best.dB) best = { anc, dA, dB };
    }
    if (!best) return null;

    const male = this.get(aId).gender === "male";
    const pick = (m, f) => (male ? m : f);
    const { dA, dB } = best;

    if (dA === 0 && dB === 0) return "the same person";
    if (dA === 0) return greatPrefix(dB, pick("father", "mother"), pick("grandfather", "grandmother"));
    if (dB === 0) return greatPrefix(dA, pick("son", "daughter"), pick("grandson", "granddaughter"));
    if (dA === 1 && dB === 1) return pick("brother", "sister");
    if (dA === 1) return greatPrefix(dB - 1, pick("uncle", "aunt"), pick("great-uncle", "great-aunt"));
    if (dB === 1) return greatPrefix(dA - 1, pick("nephew", "niece"), pick("grand-nephew", "grand-niece"));

    // Cousins: degree = closer distance − 1, removed = difference.
    const degree = Math.min(dA, dB) - 1;
    const removed = Math.abs(dA - dB);
    const ordinal = ["", "first", "second", "third", "fourth", "fifth"][degree] || `${degree}th`;
    const rem = removed === 0 ? "" : removed === 1 ? " once removed" : removed === 2 ? " twice removed" : ` ${removed} times removed`;
    return `${ordinal} cousin${rem}`;
  }

  /**
   * Full relationship, including marriage links.
   * @returns {{text: string, via: object|null}}  `text` reads as
   *          "<A> is <B>'s <text>".
   */
  relation(aId, bId) {
    const A = this.get(aId);
    const B = this.get(bId);
    const pick = (m, f) => (A.gender === "male" ? m : f);

    if (aId === bId) return { text: "the same person", via: null };

    // Direct marriage
    const marriage = A.spouses.find((s) => s.id === bId);
    if (marriage) {
      const word = pick("husband", "wife");
      return { text: marriage.status === "married" ? word : `${marriage.status} ${word}`, via: null };
    }

    // Blood relationship
    const blood = this.bloodRelation(aId, bId);
    if (blood) return { text: blood, via: null };

    // A married into the family: describe A through their spouse.
    for (const s of this.spousesOf(aId)) {
      const r = this.bloodRelation(s.id, bId);
      if (!r) continue;
      if (/^(son|daughter)$/.test(r)) return { text: pick("son-in-law", "daughter-in-law"), via: s };
      if (/^(brother|sister)$/.test(r)) return { text: pick("brother-in-law", "sister-in-law"), via: s };
      if (/^(father|mother)$/.test(r)) return { text: pick("step-father", "step-mother"), via: s };
      if (/^(uncle|aunt)$/.test(r)) return { text: pick("uncle", "aunt") + " (by marriage)", via: s };
      if (/^(grandfather|grandmother)$/.test(r)) return { text: pick("grandfather", "grandmother") + " (by marriage)", via: s };
      return { text: `${r}'s ${pick("husband", "wife")}`, via: s };
    }

    // B married into the family: describe A relative to B's spouse.
    for (const s of this.spousesOf(bId)) {
      const r = this.bloodRelation(aId, s.id);
      if (!r) continue;
      if (/^(father|mother)$/.test(r)) return { text: pick("father-in-law", "mother-in-law"), via: s };
      if (/^(brother|sister)$/.test(r)) return { text: pick("brother-in-law", "sister-in-law"), via: s };
      return { text: `spouse's ${r}`, via: s };
    }

    // Both married in — related only through two marriages.
    return { text: "relative by marriage", via: null };
  }
}

/** 0 → base word, 1 → "grand" word, 2+ → "great-…grand" word. */
function greatPrefix(n, base, grand) {
  if (n <= 1) return base;
  if (n === 2) return grand;
  return "great-".repeat(n - 2) + grand;
}
