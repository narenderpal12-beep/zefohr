import { lazy, Suspense, useState, useEffect, type ReactElement, type ReactNode } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResolveSeo, getResolveSeoQueryKey } from '@workspace/api-client-react';
import { BootstrapProvider, ContentProvider, str, themeStyle, useContent, type AnyObj, type Bootstrap } from '@/lib/content';
import { PublicShell } from '@/components/site/layout';
import {
  AboutPage, BlogPage, BlogPostPage, ContactPage, DynamicPage, FaqPage, FeatureDetailPage, FeaturesPage, HomePage, NotFoundPage,
  PricingPage, ServiceDetailPage, ServicesPage, SolutionPage,
} from '@/pages/public';
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
    let canonical=document.head.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.setAttribute('rel','canonical');document.head.appendChild(canonical);}
    canonical.setAttribute('href',str(s.canonical_url));
    const ld=document.head.querySelector('script[type="application/ld+json"]');
    if(ld&&s.jsonld)ld.textContent=JSON.stringify(s.jsonld);
  }, [q.data]);
  return null;
}

function ThemeRoot({ children }: { children: ReactNode }) {
  const c = useContent();
  return <div className="dark grain min-h-[100dvh] bg-[color:var(--ph-bg)] text-foreground" style={themeStyle(c?.theme as AnyObj | undefined)}>{children}</div>;
}

const pub = (C: () => ReactElement | null) => function PublicPage() { return <PublicShell><C /></PublicShell>; };
const P = {
  home: pub(HomePage), features: pub(FeaturesPage), feature: pub(FeatureDetailPage), services: pub(ServicesPage), service: pub(ServiceDetailPage),
  solution: pub(SolutionPage), pricing: pub(PricingPage), about: pub(AboutPage), contact: pub(ContactPage), faq: pub(FaqPage), blog: pub(BlogPage),
  post: pub(BlogPostPage), dynamic: pub(DynamicPage), notFound: pub(NotFoundPage),
};

/** The full route table, shared by client App and SSR PublicApp so markup is identical. */
export function PublicRoutes() {
  return (
    <ThemeRoot>
      <SeoSync />
      <Switch>
        <Route path="/" component={P.home} />
        <Route path="/features" component={P.features} />
        <Route path="/features/:slug" component={P.feature} />
        <Route path="/services" component={P.services} />
        <Route path="/services/:slug" component={P.service} />
        <Route path="/solutions/:slug" component={P.solution} />
        <Route path="/pricing" component={P.pricing} />
        <Route path="/about" component={P.about} />
        <Route path="/contact" component={P.contact} />
        <Route path="/faq" component={P.faq} />
        <Route path="/blog" component={P.blog} />
        <Route path="/blog/:slug" component={P.post} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard">{()=> <PrivateRoute/>}</Route>
        <Route path="/admin">{()=> <PrivateRoute admin/>}</Route>
        <Route path="/admin/:tab">{()=> <PrivateRoute admin/>}</Route>
        <Route path="/:slug*" component={P.dynamic} />
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
