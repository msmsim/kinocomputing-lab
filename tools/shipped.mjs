// What shipped on the roadmap (kinocomputing's notes/_roadmap.json, README
// "Roadmap" there): its headlines in Done. The day's brief names each the
// first time settle sees it done, and the week in review sums up the week's.
//
// Which headlines a brief has named is kept in state/roadmap-shipped.json, by
// the day of the brief: { "earlier": [ids], "2026-11-29": [ids], … }. The
// day's second shift names its first shift's again, since it rewrites the
// day's brief. With no record yet, everything already done is "earlier", so
// the first brief doesn't name the whole history.

/** The day an item last moved to Done, or null if it isn't done. */
export function doneOn(item) {
  if (item?.status !== "done") return null;
  return [...(item.moves ?? [])].reverse().find((m) => m.to === "done")?.on ?? item.created ?? null;
}

/** The items a roadmap file holds, or [] for anything that isn't one. */
export const itemsOf = (data) => (Array.isArray(data?.items) ? data.items : [])
  .filter((i) => /^r\d+$/.test(String(i?.id ?? "")) && String(i?.headline ?? "").trim());

/**
 * { record, today }: the record with today's newly done headlines added
 * under `date`, and every headline the day's brief names, oldest id first.
 */
export function shippedFor(items, record, date) {
  const done = items.filter((i) => doneOn(i));
  if (!record) return { record: { earlier: done.map((i) => i.id) }, today: [] };
  const named = new Set(Object.values(record).flat());
  const fresh = done.filter((i) => !named.has(i.id)).map((i) => i.id);
  const ids = [...(record[date] ?? []), ...fresh];
  const next = fresh.length ? { ...record, [date]: ids } : record;
  const byId = new Map(done.map((i) => [i.id, i]));
  return { record: next, today: ids.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))) };
}

/** The headlines that moved to Done from `since` to `until`, days inclusive. */
export const shippedBetween = (items, since, until) => items
  .filter((i) => { const on = doneOn(i); return on && on >= since && on <= until; })
  .sort((a, b) => doneOn(a).localeCompare(doneOn(b)) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
