/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { BUILTIN_PAGE_PATHS, SECTION_TYPES, heroSliderDefaults, pageSectionsSchema, reservedPageSlug } from '@workspace/peoplehub-core/page-builder';
import { arr, str, type AnyObj } from './content';

export { BUILTIN_PAGE_PATHS, SECTION_TYPES, reservedPageSlug };
export type Block = { id: string; type: string; enabled: boolean; content: AnyObj };

/** Section type catalogue. `key` = the shared CMS section a native block reads from. */
export const TYPE_META: Record<string, { label: string; desc: string; key?: string }> = {
  original: { label: 'Original page content', desc: 'The built-in layout of this page. Edit its individual sections in Linked sections.' },
  hero: { label: 'Hero banner', desc: 'Large headline, description, two calls to action.', key: 'hero' },
  heroSlider: { label: 'Hero slider', desc: 'Rotating hero with up to 8 slides. Choose Split, Centered or Full-image layout.' },
  creativeSection: { label: 'Creative homepage section', desc: 'Reuse a section from the third homepage. Keep shared content or create a page-only copy.' },
  text: { label: 'Text block', desc: 'Heading, rich text (markdown) and an optional button.' },
  imageText: { label: 'Image and text', desc: 'Photo beside a heading, text and button.' },
  cards: { label: 'Cards grid', desc: 'A set of cards with icon, text and optional link.' },
  faq: { label: 'FAQ', desc: 'Questions and answers accordion.', key: 'faq' },
  cta: { label: 'Call to action band', desc: 'Bold closing band with a button.', key: 'cta' },
  stats: { label: 'Key numbers', desc: 'Animated counters.', key: 'stats' },
  clients: { label: 'Client logos', desc: 'Logo wall of customers.', key: 'clients' },
  suites: { label: 'Product suites', desc: 'Tabbed suites with photos.', key: 'suites' },
  services: { label: 'Services grid', desc: 'Service cards with photos.', key: 'services' },
  pricing: { label: 'Pricing plans', desc: 'Plans with monthly and annual toggle.', key: 'pricing' },
  contact: { label: 'Contact form', desc: 'Lead form with contact details.', key: 'contact' },
  ai: { label: 'AI capabilities', desc: 'Numbered list of AI features.', key: 'ai' },
  whyUs: { label: 'Why choose us', desc: 'Numbered reasons with compliance note.', key: 'whyUs' },
  integrations: { label: 'Integrations marquee', desc: 'Scrolling list of tools.', key: 'integrations' },
};

export const NATIVE_LABELS: Record<string, string> = {
  '/': 'Home', '/features': 'Features', '/services': 'Services', '/pricing': 'Pricing', '/about': 'About', '/about-us': 'About (alias /about-us)',
  '/contact': 'Contact', '/faq': 'FAQ', '/blog': 'Blog', '/media-coverage': 'Media coverage', '/case-studies': 'Case studies', '/careers': 'Careers',
  '/career': 'Careers (alias /career)', '/support': 'Support', '/our-support': 'Support (alias /our-support)', '/request-demo': 'Request a demo',
  '/request-for-demo': 'Request a demo (alias)', '/industries': 'Industries', '/solutions': 'Company size and roles',
  '/ai': 'AI capabilities', '/resources': 'Resources', '/integrations': 'Integrations', '/compliance': 'Compliance references',
  '/customer-stories': 'Customer stories',
  '/free-tools': 'Free HR tools',
};

/** Shared CMS sections each native route reads. */
export const ROUTE_KEYS: Record<string, string[]> = {
  '/': ['hero', 'preview', 'stats', 'clients', 'suites', 'services', 'ai', 'whyUs', 'integrations', 'pricing', 'faq', 'contact', 'cta'],
  '/features': ['suites', 'cta'], '/services': ['services', 'cta'], '/pricing': ['pricing', 'suites', 'faq', 'cta'],
  '/about': ['about', 'roadmap', 'whyUs', 'cta'], '/about-us': ['about', 'roadmap', 'whyUs', 'cta'], '/contact': ['contact'], '/faq': ['faq', 'cta'],
  '/blog': ['pages'], '/media-coverage': ['media', 'cta'], '/case-studies': ['caseStudies', 'cta'], '/careers': ['careers', 'cta'], '/career': ['careers', 'cta'],
  '/support': ['support', 'contact', 'cta'], '/our-support': ['support', 'contact', 'cta'], '/request-demo': ['demo', 'contact'], '/request-for-demo': ['demo', 'contact'],
  '/industries': ['industryHub', 'cta'], '/solutions': ['segments', 'cta'], '/ai': ['aiHub', 'cta'],
  '/resources': ['resourcesHub'], '/integrations': ['integrationMarketplace', 'cta'], '/compliance': ['complianceHub', 'cta'],
  '/customer-stories': ['customerStories', 'cta'], '/free-tools': ['freeTools'],
};
export function pagesUsingKey(key: string): string[] {
  return Object.entries(ROUTE_KEYS).filter(([, ks]) => ks.includes(key)).map(([p]) => NATIVE_LABELS[p] ?? p);
}

