import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X, LayoutDashboard } from 'lucide-react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { arr, str, useSection, type AnyObj } from '@/lib/content';
import { btnPrimary } from './primitives';
import { cn } from '@/lib/utils';

export function BrandMark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-brand shadow-[0_8px_30px_-8px_var(--ph-indigo)]">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
          <circle cx="11" cy="11" r="4.2" fill="white" />
          <circle cx="21.5" cy="12.5" r="3.2" fill="white" fillOpacity=".75" />
          <path d="M4.5 25c.8-4.3 3.4-6.6 6.5-6.6s5.7 2.3 6.5 6.6" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M17.6 20.4c1.1-1.3 2.4-2 3.9-2 2.5 0 4.6 2 5.2 5.6" stroke="white" strokeOpacity=".75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">{name}</span>
    </span>
  );
}

export function useMe() {
  return useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false, staleTime: 30000 } });
}

function NavItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const [loc] = useLocation();
  const active = href === '/' ? loc === '/' : loc.startsWith(href.split('#')[0]) && href !== '#';
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn('relative rounded-full px-3.5 py-2 text-sm transition-colors', active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
      data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {active ? <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]" /> : null}
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const nav = useSection('nav');
  const brand = str(nav.brand, 'PeopleHub');
  const links = arr<AnyObj>(nav.links);
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
      <div className={cn('mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-4', scrolled || open ? 'glass-strong shadow-2xl shadow-black/40' : 'border border-transparent')}>
        <Link href="/" aria-label={`${brand} home`} data-testid="link-home">
          <BrandMark name={brand} />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {links.map((l, i) => <NavItem key={i} href={str(l.href, '/')} label={str(l.label)} />)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {signedIn ? (
            <Link href={appHref} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground hover:bg-white/5" data-testid="link-app">
              <LayoutDashboard className="h-4 w-4" /> {role === 'super_admin' ? 'Admin' : 'Dashboard'}
            </Link>
          ) : (
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-login">
              {str(nav.loginLabel, 'Log in')}
            </Link>
          )}
          <Link href="/register?mode=trial" className={cn(btnPrimary, 'px-5 py-2.5')} data-testid="link-cta-header">
            {str(nav.ctaLabel, 'Start free trial')} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 lg:hidden" aria-label="Toggle menu" aria-expanded={open} data-testid="button-menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-strong mx-auto mt-2 max-w-6xl rounded-2xl p-3 lg:hidden">
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((l, i) => (
                <Link key={i} href={str(l.href, '/')} className="rounded-xl px-4 py-3 text-base text-foreground/90 hover:bg-white/5" data-testid={`link-mobile-${i}`}>
                  {str(l.label)}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href={signedIn ? appHref : '/login'} className="rounded-full border border-white/15 px-4 py-3 text-center text-sm" data-testid="link-mobile-login">
                  {signedIn ? 'Open app' : str(nav.loginLabel, 'Log in')}
                </Link>
                <Link href="/register?mode=trial" className={cn(btnPrimary, 'py-3')} data-testid="link-mobile-cta">{str(nav.ctaLabel, 'Start free trial')}</Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  const footer = useSection('footer');
  const nav = useSection('nav');
  const contact = useSection('contact');
  const legal = useSection('legal');
  const brand = str(nav.brand, 'PeopleHub');
  const raw = arr<AnyObj>(footer.links);
  const grouped = raw.length && raw[0] && Array.isArray(raw[0].links);
  const groups: { title: string; links: AnyObj[] }[] = grouped
    ? raw.map((g) => ({ title: str(g.title ?? g.label), links: arr<AnyObj>(g.links) }))
    : [{ title: 'Explore', links: raw }];
  const legalLinks = Object.entries(legal as AnyObj).map(([k, v]) => ({ href: `/${k}`, label: str((v as AnyObj)?.title, k) }));
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-white/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ph-indigo)] to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandMark name={brand} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">{str(footer.description)}</p>
          <div className="mt-6 space-y-1 font-mono text-xs text-muted-foreground">
            {contact.email ? <a href={`mailto:${contact.email}`} className="block hover:text-foreground">{str(contact.email)}</a> : null}
            {contact.phone ? <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} className="block hover:text-foreground">{str(contact.phone)}</a> : null}
          </div>
        </div>
        {groups.map((g, gi) => (
          <div key={gi}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{g.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {g.links.map((l, i) => (
                <li key={i}><Link href={str(l.href, '/')} className="text-sm text-foreground/80 hover:text-foreground">{str(l.label)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        {legalLinks.length ? (
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Legal</h2>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-sm text-foreground/80 hover:text-foreground">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        {footer.complianceNote ? (
          <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed text-muted-foreground" data-testid="text-footer-compliance">
            {str(footer.complianceNote)}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
          <span>&copy; {year} {brand}</span>
          <span>Made for Indian MSMEs</span>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, [loc]);
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <motion.main id="main" key={loc} initial={hydrated ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }} className="flex-1">
        {children}
      </motion.main>
      <SiteFooter />
    </div>
  );
}
