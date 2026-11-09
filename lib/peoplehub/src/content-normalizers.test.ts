import assert from "node:assert/strict";
import { test } from "node:test";
import { appendMissingSamples, renameLegacyCaseStudyLinks, withoutRefundPolicyLinks } from "./content-normalizers";
import { privacyDraft, sampleMediaItems, samplePosts, sampleUseCases, termsDraft } from "./sample-content";

test("removes refund-policy links from nested footer groups and keeps other links unchanged", () => {
  const source = {
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Refund policy", href: "/billing/refund-policy" },
      { label: "Refund", href: "/refund-policy?old=1" },
    ],
    columns: [{ title: "Company", links: [{ label: "Contact", href: "/contact" }, { label: "Old refund", href: "/refund-policy" }] }],
    copyright: "Keep this footer text",
  };
  const result = withoutRefundPolicyLinks(source) as typeof source;
  assert.deepEqual(result.links, [{ label: "Privacy policy", href: "/privacy-policy" }]);
  assert.deepEqual(result.columns[0].links, [{ label: "Contact", href: "/contact" }]);
  assert.equal(result.copyright, source.copyright);
  assert.equal(source.links.length, 3, "normalizing should not mutate stored content");
});

test("appends missing seeded records once without replacing edited or custom items", () => {
  const edited = { sampleId: sampleMediaItems[0].sampleId, title: "Admin's edited title" };
  const custom = { title: "A custom coverage item" };
  const once = appendMissingSamples([edited, custom], sampleMediaItems);
  const twice = appendMissingSamples(once, sampleMediaItems);
  assert.equal(once.length, 1 + 1 + sampleMediaItems.length - 1);
  assert.deepEqual(twice, once);
  assert.equal(once[0].title, edited.title);
  assert.equal(once[1], custom);
});

test("sample collection sizes and coverage labels are explicit", () => {
  assert.equal(samplePosts.length, 10);
  assert.equal(new Set(samplePosts.map((post) => post.slug)).size, 10);
  assert.equal(sampleMediaItems.length, 5);
  assert.ok(sampleMediaItems.every((item) => item.sample && item.publication.includes("not verified")));
  assert.equal(sampleUseCases.length, 6);
  assert.ok(sampleUseCases.every((item) => item.sample && item.body.includes("not a customer story")));
  assert.ok(samplePosts.every((post) => post.body_md.split(/\s+/).length > 100));
});

test("legal drafts include review notices and operator-specific placeholders", () => {
  assert.ok(privacyDraft.reviewNotice.includes("not legal advice"));
  assert.ok(privacyDraft.body.includes("[Insert full legal entity name"));
  assert.ok(privacyDraft.body.includes("[Insert monitored privacy email"));
  assert.ok(termsDraft.reviewNotice.includes("not legal advice"));
  assert.ok(termsDraft.body.includes("[Insert jurisdiction after legal review]"));
  assert.ok(termsDraft.body.includes("[Insert monitored legal contact]"));
});

test("renames only the old built-in case-study link", () => {
  const source = [
    { label: "Case studies", href: "/case-studies" },
    { label: "Case studies archive", href: "/case-studies/archive" },
    { label: "My case studies", href: "/custom" },
  ];
  assert.deepEqual(renameLegacyCaseStudyLinks(source), [
    { label: "Use cases", href: "/case-studies" },
    source[1],
    source[2],
  ]);
});