export type PageEntry = {
  id: string; kind: 'native' | 'feature' | 'service' | 'legal' | 'dynamic'; path: string; label: string;
  record?: AnyObj; index?: number; slug?: string;
};
export const cleanSlug = (s: unknown) => str(s).trim().replace(/^\/+|\/+$/g, '');
const BUILTIN = new Set<string>(BUILTIN_PAGE_PATHS as readonly string[]);
export const isNativePath = (path: string) => BUILTIN.has(path);

export function buildCatalogue(content: AnyObj | undefined, records: AnyObj[]): PageEntry[] {
  const c = content ?? {};
  const out: PageEntry[] = [];
  const recFor = (path: string) => records.find((r) => `/${cleanSlug(r.slug)}` === path);
  Object.keys(NATIVE_LABELS).forEach((p) => out.push({ id: `native:${p}`, kind: 'native', path: p, label: NATIVE_LABELS[p], record: recFor(p) }));
  arr<AnyObj>(c.suites?.items).forEach((s, i) => { if (str(s.slug)) out.push({ id: `feature:${str(s.slug)}`, kind: 'feature', path: `/features/${str(s.slug)}`, label: str(s.title, str(s.slug)), index: i }); });
  arr<AnyObj>(c.services?.items).forEach((s, i) => { if (str(s.slug)) out.push({ id: `service:${str(s.slug)}`, kind: 'service', path: `/services/${str(s.slug)}`, label: str(s.title, str(s.slug)), index: i }); });
  Object.entries((c.legal ?? {}) as AnyObj).forEach(([slug, l]) => out.push({ id: `legal:${slug}`, kind: 'legal', path: `/${slug}`, label: str((l as AnyObj)?.title, slug), slug, record: recFor(`/${slug}`) }));
  records.forEach((r) => {
    const path = `/${cleanSlug(r.slug)}`;
    if (out.some((e) => e.path === path && e.kind !== 'dynamic')) return;
    out.push({ id: `dyn:${str(r.id)}`, kind: 'dynamic', path, label: str(r.title, path), record: r });
  });
  return out;
}

/** Link options for menus: native, details, legal and published dynamic pages. */
export function linkOptions(content: AnyObj | undefined, publishedPages: AnyObj[]) {
  const c = content ?? {};
  const seen = new Set<string>();
  const g = (label: string, opts: { href: string; label: string }[]) => ({ label, options: opts.filter((o) => (seen.has(o.href) ? false : (seen.add(o.href), true))) });
  return [
    g('Website pages', Object.entries(NATIVE_LABELS).map(([href, label]) => ({ href, label }))),
    g('Your pages', publishedPages.filter((p) => !p.status || p.status === 'published').map((p) => ({ href: `/${cleanSlug(p.slug)}`, label: str(p.title, cleanSlug(p.slug)) }))),
    g('Feature details', arr<AnyObj>(c.suites?.items).filter((s) => str(s.slug)).map((s) => ({ href: `/features/${str(s.slug)}`, label: str(s.title) }))),
    g('Service details', arr<AnyObj>(c.services?.items).filter((s) => str(s.slug)).map((s) => ({ href: `/services/${str(s.slug)}`, label: str(s.title) }))),
    g('Industry solutions', arr<AnyObj>(c.industryHub?.items).filter((s) => str(s.slug)).map((s) => ({ href: `/industries/${str(s.slug)}`, label: str(s.title) }))),
    g('Company size and role', arr<AnyObj>(c.segments?.items).filter((s) => str(s.slug)).map((s) => ({ href: `/solutions/${str(s.slug)}`, label: str(s.title) }))),
    g('Published resources', arr<AnyObj>(c.resourcesHub?.items).filter((s) => str(s.slug) && s.status === 'published').map((s) => ({ href: `/resources/${str(s.slug)}`, label: str(s.title) }))),
    g('Free HR tools', [{ href: '/free-tools', label: str(c.freeTools?.title, 'Free HR tools') }]),
    g('Customer stories', arr<AnyObj>(c.customerStories?.items).filter((s) => str(s.slug) && s.status === 'published' && s.verified === true).map((s) => ({ href: `/customer-stories/${str(s.slug)}`, label: str(s.title) }))),
    g('Legal', Object.entries((c.legal ?? {}) as AnyObj).map(([slug, l]) => ({ href: `/${slug}`, label: str((l as AnyObj)?.title, slug) }))),
    g('Other', [{ href: '/register?mode=trial', label: 'Start free trial' }, { href: '/login', label: 'Log in' }]),
  ].filter((x) => x.options.length);
}

