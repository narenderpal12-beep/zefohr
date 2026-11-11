import { lazy, Suspense, useState, useEffect, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResolveSeo, getResolveSeoQueryKey } from '@workspace/api-client-react';
import { BootstrapProvider, ContentProvider, ModeProvider, arr, str, useSection, type AnyObj, type Bootstrap } from '@/lib/content';
import { PageBlocks } from '@/components/site/page-blocks';
import { PublicShell } from '@/components/site/layout';
import {
  AboutPage, BlogPage, BlogPostPage, ContactPage, DynamicPage, FaqPage, FeatureDetailPage, FeaturesPage, HomePage, NotFoundPage,
  PricingPage, ServiceDetailPage, ServicesPage, SolutionPage,
} from '@/pages/public';
import { CareersPage, CaseStudiesPage, CaseStudyDetailPage, DemoPage, MediaPage, SupportPage } from '@/pages/company';
import {
  AiHubPage, CompliancePage, CustomerStoriesPage, CustomerStoryDetailPage, IndustriesPage, IndustryDetailPage,
  IntegrationsPage, ResourceDetailPage, ResourcesPage, SegmentDetailPage, SegmentsPage,
} from '@/pages/hubs';
import { FreeToolsPage } from '@/pages/free-tools';
import { siteContainerMaxWidth } from '@/lib/theme';
import { trackEvent } from '@/lib/analytics';
import { LoginPage, RegisterPage } from '@/pages/auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
const DashboardPage=lazy(()=>import('@/pages/dashboard').then(m=>({default:m.DashboardPage})));
const AdminPage=lazy(()=>import('@/pages/admin').then(m=>({default:m.AdminPage})));
function PrivateRoute({admin=false}:{admin?:boolean}){
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const fallback=<main className="min-h-screen grid place-items-center"><p role="status">Loading your workspace…</p></main>;
  return mounted?<Suspense fallback={fallback}>{admin?<AdminPage/>:<DashboardPage/>}</Suspense>:fallback;
}

/** Keeps document head in sync on client-side navigation (SSR handles the initial head). */
function SeoSync() {
  const [path] = useLocation();
  const q = useResolveSeo({ path }, { query: { queryKey: getResolveSeoQueryKey({ path }), staleTime: 60000, retry: false } });
  useEffect(() => {
    const s = q.data as AnyObj | undefined;
    if (!s) return;
    if (s.title) document.title = str(s.full_title ?? s.title);
    const set = (name: string, val: unknown, attr = 'name') => {
      if (!val) return;
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', String(val));
    };
    set('description', s.meta_description);
    set('robots', s.robots);
    set('og:title', s.og_title ?? s.title, 'property');
    set('og:description', s.og_description ?? s.meta_description, 'property');
    set('og:image', s.og_image_url, 'property');
    set('og:url', s.canonical_url, 'property');
    set('twitter:title', s.og_title ?? s.title);
    set('twitter:description', s.og_description ?? s.meta_description);
    set('twitter:image', s.og_image_url);
    set('twitter:card', s.twitter_card ?? 'summary_large_image');
    set('og:type', s.page_type === 'blog' ? 'article' : 'website', 'property');
    set('og:site_name', s.settings?.site_name, 'property');
    let canonical=document.head.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.setAttribute('rel','canonical');document.head.appendChild(canonical);}
    canonical.setAttribute('href',str(s.canonical_url));
    const ld=document.head.querySelector('script[type="application/ld+json"]');
    if(ld&&s.jsonld)ld.textContent=JSON.stringify(s.jsonld);
  }, [q.data]);
  return null;
}

