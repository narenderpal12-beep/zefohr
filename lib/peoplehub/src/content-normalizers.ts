import type { Doc } from "./store";

const isRefundPolicyLink = (value: Doc) => {
  const href = typeof value.href === "string" ? value.href : "";
  const label = typeof value.label === "string" ? value.label : "";
  return /^\/refund-policy(?:[/?#]|$)/i.test(href) || /^refund policy$/i.test(label.trim());
};

/** Removes retired refund links from any footer link group without changing other edits. */
export function withoutRefundPolicyLinks(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !item || typeof item !== "object" || Array.isArray(item) || !isRefundPolicyLink(item as Doc))
      .map(withoutRefundPolicyLinks);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withoutRefundPolicyLinks(item)]));
}

/** Appends only seed records not already present, preserving all stored items and edits. */
export function appendMissingSamples(current: unknown, samples: Doc[]): Doc[] {
  const items = Array.isArray(current) ? current : [];
  const sampleIds = new Set(items.map((item) => item?.sampleId).filter((id): id is string => typeof id === "string"));
  return [...items, ...samples.filter((sample) => !sampleIds.has(sample.sampleId))];
}

/** Updates the old built-in navigation label while leaving admin-authored links intact. */
export function renameLegacyCaseStudyLinks(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(renameLegacyCaseStudyLinks);
  if (!value || typeof value !== "object") return value;
  const next = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renameLegacyCaseStudyLinks(item)]));
  if (next.href === "/case-studies" && next.label === "Case studies") next.label = "Use cases";
  return next;
}