export const newBlockId = (type: string) => `${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const ORIGINAL: Block = { id: 'original', type: 'original', enabled: true, content: {} };

export function customTemplate(type: string): AnyObj {
  if (type === 'text') return { eyebrow: '', title: 'New section heading', body: 'Write your content here. Markdown works: **bold**, lists, and [links](/pricing). Keep it short and specific.', ctaLabel: '', ctaHref: '' };
  if (type === 'imageText') return { eyebrow: '', title: 'Heading beside the photo', body: 'Explain what this photo shows and why it matters to an MSME owner or HR manager. Two or three lines work best.', imageUrl: '', imageAlt: '', imageRight: true, ctaLabel: '', ctaHref: '' };
  if (type === 'cards') return { eyebrow: '', title: 'Cards heading', description: '', items: [{ title: 'First card', description: 'Short supporting line.', icon: 'Sparkles', href: '' }, { title: 'Second card', description: 'Short supporting line.', icon: 'ShieldCheck', href: '' }], ctaLabel: '', ctaHref: '' };
  if (type === 'heroSlider') return structuredClone(heroSliderDefaults) as AnyObj;
  if (type === 'creativeSection') return { section: 'hero' };
  return {};
}
/** Home's built-in sections, in the exact order HomePage renders them. Each reads shared CMS content (content {}). */
export const HOME_SECTION_TYPES = ['hero', 'stats', 'clients', 'suites', 'services', 'ai', 'whyUs', 'integrations', 'pricing', 'faq', 'contact', 'cta'] as const;
export const homeNativeBlocks = (enabled = true): Block[] => HOME_SECTION_TYPES.map((t) => ({ id: newBlockId(t), type: t, enabled, content: {} }));
/** Replace only the original block, in place, with Home's native blocks. Other blocks keep order, enabled and content. */
export function expandOriginal(list: Block[]): Block[] {
  return list.flatMap((b) => (b.type === 'original' ? homeNativeBlocks(b.enabled !== false) : [b]));
}
export const makeBlock = (type: string): Block => ({ id: newBlockId(type), type, enabled: true, content: customTemplate(type) });

export function validateSections(list: Block[], allowOriginal: boolean): string | null {
  if (!allowOriginal && list.some((b) => b.type === 'original')) return 'Your own pages cannot contain an original block.';
  if (list.filter((b) => b.type === 'original').length > 1) return 'Only one original content block is allowed per page.';
  const r = pageSectionsSchema.safeParse(list);
  if (!r.success) return r.error.issues[0]?.message ?? 'Sections are invalid.';
  return null;
}
export const sizeOf = (v: unknown) => new Blob([JSON.stringify(v ?? null)]).size;
export const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)}MB` : `${Math.ceil(n / 1024)}KB`);

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9/]+/g, '-').replace(/-+/g, '-').replace(/^[-/]+|[-/]+$/g, '');
export function validateSlug(slug: string, records: AnyObj[], selfId?: unknown): string | null {
  if (!slug) return 'Choose a path for this page.';
  if (slug.length > 200 || !/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug)) return 'Use lowercase words separated by dashes or slashes, e.g. payroll-for-factories.';
  if (reservedPageSlug(slug)) return 'That path belongs to a built-in page or system route. Choose another.';
  if (records.some((r) => cleanSlug(r.slug) === slug && String(r.id) !== String(selfId ?? ''))) return 'Another page already uses this path.';
  return null;
}

export const getIn = (o: any, p: (string | number)[]) => p.reduce((a, k) => (a == null ? undefined : a[k]), o);
export function setIn(o: any, p: (string | number)[], v: any): any {
  if (!p.length) return v;
  const c: any = Array.isArray(o) ? [...o] : { ...(o ?? {}) };
  c[p[0]] = setIn(c[p[0]], p.slice(1), v);
  return c;
}

/* ---------- unsaved-change registry ---------- */
const dirtySet = new Set<string>();
export const hasUnsaved = () => dirtySet.size > 0;
export function confirmLeave(msg = 'You have unsaved changes. Leave without saving?') {
  if (!dirtySet.size) return true;
  if (!window.confirm(msg)) return false;
  return true;
}
export function useUnsavedGuard(id: string, dirty: boolean) {
  useEffect(() => {
    if (dirty) dirtySet.add(id); else dirtySet.delete(id);
    return () => { dirtySet.delete(id); };
  }, [id, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}
