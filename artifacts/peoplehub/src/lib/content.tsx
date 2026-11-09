/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { normMode, themeVars, type Mode } from './theme';
import {
  useGetContent,
  useGetPages,
  useGetPosts,
  getGetContentQueryKey,
  getGetPagesQueryKey,
  getGetPostsQueryKey,
} from '@workspace/api-client-react';
import {
  Users, Clock, Wallet, Search, Target, HeartHandshake, GraduationCap, Building2, ShieldCheck,
  Briefcase, Scale, Globe2, HardHat, Headphones, UserSearch, BadgeCheck, BookOpen, HeartPulse,
  LineChart, Bot, FileText, AlertTriangle, TrendingUp, MessageCircle, Network, Plug, Sparkles,
  Zap, Layers, Smartphone, Fingerprint, Calendar, Award, Brain, type LucideIcon,
} from 'lucide-react';

export type AnyObj = Record<string, any>;

/** Shape of the SSR bootstrap (window.__INITIAL_DATA__). */
export interface Bootstrap {
  content?: AnyObj;
  pages?: AnyObj[];
  posts?: AnyObj[];
  seo?: AnyObj;
  path?: string;
  status?: number;
  /** Visitor override read from the peoplehub_mode cookie during SSR. */
  mode?: 'light' | 'dark';
}

const BootCtx = createContext<Bootstrap | undefined>(undefined);
export const BootstrapProvider = ({ value, children }: { value?: Bootstrap; children: ReactNode }) => (
  <BootCtx.Provider value={value}>{children}</BootCtx.Provider>
);

export function readWindowBootstrap(): Bootstrap | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).__INITIAL_DATA__ as Bootstrap | undefined;
}

const ContentCtx = createContext<AnyObj | undefined>(undefined);

/** Fetches live CMS content, seeded with SSR bootstrap so hydration matches. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const boot = useContext(BootCtx);
  const { data } = useGetContent({
    query: {
      queryKey: getGetContentQueryKey(),
      initialData: boot?.content as any,
      refetchInterval: 5000,
      staleTime: 2000,
    },
  });
  return <ContentCtx.Provider value={data as AnyObj | undefined}>{children}</ContentCtx.Provider>;
}

/** Overrides only the given section keys for descendants; every other key still comes from the live content. */
export function ContentOverrideProvider({ overrides, children }: { overrides: AnyObj; children: ReactNode }) {
  const parent = useContext(ContentCtx);
  const value = useMemo(() => ({ ...(parent ?? {}), ...overrides }), [parent, overrides]);
  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}

export function useContent(): AnyObj | undefined {
  return useContext(ContentCtx);
}
export function useSection<T = AnyObj>(key: string): T {
  const c = useContext(ContentCtx);
  return ((c && c[key]) || {}) as T;
}

export function usePublicPages(): { pages: AnyObj[]; loaded: boolean } {
  const boot = useContext(BootCtx);
  const q = useGetPages({
    query: { queryKey: getGetPagesQueryKey(), initialData: boot?.pages as any, refetchInterval: 30000 },
  });
  return { pages: (q.data as AnyObj[] | undefined) ?? [], loaded: q.data !== undefined || q.isError };
}
export function usePublicPosts(): { posts: AnyObj[]; loaded: boolean; error: boolean; refetch: () => void } {
  const boot = useContext(BootCtx);
  const q = useGetPosts({
    query: { queryKey: getGetPostsQueryKey(), initialData: boot?.posts as any, refetchInterval: 30000 },
  });
  return {
    posts: (q.data as AnyObj[] | undefined) ?? [],
    loaded: q.data !== undefined || q.isError,
    error: q.isError,
    refetch: () => void q.refetch(),
  };
}

export const ICONS: Record<string, LucideIcon> = {
  Users, Clock, Wallet, Search, Target, HeartHandshake, GraduationCap, Building2, ShieldCheck,
  Briefcase, Scale, Globe2, HardHat, Headphones, UserSearch, BadgeCheck, BookOpen, HeartPulse,
  LineChart, Bot, FileText, AlertTriangle, TrendingUp, MessageCircle, Network, Plug, Sparkles,
  Zap, Layers, Smartphone, Fingerprint, Calendar, Award, Brain,
};
export function iconFor(name?: string, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!name) return fallback;
  const key = Object.keys(ICONS).find((k) => k.toLowerCase() === String(name).toLowerCase().replace(/[-_\s]/g, ''));
  return (key && ICONS[key]) || ICONS[name] || fallback;
}

export const arr = <T = any,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
export const str = (v: unknown, d = ''): string => (v === null || v === undefined ? d : String(v));

export function themeStyle(theme: AnyObj | undefined, mode: Mode): CSSProperties {
  return themeVars(theme, mode) as CSSProperties;
}

interface ModeCtxV { mode: Mode; canToggle: boolean; toggle: () => void; setMode: (m: Mode) => void }
const ModeCtx = createContext<ModeCtxV>({ mode: 'dark', canToggle: false, toggle: () => {}, setMode: () => {} });
export const useThemeMode = () => useContext(ModeCtx);

/** Resolves light/dark: explicit visitor cookie override first, then admin defaultMode. Same result on SSR and first client render. */
export function ModeProvider({ children }: { children: (mode: Mode, style: CSSProperties) => ReactNode }) {
  const boot = useContext(BootCtx);
  const c = useContext(ContentCtx);
  const theme = (c?.theme ?? {}) as AnyObj;
  const canToggle = theme.allowModeToggle !== false;
  const [override, setOverride] = useState<Mode | undefined>(() => normMode(boot?.mode));
  const mode: Mode = (canToggle ? override : undefined) ?? normMode(theme.defaultMode) ?? 'dark';
  const setMode = useCallback((m: Mode) => {
    setOverride(m);
    if (typeof document !== 'undefined') document.cookie = `peoplehub_mode=${m}; path=/; max-age=31536000; samesite=lax`;
    try { window.localStorage.setItem('peoplehub_mode', m); } catch { /* storage unavailable */ }
  }, []);
  const toggle = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode]);
  const style = useMemo(() => themeStyle(theme, mode), [theme, mode]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    root.style.colorScheme = mode;
    Object.entries(style as Record<string, string>).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [mode, style]);
  const v = useMemo(() => ({ mode, canToggle, toggle, setMode }), [mode, canToggle, toggle, setMode]);
  return <ModeCtx.Provider value={v}>{children(mode, style)}</ModeCtx.Provider>;
}

/** CTA values in CMS may be a string label or {label, href}. */
export function cta(v: unknown, fallbackHref: string): { label: string; href: string } {
  if (v && typeof v === 'object') {
    const o = v as AnyObj;
    return { label: str(o.label ?? o.text), href: str(o.href ?? o.url, fallbackHref) };
  }
  return { label: str(v), href: fallbackHref };
}

export function formatINR(v: unknown): string {
  if (typeof v === 'number') return `\u20B9${v.toLocaleString('en-IN')}`;
  const s = str(v);
  if (/^\d+(\.\d+)?$/.test(s)) return `\u20B9${Number(s).toLocaleString('en-IN')}`;
  return s;
}

export function errMsg(e: unknown, d = 'Something went wrong. Please try again.'): string {
  const anyE = e as AnyObj | null;
  const data = anyE?.data as AnyObj | null | undefined;
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error === 'object' && data.error.message) return String(data.error.message);
    if (typeof data.message === 'string') return data.message;
  }
  if (anyE?.message) return String(anyE.message);
  return d;
}
export const errStatus = (e: unknown): number | undefined => (e as AnyObj | null)?.status;