/** Small analytics layer: records only public-page identifiers and never form values. */
function AnalyticsObserver() {
  const [path] = useLocation();
  const publicPath = !/^\/(admin|dashboard|login|register)(\/|$)/.test(path);

  useEffect(() => {
    if (publicPath) trackEvent('page_view', { page_path: path });
  }, [path, publicPath]);

  useEffect(() => {
    if (!publicPath) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest<HTMLElement>('[data-analytics-event], [role="tab"]');
      if (!control) return;
      if (control.getAttribute('role') === 'tab') {
        trackEvent('tab_changed', { tab_id: control.dataset.analyticsId ?? control.dataset.testid ?? 'tab' });
        return;
      }
      const eventName = control.dataset.analyticsEvent;
      if (eventName !== 'cta_click') return;
      const rawHref = control instanceof HTMLAnchorElement ? control.getAttribute('href') : null;
      let destination = '';
      if (rawHref) {
        try { destination = new URL(rawHref, window.location.origin).pathname.slice(0, 240); } catch { /* Ignore malformed links. */ }
      }
      trackEvent('cta_click', { cta_id: control.dataset.analyticsId ?? 'cta', destination });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [publicPath]);

  useEffect(() => {
    if (!publicPath) return;
    const sent = new Set<number>();
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const threshold of [25, 50, 75, 100]) {
        if (depth >= threshold && !sent.has(threshold)) {
          sent.add(threshold);
          trackEvent('scroll_depth', { depth_percent: threshold, page_path: path });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [path, publicPath]);

  return null;
}

function ThemeRoot({ children }: { children: ReactNode }) {
  const theme = useSection('theme');
  return (
    <ModeProvider>
      {(mode, style) => <div className={`${mode} grain min-h-[100dvh] bg-[color:var(--ph-bg)] text-foreground`} data-theme-mode={mode} style={{ ...style, '--ph-container-max': siteContainerMaxWidth(theme) } as CSSProperties}>
        <svg width="0" height="0" aria-hidden="true" focusable="false" className="pointer-events-none absolute overflow-hidden">
          <defs>
            <linearGradient id="peoplehub-icon-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="var(--ph-indigo)" />
              <stop offset="50%" stopColor="var(--ph-cyan)" />
              <stop offset="100%" stopColor="var(--ph-pink)" />
            </linearGradient>
          </defs>
        </svg>
        {children}
      </div>}
    </ModeProvider>
  );
}

/** Applies a saved per-route layout. The original block renders C directly, so there is no recursive wrapping. */
function RouteLayout({ C }: { C: () => ReactElement | null }) {
  const [loc] = useLocation();
  const layouts = useSection('pageLayouts') as AnyObj;
  const homepage = useSection('homepage') as AnyObj;
  const path = `/${loc.split('?')[0].replace(/^\/+|\/+$/g, '')}`;
  if (path === '/' && str(homepage.activeVariant) === 'alternate') return <C />;
  const sections = (layouts?.routes as AnyObj | undefined)?.[path]?.sections;
  if (!Array.isArray(sections)) return <C />;
  return <PageBlocks sections={sections} original={<C />} />;
}
function SolutionDetailRoute() {
  const { slug = '' } = useParams<{ slug: string }>();
  const segments = arr<AnyObj>(useSection('segments').items);
  return segments.some((entry) => str(entry.slug) === slug) ? <SegmentDetailPage /> : <SolutionPage />;
}
const pub = (C: () => ReactElement | null) => function PublicPage() { return <PublicShell><RouteLayout C={C} /></PublicShell>; };
const P = {
  home: pub(HomePage), features: pub(FeaturesPage), feature: pub(FeatureDetailPage), services: pub(ServicesPage), service: pub(ServiceDetailPage),
  solution: pub(SolutionPage), pricing: pub(PricingPage), about: pub(AboutPage), contact: pub(ContactPage), faq: pub(FaqPage), blog: pub(BlogPage),
  post: pub(BlogPostPage), media: pub(MediaPage), cases: pub(CaseStudiesPage), caseDetail: pub(CaseStudyDetailPage), careers: pub(CareersPage),
  support: pub(SupportPage), demo: pub(DemoPage), dynamic: pub(DynamicPage), notFound: pub(NotFoundPage),
  industries: pub(IndustriesPage), industry: pub(IndustryDetailPage), segments: pub(SegmentsPage), solutionDetail: pub(SolutionDetailRoute),
  ai: pub(AiHubPage), resources: pub(ResourcesPage), resource: pub(ResourceDetailPage), integrations: pub(IntegrationsPage),
  compliance: pub(CompliancePage), customerStories: pub(CustomerStoriesPage), customerStory: pub(CustomerStoryDetailPage), freeTools: pub(FreeToolsPage),
};

/** The full route table, shared by client App and SSR PublicApp so markup is identical. */
export function PublicRoutes() {
  return (
    <ThemeRoot>
      <SeoSync />
      <AnalyticsObserver />
      <Switch>
        <Route path="/" component={P.home} />
        <Route path="/features" component={P.features} />
        <Route path="/features/:slug" component={P.feature} />
        <Route path="/services" component={P.services} />
        <Route path="/services/:slug" component={P.service} />
        <Route path="/industries" component={P.industries} />
        <Route path="/industries/:slug" component={P.industry} />
        <Route path="/solutions" component={P.segments} />
        <Route path="/solutions/:slug" component={P.solutionDetail} />
        <Route path="/ai" component={P.ai} />
        <Route path="/resources" component={P.resources} />
        <Route path="/resources/:slug" component={P.resource} />
        <Route path="/integrations" component={P.integrations} />
        <Route path="/compliance" component={P.compliance} />
        <Route path="/customer-stories" component={P.customerStories} />
        <Route path="/customer-stories/:slug" component={P.customerStory} />
        <Route path="/free-tools" component={P.freeTools} />
        <Route path="/free-tools/:slug" component={P.freeTools} />
        <Route path="/pricing" component={P.pricing} />
        <Route path="/about" component={P.about} />
        <Route path="/contact" component={P.contact} />
        <Route path="/faq" component={P.faq} />
        <Route path="/blog" component={P.blog} />
        <Route path="/blog/:slug" component={P.post} />
        <Route path="/about-us" component={P.about} />
        <Route path="/media-coverage" component={P.media} />
        <Route path="/case-studies" component={P.cases} />
        <Route path="/case-studies/:slug" component={P.caseDetail} />
        <Route path="/careers" component={P.careers} />
        <Route path="/career" component={P.careers} />
        <Route path="/support" component={P.support} />
        <Route path="/our-support" component={P.support} />
        <Route path="/request-demo" component={P.demo} />
        <Route path="/request-for-demo" component={P.demo} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard">{()=> <PrivateRoute/>}</Route>
        <Route path="/admin">{()=> <PrivateRoute admin/>}</Route>
        <Route path="/admin/:tab">{()=> <PrivateRoute admin/>}</Route>
        <Route path="/*" component={P.dynamic} />
        <Route component={P.notFound} />
      </Switch>
    </ThemeRoot>
  );
}

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });
}

/** SSR entry component: renders from supplied data with no browser globals. */
export function PublicApp({ data, path, base = '' }: { data: Bootstrap; path: string; base?: string }) {
  const client = makeQueryClient();
  const [p, s = ''] = path.split('?');
  return (
    <QueryClientProvider client={client}>
      <BootstrapProvider value={data}>
        <ContentProvider>
          <TooltipProvider>
            <WouterRouter base={base} ssrPath={p} ssrSearch={s}>
              <PublicRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ContentProvider>
      </BootstrapProvider>
    </QueryClientProvider>
  );
}
