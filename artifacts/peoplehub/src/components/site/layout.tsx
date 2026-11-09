import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Menu, X, LayoutDashboard, Moon, Sun, Instagram, Linkedin, Facebook, Twitter, Share2 } from 'lucide-react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { arr, iconFor, str, useSection, useThemeMode, type AnyObj } from '@/lib/content';
import { btnPrimary } from './primitives';
import { cn } from '@/lib/utils';
import { FaWhatsapp } from 'react-icons/fa';

/** Brand from CMS: brand section first, nav.brand for older content. */
export function useBrand() {
  const brand = useSection('brand');
  const nav = useSection('nav');
  return {
    name: str(brand.name || nav.brand, 'PeopleHub'),
    tagline: str(brand.tagline),
    logoUrl: str(brand.logoUrl),
    logoAlt: str(brand.logoAlt, 'PeopleHub logo'),
    logoMode: str(brand.logoMode, brand.logoUrl ? 'image' : 'mark'),
    showWordmark: brand.showWordmark !== false,
  };
}

export function BrandMark({ name, className, logoUrl, logoAlt, logoMode, showWordmark = true }: { name?: string; className?: string; logoUrl?: string; logoAlt?: string; logoMode?: string; showWordmark?: boolean }) {
  const b = useBrand();
  const n = name ?? b.name;
  const mode = logoMode ?? b.logoMode;
  const logo = mode === 'image' ? (logoUrl ?? b.logoUrl) : '';
  const alt = logoAlt ?? b.logoAlt;
  const word = name !== undefined ? showWordmark : b.showWordmark;
  return (
    <span className={cn('flex items-center gap-2.5', className)} data-testid="brand-mark">
      {logo ? (
        <img src={logo} alt={alt} className="h-9 w-auto max-w-[160px] object-contain" />
      ) : mode !== 'text' ? (
        <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-brand shadow-[0_8px_30px_-8px_var(--ph-indigo)]">
          <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
            <circle cx="11" cy="11" r="4.2" fill="var(--ph-on-brand)" />
            <circle cx="21.5" cy="12.5" r="3.2" fill="var(--ph-on-brand)" fillOpacity=".75" />
            <path d="M4.5 25c.8-4.3 3.4-6.6 6.5-6.6s5.7 2.3 6.5 6.6" stroke="var(--ph-on-brand)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M17.6 20.4c1.1-1.3 2.4-2 3.9-2 2.5 0 4.6 2 5.2 5.6" stroke="var(--ph-on-brand)" strokeOpacity=".75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      ) : null}
      {word || !logo ? <span className="brand-wordmark font-display text-xl font-bold tracking-tight text-foreground">{n}</span> : <span className="sr-only">{n}</span>}
    </span>
  );
}

export function ModeToggle({ className }: { className?: string }) {
  const { mode, toggle, canToggle } = useThemeMode();
  if (!canToggle) return null;
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" onClick={toggle} className={cn('grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-foreground/85 transition hover:bg-white/[0.06] hover:text-foreground', className)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`} data-testid="button-mode-toggle">
      {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function useMe() {
  return useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false, staleTime: 30000 } });
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type MegaItem = { label: string; href: string; groups: { title: string; links: AnyObj[] }[] };
function useMenu(): MegaItem[] {
  const nav = useSection('nav');
  const mega = arr<AnyObj>(nav.megaMenu);
  if (mega.length) {
    return mega.map((m) => ({
      label: str(m.label), href: str(m.href),
      groups: arr<AnyObj>(m.groups).map((g) => ({ title: str(g.title), links: arr<AnyObj>(g.links) })).filter((g) => g.links.length),
    }));
  }
  return arr<AnyObj>(nav.links).map((l) => ({ label: str(l.label), href: str(l.href, '/'), groups: [] }));
}

function isActive(loc: string, href: string) {
  if (!href || href === '#') return false;
  return href === '/' ? loc === '/' : loc.startsWith(href.split('#')[0]);
}

function MegaPanel({ item, open, id, onNavigate }: { item: MegaItem; open: boolean; id: string; onNavigate: () => void }) {
  const cols = Math.min(item.groups.length, 4);
  return (
    <div id={id} className="mega-panel absolute left-1/2 top-full z-50 w-max max-w-[min(92vw,1040px)] -translate-x-1/2 pt-3" data-open={open ? 'true' : 'false'}>
      <div className="glass-strong rounded-2xl p-5 shadow-2xl shadow-black/30">
        <div className="grid gap-x-6 gap-y-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(210px, 1fr))` }}>
          {item.groups.map((g, gi) => (
            <div key={gi}>
              <p className="px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ph-pink)]">{g.title}</p>
              <ul className="mt-2 space-y-0.5">
                {g.links.map((l, li) => {
                  const I = iconFor(str(l.icon));
                  return (
                    <li key={li}>
                      <Link href={str(l.href, '/')} onClick={onNavigate} tabIndex={open ? 0 : -1} className="group flex gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none" data-testid={`link-mega-${slugify(str(l.label))}`}>
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]"><I className="h-4 w-4 text-[color:var(--ph-cyan)]" /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{str(l.label)}</span>
                          {l.description ? <span className="mt-0.5 block max-w-[240px] text-xs leading-snug text-muted-foreground">{str(l.description)}</span> : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {item.href ? (
          <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
            <Link href={item.href} onClick={onNavigate} tabIndex={open ? 0 : -1} className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--ph-cyan)]" data-testid={`link-mega-all-${slugify(item.label)}`}>View all {item.label.toLowerCase()} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DesktopNav({ items }: { items: MegaItem[] }) {
  const [loc] = useLocation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setOpenIdx(null), [loc]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenIdx(null); };
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpenIdx(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, []);
  const enter = (i: number) => { if (timer.current) clearTimeout(timer.current); setOpenIdx(i); };
  const leave = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpenIdx(null), 160); };
  return (
    <nav ref={ref} aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
      {items.map((it, i) => {
        const active = isActive(loc, it.href);
        if (!it.groups.length) {
          return (
            <Link key={i} href={it.href || '/'} className={cn('relative rounded-full px-3.5 py-2 text-sm transition-colors', active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')} data-testid={`link-nav-${slugify(it.label)}`}>
              {active ? <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]" /> : null}
              {it.label}
            </Link>
          );
        }
        const open = openIdx === i;
        const id = `mega-${slugify(it.label)}`;
        return (
          <div key={i} className="relative" onMouseEnter={() => enter(i)} onMouseLeave={leave}>
            <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpenIdx(open ? null : i)}
              onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpenIdx(i); setTimeout(() => (document.querySelector(`#${id} a`) as HTMLElement | null)?.focus(), 30); } }}
              className={cn('inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition-colors', open || active ? 'bg-white/[0.07] text-foreground' : 'text-muted-foreground hover:text-foreground')} data-testid={`button-nav-${slugify(it.label)}`}>
              {it.label}<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
            </button>
            <MegaPanel item={it} open={open} id={id} onNavigate={() => setOpenIdx(null)} />
          </div>
        );
      })}
    </nav>
  );
}

function MobileNav({ items }: { items: MegaItem[] }) {
  const [openTop, setOpenTop] = useState<number | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  return (
    <div className="flex flex-col">
      {items.map((it, i) => it.groups.length ? (
        <div key={i} className="border-b border-white/[0.06] last:border-0">
          <button type="button" onClick={() => setOpenTop(openTop === i ? null : i)} aria-expanded={openTop === i} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base text-foreground" data-testid={`button-mobile-nav-${slugify(it.label)}`}>
            {it.label}<ChevronDown className={cn('h-4 w-4 transition-transform', openTop === i && 'rotate-180')} />
          </button>
          {openTop === i ? (
            <div className="pb-2 pl-3">
              {it.groups.map((g, gi) => {
                const k = `${i}-${gi}`;
                return (
                  <div key={gi}>
                    <button type="button" onClick={() => setOpenGroup(openGroup === k ? null : k)} aria-expanded={openGroup === k} className="flex w-full items-center justify-between px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--ph-pink)]" data-testid={`button-mobile-group-${k}`}>
                      {g.title}<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openGroup === k && 'rotate-180')} />
                    </button>
                    {openGroup === k ? (
                      <ul className="pb-1">
                        {g.links.map((l, li) => <li key={li}><Link href={str(l.href, '/')} className="block rounded-lg px-6 py-2 text-sm text-foreground/85 hover:bg-white/5" data-testid={`link-mobile-${slugify(str(l.label))}`}>{str(l.label)}</Link></li>)}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
              {it.href ? <Link href={it.href} className="block px-4 py-2 text-sm text-[color:var(--ph-cyan)]">View all {it.label.toLowerCase()}</Link> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <Link key={i} href={it.href || '/'} className="rounded-xl px-4 py-3 text-base text-foreground/90 hover:bg-white/5" data-testid={`link-mobile-${i}`}>{it.label}</Link>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const nav = useSection('nav');
  const brand = useBrand();
  const items = useMenu();
  const me = useMe();
  const signedIn = !!me.data && !me.isError;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loc] = useLocation();
  useEffect(() => setOpen(false), [loc]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const role = str((me.data?.user as AnyObj | undefined)?.role);
  const appHref = role === 'super_admin' ? '/admin' : '/dashboard';

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className={cn('mx-auto flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-4', scrolled || open ? 'glass-strong shadow-2xl shadow-black/20' : 'border border-transparent')} style={{ maxWidth: 'var(--ph-container-max, 72rem)' }}>
        <Link href="/" aria-label={`${brand.name} home`} data-testid="link-home"><BrandMark /></Link>
        <DesktopNav items={items} />
        <div className="hidden items-center gap-2 lg:flex">
          <ModeToggle />
          {signedIn ? (
            <Link href={appHref} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground hover:bg-white/5" data-testid="link-app">
              <LayoutDashboard className="h-4 w-4" /> {role === 'super_admin' ? 'Admin' : 'Dashboard'}
            </Link>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-login">{str(nav.loginLabel, 'Log in')}</Link>
          )}
          <Link href="/register?mode=trial" className={cn(btnPrimary, 'px-5 py-2.5')} data-testid="link-cta-header">
            {str(nav.ctaLabel, 'Start free trial')} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ModeToggle />
          <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10" aria-label="Toggle menu" aria-expanded={open} data-testid="button-menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-strong scrollbar-thin mx-auto mt-2 max-h-[calc(100dvh-6rem)] w-full overflow-y-auto rounded-2xl p-3 lg:hidden" style={{ maxWidth: 'var(--ph-container-max, 72rem)' }}>
            <nav aria-label="Mobile">
              <MobileNav items={items} />
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href={signedIn ? appHref : '/login'} className="rounded-full border border-white/15 px-4 py-3 text-center text-sm" data-testid="link-mobile-login">{signedIn ? 'Open app' : str(nav.loginLabel, 'Log in')}</Link>
                <Link href="/register?mode=trial" className={cn(btnPrimary, 'py-3')} data-testid="link-mobile-cta">{str(nav.ctaLabel, 'Start free trial')}</Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

const SOCIAL_ICONS = { instagram: Instagram, linkedin: Linkedin, facebook: Facebook, twitter: Twitter, x: Twitter } as const;
const validUrl = (u: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u);

export function SocialLinks() {
  const footer = useSection('footer');
  const socials = arr<AnyObj>(footer.socials).filter((s) => s.enabled !== false);
  const unavailable = str(footer.socialUnavailableMessage, 'Profile coming soon');
  if (!socials.length) return null;
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media">
      {socials.map((s, i) => {
        const key = str(s.platform).toLowerCase() as keyof typeof SOCIAL_ICONS;
        const I = SOCIAL_ICONS[key] ?? Share2;
        const label = str(s.label, key);
        const url = str(s.url).trim();
        const base = 'grid h-10 w-10 place-items-center rounded-xl border border-white/10 transition';
        return (
          <li key={i}>
            {validUrl(url) ? (
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={cn(base, 'text-foreground/80 hover:border-[color:var(--ph-indigo)] hover:text-foreground')} data-testid={`link-social-${key}`}><I className="h-4 w-4" /></a>
            ) : (
              <span role="img" aria-label={`${label}: ${unavailable}`} title={`${label}: ${unavailable}`} className={cn(base, 'cursor-not-allowed text-muted-foreground/50')} data-testid={`status-social-${key}-unavailable`}><I className="h-4 w-4" /></span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SiteFooter() {
  const footer = useSection('footer');
  const contact = useSection('contact');
  const legal = useSection('legal');
  const brand = useBrand();
  const cols = arr<AnyObj>(footer.columns);
  const raw = arr<AnyObj>(footer.links);
  const bottomLinks = cols.length ? raw.filter(l => !Array.isArray(l.links)) : [];
  const groups: { title: string; links: AnyObj[] }[] = cols.length
    ? cols.map((g) => ({ title: str(g.title), links: arr<AnyObj>(g.links) }))
    : raw.length && raw[0] && Array.isArray(raw[0].links)
      ? raw.map((g) => ({ title: str(g.title ?? g.label), links: arr<AnyObj>(g.links) }))
      : raw.length ? [{ title: 'Explore', links: raw }] : [];
  const legalLinks = Object.entries(legal as AnyObj).map(([k, v]) => ({ href: `/${k}`, label: str((v as AnyObj)?.title, k) }));
  const year = new Date().getFullYear();
  const copyright = str(footer.copyright);
  return (
    <footer className="relative mt-24 border-t border-white/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ph-indigo)] to-transparent" />
      <div className="mx-auto w-full px-5 py-16 sm:px-8" style={{ maxWidth: 'var(--ph-container-max, 72rem)' }}>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2.8fr]">
          <div>
            <BrandMark />
            {brand.tagline ? <p className="mt-4 font-display text-lg font-semibold text-foreground/90">{brand.tagline}</p> : null}
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{str(footer.description)}</p>
            <div className="mt-6 space-y-1 font-mono text-xs text-muted-foreground">
              {contact.email ? <a href={`mailto:${contact.email}`} className="block hover:text-foreground">{str(contact.email)}</a> : null}
              {contact.phone ? <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} className="block hover:text-foreground">{str(contact.phone)}</a> : null}
              {contact.address ? <address className="max-w-xs whitespace-pre-line break-words not-italic" data-testid="text-footer-address">{contact.mapUrl ? <a href={str(contact.mapUrl)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{str(contact.address)}</a> : str(contact.address)}</address> : null}
              {contact.officeHours ? <p className="whitespace-pre-line">{str(contact.officeHours)}</p> : null}
            </div>
            <SocialLinks />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 xl:grid-cols-4">
            {groups.map((g, gi) => (
              <div key={gi}>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{g.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map((l, i) => <li key={i}><Link href={str(l.href, '/')} className="text-sm text-foreground/80 hover:text-foreground" data-testid={`link-footer-${slugify(str(l.label))}`}>{str(l.label)}</Link></li>)}
                </ul>
              </div>
            ))}
            {legalLinks.length ? (
              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Legal</h2>
                <ul className="mt-4 space-y-2.5">
                  {legalLinks.map((l) => <li key={l.href}><Link href={l.href} className="text-sm text-foreground/80 hover:text-foreground">{l.label}</Link></li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full px-5 pb-10 sm:px-8" style={{ maxWidth: 'var(--ph-container-max, 72rem)' }}>
        {footer.complianceNote ? (
          <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed text-muted-foreground" data-testid="text-footer-compliance">{str(footer.complianceNote)}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
          <span data-testid="text-copyright">{copyright ? copyright.replace(/\{year\}/g, String(year)) : `\u00A9 ${year} ${brand.name}`}</span>
          <div className="flex flex-wrap items-center gap-5">
            {bottomLinks.map((link, i) => <Link key={i} href={str(link.href, '/')} className="hover:text-foreground" data-testid={`link-footer-bottom-${i}`}>{str(link.label)}</Link>)}
            <Link href="/login" className="hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" data-testid="link-footer-admin-panel">{str(footer.adminLoginLabel, 'Admin Panel')}</Link>
            <span>Made for Indian MSMEs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppButton() {
  const w = useSection('whatsapp');
  if (w.enabled === false) return null;
  const digits = str(w.phone).replace(/[^\d]/g, '');
  const valid = digits.length >= 10 && digits.length <= 15;
  const label = valid ? str(w.label, 'Chat on WhatsApp') : str(w.unconfiguredLabel, 'Contact our team');
  const cls = 'whatsapp-float group fixed bottom-5 right-5 z-[55] flex items-center gap-2 rounded-full bg-[#1f9d55] py-3 pl-3 pr-4 text-sm font-semibold text-on-brand shadow-[0_16px_40px_-12px_rgba(16,90,50,.7)] transition hover:-translate-y-0.5 sm:bottom-7 sm:right-7';
  const inner = (
    <>
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/15"><span className="wa-pulse absolute inset-0 rounded-full bg-white/30" /><FaWhatsapp className="relative h-5 w-5" aria-hidden="true" /></span>
      <span className="hidden sm:inline">{label}</span>
    </>
  );
  if (valid) {
    const href = `https://wa.me/${digits}${w.message ? `?text=${encodeURIComponent(str(w.message))}` : ''}`;
    return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls} data-testid="link-whatsapp">{inner}</a>;
  }
  return <Link href={str(w.fallbackHref, '/contact')} aria-label={label} className={cls} data-testid="link-whatsapp-fallback">{inner}</Link>;
}

export function PublicShell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.scrollTo({ top: 0 }); }, [loc]);
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <motion.main id="main" key={loc} initial={hydrated ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }} className="flex-1">
        {children}
      </motion.main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
