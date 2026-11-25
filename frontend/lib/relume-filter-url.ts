// URL arithmetic for the Relume inventory filters. No Node imports: the
// filter menu, a Client Component, uses it.

function split(href: string) {
  const index = href.indexOf("?");
  return {
    path: index === -1 ? href : href.slice(0, index),
    params: new URLSearchParams(index === -1 ? "" : href.slice(index + 1)),
  };
}

// Filters that hold one value at a time. Merging two clicks on such a filter
// would put both values in the URL (?category=heroes&category=features), and
// the page reads only the first.
const SINGLE_VALUE_KEYS = new Set(["category", "status", "decision"]);

/**
 * Applies the change from `rendered` to `target` on top of `latest`.
 *
 * Every filter row carries the URL the server built for it from the filters
 * it last rendered. When a second row is clicked before the first navigation
 * lands, its URL does not hold the first click. Taking only what the row
 * changes, and applying that to the URL the first click asked for, keeps both.
 */
export function applyHrefChange(latest: string, rendered: string, target: string) {
  const from = split(rendered).params;
  const to = split(target);
  const base = split(latest).params;
  const result = new URLSearchParams();
  const keys = new Set([...base.keys(), ...from.keys(), ...to.params.keys()]);
  for (const key of keys) {
    if (SINGLE_VALUE_KEYS.has(key)) {
      // The row's value replaces the pending one; a row that leaves the key
      // alone keeps it.
      const changed = from.get(key) !== to.params.get(key);
      const value = changed ? to.params.get(key) : base.get(key);
      if (value) result.append(key, value);
      continue;
    }
    const before = from.getAll(key);
    const after = to.params.getAll(key);
    const removed = before.filter((value) => !after.includes(value));
    const added = after.filter((value) => !before.includes(value));
    const values = base.getAll(key).filter((value) => !removed.includes(value));
    for (const value of added) if (!values.includes(value)) values.push(value);
    for (const value of values) result.append(key, value);
  }
  const query = result.toString();
  return query ? `${to.path}?${query}` : to.path;
}

// The URL the last click asked for, until the page arrives there. One value
// for the page, so a click in one menu builds on a click in another.
let pending: { href: string; at: number } | null = null;

// A navigation here takes about a second. A pending URL older than this was
// superseded by a navigation the menus did not make (a tag link on a card),
// so it is no longer what the page is heading for.
const PENDING_MS = 5000;

function sameFilters(a: string, b: string) {
  const sorted = (href: string) => {
    const { path, params } = split(href);
    const pairs = [...params.entries()].map(([key, value]) => `${key}=${value}`);
    return `${path}?${pairs.sort().join("&")}`;
  };
  return sorted(a) === sorted(b);
}

/** The URL a click on `target` should navigate to; it is then remembered. */
export function nextFilterHref(rendered: string, target: string, now = Date.now()) {
  const base = pending && now - pending.at < PENDING_MS ? pending.href : rendered;
  pending = { href: applyHrefChange(base, rendered, target), at: now };
  return pending.href;
}

/** Call when the page renders `rendered`: forgets a click that has landed. */
export function settleFilterHref(rendered: string) {
  if (pending && sameFilters(pending.href, rendered)) pending = null;
}
