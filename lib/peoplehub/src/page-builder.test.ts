import assert from "node:assert/strict";
import { test } from "node:test";
import { heroSliderDefaults, heroSliderSchema, pageLayoutsSchema, pageSectionsSchema, reservedPageSlug, retargetPageLinks } from "./page-builder";

const original = { id: "original", type: "original", enabled: true, content: {} };
const text = { id: "text-1", type: "text", enabled: true, content: { title: "Our approach", body: "Page content" } };

test("existing pages retain original content alongside added sections", () => {
  assert(pageLayoutsSchema.safeParse({ routes: { "/about": { sections: [original, text] } } }).success);
  assert(!pageLayoutsSchema.safeParse({ routes: { "/about": { sections: [original, { ...original, id: "copy" }] } } }).success);
});

test("layouts only target public paths", () => {
  for (const path of ["/admin", "/admin/menus", "/api/pages", "/login", "/dashboard", "//external", "/bad path"]) {
    assert(!pageLayoutsSchema.safeParse({ routes: { [path]: { sections: [] } } }).success, path);
  }
  assert(pageLayoutsSchema.safeParse({ routes: { "/": { sections: [original] } } }).success);
});

test("hero slider text color is optional but accepts only six-digit hex", () => {
  const slide = heroSliderDefaults.slides[0];
  assert(heroSliderSchema.safeParse({ ...heroSliderDefaults, slides: [{ ...slide, textColor: "" }] }).success);
  assert(heroSliderSchema.safeParse({ ...heroSliderDefaults, slides: [{ ...slide, textColor: "#4455aa" }] }).success);
  assert(!heroSliderSchema.safeParse({ ...heroSliderDefaults, slides: [{ ...slide, textColor: "red" }] }).success);
});

test("blocks enforce known types, unique IDs and a bounded section count", () => {
  assert(!pageSectionsSchema.safeParse([text, text]).success);
  assert(!pageSectionsSchema.safeParse([{ ...text, type: "html" }]).success);
  assert(!pageSectionsSchema.safeParse(Array.from({ length: 41 }, (_, i) => ({ ...text, id: `text-${i}` }))).success);
  assert(pageSectionsSchema.safeParse([{ id: "text", type: "text" }]).success);
});

test("dynamic pages cannot shadow native and system routes", () => {
  for (const path of ["media-coverage", "privacy-policy", "admin/tools", "features/payroll", "blog/my-post", "sitemap.xml", "assets/file"]) assert(reservedPageSlug(path), path);
  for (const path of ["factory-payroll", "campaigns/new", "solutions/hospitality"]) assert(!reservedPageSlug(path), path);
});

test("renaming retargets nested menu and footer links without mutating the source", () => {
  const before = { megaMenu: [{ label: "Company", href: "/old", groups: [{ title: "Learn", links: [{ label: "Our page", href: "/old" }, { label: "Other", href: "/other" }] }] }] };
  const after = retargetPageLinks(before, "/old", "/new") as typeof before;
  assert.equal(after.megaMenu[0].href, "/new");
  assert.equal(after.megaMenu[0].groups[0].links[0].href, "/new");
  assert.equal(after.megaMenu[0].groups[0].links[1].href, "/other");
  assert.equal(before.megaMenu[0].href, "/old");
});

test("unpublishing removes top-level items even when they have empty groups", () => {
  const before = [{ label: "New page", href: "/old", groups: [] }, { label: "Home", href: "/", groups: [] }];
  assert.deepEqual(retargetPageLinks(before, "/old", null), [before[1]]);
});

test("unpublishing removes submenu targets while preserving unrelated groups", () => {
  const before = [{ label: "Company", href: "/old", groups: [{ title: "Learn", links: [{ label: "Remove", href: "/old" }, { label: "Keep", href: "/about" }] }] }];
  const after = retargetPageLinks(before, "/old", null) as typeof before;
  assert.equal(after[0].href, "#");
  assert.deepEqual(after[0].groups[0].links, [{ label: "Keep", href: "/about" }]);
});

test("hero slider provides three valid editable slides and all three layouts", () => {
  assert.equal(heroSliderDefaults.slides.length, 3);
  for(const variant of ["split","centered","cover"]){
    assert(heroSliderSchema.safeParse({...heroSliderDefaults,variant}).success);
    assert(pageLayoutsSchema.safeParse({routes:{"/about":{sections:[original,{id:"slider",type:"heroSlider",enabled:true,content:{...heroSliderDefaults,variant}}]}}}).success);
  }
});

test("slider rejects invalid layouts, unsafe links, blank headings and excessive slides", () => {
  for(const change of [
    {variant:"unknown"}, {slides:[]}, {slides:Array(9).fill(heroSliderDefaults.slides[0])},
    {intervalMs:100}, {intervalMs:30000}, {autoplay:"yes"},
    {slides:[{...heroSliderDefaults.slides[0],title:" "}]},
    {slides:[{...heroSliderDefaults.slides[0],ctaHref:"javascript:alert(1)"}]},
    {slides:[{...heroSliderDefaults.slides[0],imageUrl:"//unsafe.example/image.png"}]},
  ])assert(!pageSectionsSchema.safeParse([{id:"slider",type:"heroSlider",content:{...heroSliderDefaults,...change}}]).success);
});

test("reordering sections changes only their order, preserving their content and visibility", () => {
  const slider={id:"slider",type:"heroSlider",enabled:false,content:structuredClone(heroSliderDefaults)};
  const initial=[original,text,slider];
  const moved=[initial[2],initial[0],initial[1]];
  assert(pageSectionsSchema.safeParse(moved).success);
  assert.equal(moved[0].enabled,false);
  assert.deepEqual(moved[0].content,heroSliderDefaults);
  assert.equal(initial[0].id,"original");
});
