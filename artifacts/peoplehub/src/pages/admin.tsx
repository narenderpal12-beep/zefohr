/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, FileText, Gauge, History, Inbox, LayoutGrid, LogOut, Newspaper, Pencil, Plus, RotateCcw, Route as RouteIcon, Save, Search, Trash2, X, Palette, Sparkles,
} from 'lucide-react';
import {
  useGetAdminSummary, useGetAdminRecords, useCreateAdminRecord, useUpdateAdminRecord, useDeleteAdminRecord,
  useGetContent, useGetContentHistory, useSaveContent, useResetContent,
  getGetAdminSummaryQueryKey, getGetAdminRecordsQueryKey, getGetContentQueryKey, getGetContentHistoryQueryKey,
  getGetPagesQueryKey, getGetPostsQueryKey,
} from '@workspace/api-client-react';
import { arr, errMsg, str, useSection, type AnyObj } from '@/lib/content';
import { BrandMark, ModeToggle, useMe } from '@/components/site/layout';
import { SkeletonBlock } from '@/components/site/primitives';
import { JsonForm, RawJson, aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import { AppearanceAdmin, BrandingAdmin } from './admin-appearance';
import { SeoManager, RedirectsPanel } from './admin-seo';
import { SignedOutPanel, StatusPill, useSignOut } from './dashboard';
import { fmtDate } from './public';
import { cn } from '@/lib/utils';

const TABS = [
  { key: '', label: 'Overview', icon: Gauge },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'branding', label: 'Branding', icon: Sparkles },
  { key: 'content', label: 'Content', icon: LayoutGrid },
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'posts', label: 'Blog posts', icon: Newspaper },
  { key: 'seo', label: 'SEO Manager', icon: Search },
  { key: 'organisations', label: 'Organisations', icon: Building2 },
  { key: 'leads', label: 'Leads', icon: Inbox },
  { key: 'redirects', label: 'Redirects', icon: RouteIcon },
];

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()} className={cn('glass-strong max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-7', wide ? 'max-w-5xl' : 'max-w-2xl')}>
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className={aBtn} aria-label="Close" data-testid="button-close-modal"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('glass rounded-2xl p-5', className)}>
      {title || actions ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3">{title ? <h2 className="font-display text-lg font-bold">{title}</h2> : <span />}<div className="flex flex-wrap gap-2">{actions}</div></div> : null}
      {children}
    </section>
  );
}

export function LField({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>{children}{hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}</label>;
}

export function AdminPage() {
  const params = useParams<{ tab?: string }>();
  const tab = params.tab ?? '';
  const me = useMe();
  const signOut = useSignOut();
  if (me.isLoading) return <div className="mx-auto max-w-6xl space-y-4 p-8"><SkeletonBlock className="h-10 w-60" /><SkeletonBlock className="h-80" /></div>;
  if (me.isError || !me.data) return <SignedOutPanel title="Super admin access" text="Sign in with the super admin account configured in your environment secrets." />;
  const user = me.data.user as AnyObj;
  if (user.role !== 'super_admin') return <SignedOutPanel title="Not permitted" text="This area is restricted to the platform super admin. Organisation admins use the dashboard." />;

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-white/[0.06] bg-[color:var(--ph-bg)]/90 backdrop-blur lg:h-[100dvh] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4 lg:block lg:p-5">
          <Link href="/" data-testid="link-admin-site"><BrandMark /></Link>
          <div className="flex items-center gap-2 lg:mt-3 lg:justify-between"><span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ph-pink)] lg:block">Super admin</span><ModeToggle className="h-8 w-8" /></div>
        </div>
        <nav className="scrollbar-thin flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key ? `/admin/${t.key}` : '/admin'} className={cn('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition', tab === t.key ? 'bg-white/[0.08] text-foreground' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground')} data-testid={`link-admin-${t.key || 'overview'}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </Link>
          ))}
        </nav>
        <div className="hidden p-4 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <div className="truncate text-xs text-muted-foreground">{str(user.email)}</div>
          <button type="button" onClick={signOut.run} className={cn(aBtn, 'mt-2 w-full justify-center')} data-testid="button-admin-logout"><LogOut className="h-3.5 w-3.5" />Log out</button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {tab === '' && <Overview />}
        {tab === 'appearance' && <AppearanceAdmin />}
        {tab === 'branding' && <BrandingAdmin />}
        {tab === 'content' && <ContentEditor />}
        {tab === 'pages' && <PagesAdmin />}
        {tab === 'posts' && <PostsAdmin />}
        {tab === 'seo' && <SeoManager />}
        {tab === 'organisations' && <OrgsAdmin />}
        {tab === 'leads' && <LeadsAdmin />}
        {tab === 'redirects' && <RedirectsPanel />}
        {!TABS.some((t) => t.key === tab) && <p className="text-muted-foreground">Unknown section.</p>}
        <button type="button" onClick={signOut.run} className={cn(aBtn, 'mt-10 lg:hidden')} data-testid="button-admin-logout-mobile"><LogOut className="h-3.5 w-3.5" />Log out</button>
      </main>
    </div>
  );
}

function Overview() {
  const q = useGetAdminSummary();
  const s = (q.data ?? {}) as AnyObj;
  const cards = [['Organisations', s.organisations], ['Active trials', s.active_trials], ['Leads', s.leads], ['Published pages', s.published_pages], ['Published posts', s.published_posts]];
  return (
    <div>
      <h1 className="font-display text-3xl font-bold"><span className="text-gradient">Control room</span></h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything on the public site is edited from here. Changes go live within seconds.</p>
      {q.isError ? <p className="mt-6 text-red-300">{errMsg(q.error)} <button className="underline" onClick={() => q.refetch()}>Retry</button></p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={String(k)} className="glass rounded-2xl p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{String(k)}</div>
            {q.isLoading ? <SkeletonBlock className="mt-2 h-8 w-16" /> : <div className="font-display mt-1 text-3xl font-bold" data-testid={`text-summary-${String(k).toLowerCase().replace(/\s/g, '-')}`}>{str(v, '0')}</div>}
          </div>
        ))}
      </div>
      <Panel title="Recent activity" className="mt-6">
        {arr<AnyObj>(s.recent_activity).length ? (
          <ul className="divide-y divide-white/[0.05]">
            {arr<AnyObj>(s.recent_activity).map((a, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span><span className="font-mono text-xs text-[color:var(--ph-cyan)]">{str(a.action)}</span> <span className="text-foreground/85">{str(a.entity)}</span> <span className="text-muted-foreground">{str(a.actor)}</span></span>
                <span className="font-mono text-[11px] text-muted-foreground">{a.at ? new Date(String(a.at)).toLocaleString('en-IN') : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No activity yet. Edits, sign-ups and SEO changes will appear here.</p>}
      </Panel>
    </div>
  );
}

function ContentEditor() {
  const qc = useQueryClient();
  const content = useGetContent({ query: { queryKey: getGetContentQueryKey() } });
  const keys = useMemo(() => Object.keys((content.data ?? {}) as AnyObj), [content.data]);
  const [key, setKey] = useState('hero');
  const [draft, setDraft] = useState<any>(null);
  const [mode, setMode] = useState<'form' | 'raw' | 'history'>('form');
  const [saved, setSaved] = useState(false);
  const loadedFor = useMemo(() => ({ k: '' }), []);
  useEffect(() => {
    if (content.data && loadedFor.k !== key) { loadedFor.k = key; setDraft(structuredClone((content.data as AnyObj)[key] ?? {})); setSaved(false); }
  }, [content.data, key, loadedFor]);
  const save = useSaveContent();
  const reset = useResetContent();
  const history = useGetContentHistory(key, { query: { queryKey: getGetContentHistoryQueryKey(key), enabled: mode === 'history' } });
  const after = () => { void qc.invalidateQueries({ queryKey: getGetContentQueryKey() }); void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey(key) }); };
  const doSave = () => save.mutate({ key, data: draft }, { onSuccess: () => { setSaved(true); after(); setTimeout(() => setSaved(false), 2500); } });
  const doReset = () => { if (!window.confirm(`Reset "${key}" to built-in defaults?`)) return; reset.mutate({ key }, { onSuccess: (d) => { const v = (d as AnyObj)?.value ?? d; setDraft(v); loadedFor.k = ''; after(); } }); };
  if (content.isLoading) return <SkeletonBlock className="h-96" />;
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Site content</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[200px_1fr]">
        <div className="scrollbar-thin flex gap-1 overflow-x-auto lg:flex-col">
          {keys.map((k) => <button key={k} type="button" onClick={() => setKey(k)} className={cn('shrink-0 rounded-lg px-3 py-2 text-left font-mono text-xs', k === key ? 'bg-brand text-on-brand' : 'text-muted-foreground hover:bg-white/5')} data-testid={`button-section-${k}`}>{k}</button>)}
        </div>
        <Panel
          title={key}
          actions={<>
            {(['form', 'raw', 'history'] as const).map((m) => <button key={m} type="button" className={cn(aBtn, mode === m && 'border-[color:var(--ph-indigo)] text-foreground')} onClick={() => setMode(m)} data-testid={`tab-content-${m}`}>{m === 'form' ? 'Form' : m === 'raw' ? 'Raw JSON' : <><History className="h-3 w-3" />History</>}</button>)}
            <button type="button" className={aBtn} onClick={doReset} disabled={reset.isPending} data-testid="button-reset-content"><RotateCcw className="h-3 w-3" />Reset to default</button>
            <button type="button" className={aBtnPrimary} onClick={doSave} disabled={save.isPending || draft === null} data-testid="button-save-content"><Save className="h-3.5 w-3.5" />{save.isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}</button>
          </>}
        >
          {save.isError ? <p className="mb-3 text-sm text-red-300">{errMsg(save.error)}</p> : null}
          {key === 'theme' || key === 'brand' ? <p className="mb-3 text-xs text-muted-foreground">Tip: the <Link href={key === 'theme' ? '/admin/appearance' : '/admin/branding'} className="text-[color:var(--ph-cyan)] underline">{key === 'theme' ? 'Appearance' : 'Branding'}</Link> tab offers friendly controls with a preview.</p> : null}
          {mode === 'form' && draft !== null ? <JsonForm value={draft} onChange={setDraft} path={key} /> : null}
          {mode === 'raw' ? <RawJson value={draft} onChange={setDraft} /> : null}
          {mode === 'history' ? (
            history.isLoading ? <SkeletonBlock className="h-40" /> : arr<AnyObj>(history.data).length ? (
              <ul className="space-y-2">
                {arr<AnyObj>(history.data).map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] p-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{h.updated_at || h.created_at ? new Date(String(h.updated_at ?? h.created_at)).toLocaleString('en-IN') : `Version ${i + 1}`} {h.updated_by ? `by ${str(h.updated_by)}` : ''}</span>
                    <button type="button" className={aBtn} onClick={() => { setDraft(structuredClone(h.value ?? h)); setMode('form'); }} data-testid={`button-restore-content-${i}`}>Load into editor</button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No saved versions yet.</p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function useRecords(entity: 'pages' | 'posts' | 'organisations' | 'leads') {
  const qc = useQueryClient();
  const q = useGetAdminRecords(entity, { query: { queryKey: getGetAdminRecordsQueryKey(entity) } });
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: getGetAdminRecordsQueryKey(entity) });
    void qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
    if (entity === 'pages') void qc.invalidateQueries({ queryKey: getGetPagesQueryKey() });
    if (entity === 'posts') void qc.invalidateQueries({ queryKey: getGetPostsQueryKey() });
  };
  return { q, rows: arr<AnyObj>(q.data), invalidate };
}

function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead><tr className="border-b border-white/[0.07] text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{head.map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
      </table>
      {empty ? <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p> : null}
    </div>
  );
}

const blankPage = { slug: 'solutions/', title: '', status: 'draft', content: { intro: '', body: '', benefits: [''], faq: [{ question: '', answer: '' }] } };

function PagesAdmin() {
  const { q, rows, invalidate } = useRecords('pages');
  const create = useCreateAdminRecord();
  const update = useUpdateAdminRecord();
  const del = useDeleteAdminRecord();
  const [edit, setEdit] = useState<AnyObj | null>(null);
  const saveIt = () => {
    if (!edit) return;
    const data = { slug: edit.slug, title: edit.title, status: edit.status, content: edit.content };
    const opts = { onSuccess: () => { invalidate(); setEdit(null); } };
    if (edit.id) update.mutate({ entity: 'pages', id: String(edit.id), data }, opts); else create.mutate({ entity: 'pages', data }, opts);
  };
  const err = create.error ?? update.error;
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Landing pages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Use slugs like <code className="font-mono">solutions/payroll-software-india</code> or any top-level slug. Published pages are added to SEO and sitemap automatically.</p>
      <Panel className="mt-6" actions={<button type="button" className={aBtnPrimary} onClick={() => setEdit(structuredClone(blankPage))} data-testid="button-new-page"><Plus className="h-3.5 w-3.5" />New page</button>}>
        {q.isLoading ? <SkeletonBlock className="h-40" /> : (
          <Table head={['Title', 'Path', 'Status', '']} empty={!rows.length}>
            {rows.map((r) => (
              <tr key={String(r.id)} data-testid={`row-page-${String(r.id)}`}>
                <td className="px-3 py-2.5">{str(r.title)}</td>
                <td className="px-3 py-2.5 font-mono text-xs"><a href={`/${str(r.slug)}`} target="_blank" rel="noreferrer" className="text-[color:var(--ph-cyan)]">/{str(r.slug)}</a></td>
                <td className="px-3 py-2.5"><StatusPill s={str(r.status) === 'published' ? 'active' : 'cancelled'} /></td>
                <td className="px-3 py-2.5 text-right"><div className="flex justify-end gap-1">
                  <button className={aBtn} onClick={() => setEdit(structuredClone({ ...blankPage, ...r, content: { ...blankPage.content, ...(r.content ?? {}) } }))} data-testid={`button-edit-page-${String(r.id)}`}><Pencil className="h-3 w-3" /></button>
                  <button className={cn(aBtn, 'text-red-300')} onClick={() => { if (window.confirm('Delete this page?')) del.mutate({ entity: 'pages', id: String(r.id) }, { onSuccess: invalidate }); }} data-testid={`button-delete-page-${String(r.id)}`}><Trash2 className="h-3 w-3" /></button>
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {edit ? (
        <Modal title={edit.id ? 'Edit page' : 'New page'} onClose={() => setEdit(null)} wide>
          <div className="grid gap-4 sm:grid-cols-3">
            <LField label="Title"><input className={aInput} value={str(edit.title)} onChange={(e) => setEdit({ ...edit, title: e.target.value })} data-testid="input-page-title" /></LField>
            <LField label="Slug"><input className={cn(aInput, 'font-mono')} value={str(edit.slug)} onChange={(e) => setEdit({ ...edit, slug: e.target.value.replace(/^\/+/, '') })} data-testid="input-page-slug" /></LField>
            <LField label="Status"><select className={aInput} value={str(edit.status)} onChange={(e) => setEdit({ ...edit, status: e.target.value })} data-testid="select-page-status"><option value="draft">Draft</option><option value="published">Published</option></select></LField>
          </div>
          <div className="mt-5"><div className="mb-2 text-xs font-medium text-foreground/80">Content (intro, markdown body, benefits, FAQ)</div><JsonForm value={edit.content} onChange={(c) => setEdit({ ...edit, content: c })} path="page" /></div>
          {err ? <p className="mt-3 text-sm text-red-300">{errMsg(err)}</p> : null}
          <div className="mt-6 flex justify-end gap-2"><button className={aBtn} onClick={() => setEdit(null)}>Cancel</button><button className={aBtnPrimary} onClick={saveIt} disabled={create.isPending || update.isPending} data-testid="button-save-page"><Save className="h-3.5 w-3.5" />Save page</button></div>
        </Modal>
      ) : null}
    </div>
  );
}

const blankPost = { slug: '', title: '', excerpt: '', body_md: '', cover_image_url: '', author: '', tags: [] as string[], status: 'draft', published_at: '' };

function PostsAdmin() {
  const { q, rows, invalidate } = useRecords('posts');
  const create = useCreateAdminRecord();
  const update = useUpdateAdminRecord();
  const del = useDeleteAdminRecord();
  const [edit, setEdit] = useState<AnyObj | null>(null);
  const [tags, setTags] = useState('');
  const open = (p: AnyObj) => { setEdit(structuredClone({ ...blankPost, ...p, published_at: p.published_at ? String(p.published_at).slice(0, 16) : '' })); setTags(arr<string>(p.tags).join(', ')); };
  const saveIt = (publish?: boolean) => {
    if (!edit) return;
    const status = publish ? 'published' : edit.status;
    const data: AnyObj = {
      slug: edit.slug, title: edit.title, excerpt: edit.excerpt, body_md: edit.body_md, cover_image_url: edit.cover_image_url, author: edit.author,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean), status,
      published_at: edit.published_at ? new Date(edit.published_at).toISOString() : status === 'published' ? new Date().toISOString() : null,
    };
    const opts = { onSuccess: () => { invalidate(); setEdit(null); } };
    if (edit.id) update.mutate({ entity: 'posts', id: String(edit.id), data }, opts); else create.mutate({ entity: 'posts', data }, opts);
  };
  const set = (k: string) => (e: { target: { value: string } }) => setEdit({ ...edit, [k]: e.target.value });
  const err = create.error ?? update.error;
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Blog posts</h1>
      <Panel className="mt-6" actions={<button className={aBtnPrimary} onClick={() => open(blankPost)} data-testid="button-new-post"><Plus className="h-3.5 w-3.5" />New post</button>}>
        {q.isLoading ? <SkeletonBlock className="h-40" /> : (
          <Table head={['Title', 'Slug', 'Status', 'Published', '']} empty={!rows.length}>
            {rows.map((r) => (
              <tr key={String(r.id)} data-testid={`row-post-${String(r.id)}`}>
                <td className="px-3 py-2.5">{str(r.title)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">/blog/{str(r.slug)}</td>
                <td className="px-3 py-2.5"><span className="font-mono text-xs uppercase">{str(r.status)}</span></td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{fmtDate(r.published_at)}</td>
                <td className="px-3 py-2.5"><div className="flex justify-end gap-1">
                  {r.status !== 'published' ? <button className={aBtn} onClick={() => update.mutate({ entity: 'posts', id: String(r.id), data: { ...r, status: 'published', published_at: r.published_at ?? new Date().toISOString() } }, { onSuccess: invalidate })} data-testid={`button-publish-post-${String(r.id)}`}>Publish</button> : <button className={aBtn} onClick={() => update.mutate({ entity: 'posts', id: String(r.id), data: { ...r, status: 'draft' } }, { onSuccess: invalidate })} data-testid={`button-unpublish-post-${String(r.id)}`}>Unpublish</button>}
                  <button className={aBtn} onClick={() => open(r)} data-testid={`button-edit-post-${String(r.id)}`}><Pencil className="h-3 w-3" /></button>
                  <button className={cn(aBtn, 'text-red-300')} onClick={() => { if (window.confirm('Delete this post?')) del.mutate({ entity: 'posts', id: String(r.id) }, { onSuccess: invalidate }); }} data-testid={`button-delete-post-${String(r.id)}`}><Trash2 className="h-3 w-3" /></button>
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {edit ? (
        <Modal title={edit.id ? 'Edit post' : 'New post'} onClose={() => setEdit(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <LField label="Title"><input className={aInput} value={str(edit.title)} onChange={(e) => setEdit({ ...edit, title: e.target.value, slug: edit.id || edit.slug ? edit.slug : '' })} onBlur={() => { if (!edit.slug) setEdit({ ...edit, slug: str(edit.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }); }} data-testid="input-post-title" /></LField>
            <LField label="Slug"><input className={cn(aInput, 'font-mono')} value={str(edit.slug)} onChange={set('slug')} data-testid="input-post-slug" /></LField>
            <LField label="Author"><input className={aInput} value={str(edit.author)} onChange={set('author')} data-testid="input-post-author" /></LField>
            <LField label="Tags (comma separated)"><input className={aInput} value={tags} onChange={(e) => setTags(e.target.value)} data-testid="input-post-tags" /></LField>
            <LField label="Cover image URL"><input className={aInput} value={str(edit.cover_image_url)} onChange={set('cover_image_url')} data-testid="input-post-cover" /></LField>
            <div className="grid grid-cols-2 gap-3">
              <LField label="Status"><select className={aInput} value={str(edit.status)} onChange={set('status')} data-testid="select-post-status"><option value="draft">Draft</option><option value="published">Published</option></select></LField>
              <LField label="Publish date"><input type="datetime-local" className={aInput} value={str(edit.published_at)} onChange={set('published_at')} data-testid="input-post-date" /></LField>
            </div>
            <div className="sm:col-span-2"><LField label="Excerpt"><textarea className={cn(aInput, 'min-h-[70px]')} value={str(edit.excerpt)} onChange={set('excerpt')} data-testid="input-post-excerpt" /></LField></div>
            <div className="sm:col-span-2"><LField label="Body (markdown)" hint="Supports ## headings, lists, **bold**, *italic*, `code`, [links](/pricing) and > quotes."><textarea className={cn(aInput, 'min-h-[260px] font-mono text-xs')} value={str(edit.body_md)} onChange={set('body_md')} data-testid="input-post-body" /></LField></div>
          </div>
          {err ? <p className="mt-3 text-sm text-red-300">{errMsg(err)}</p> : null}
          <div className="mt-6 flex justify-end gap-2"><button className={aBtn} onClick={() => saveIt()} data-testid="button-save-post">Save</button><button className={aBtnPrimary} onClick={() => saveIt(true)} disabled={create.isPending || update.isPending} data-testid="button-publish-post">Save and publish</button></div>
        </Modal>
      ) : null}
    </div>
  );
}

const SUB_STATUSES = ['trial', 'pending_payment', 'active', 'past_due', 'cancelled', 'expired'];

function OrgsAdmin() {
  const { q, rows, invalidate } = useRecords('organisations');
  const pricing = useSection('pricing');
  const update = useUpdateAdminRecord();
  const [edit, setEdit] = useState<AnyObj | null>(null);
  const [filter, setFilter] = useState('');
  const sub = (r: AnyObj) => (r.subscription ?? r) as AnyObj;
  const list = rows.filter((r) => !filter || JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()));
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Organisations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Payments are not automated. Mark a subscription active only after confirming payment offline.</p>
      <Panel className="mt-6" actions={<input className={cn(aInput, 'w-56')} placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="input-org-search" />}>
        {q.isLoading ? <SkeletonBlock className="h-40" /> : (
          <Table head={['Organisation', 'Industry', 'Plan', 'Status', 'Trial ends', '']} empty={!list.length}>
            {list.map((r) => (
              <tr key={String(r.id)} data-testid={`row-org-${String(r.id)}`}>
                <td className="px-3 py-2.5"><div>{str(r.name)}</div><div className="font-mono text-[11px] text-muted-foreground">{str(r.slug)}</div></td>
                <td className="px-3 py-2.5 text-muted-foreground">{str(r.industry)}</td>
                <td className="px-3 py-2.5 capitalize">{str(sub(r).plan_key)}</td>
                <td className="px-3 py-2.5"><StatusPill s={str(sub(r).status)} /></td>
                <td className="px-3 py-2.5 font-mono text-xs">{fmtDate(sub(r).trial_ends_at)}</td>
                <td className="px-3 py-2.5 text-right"><button className={aBtn} onClick={() => setEdit({ id: r.id, name: r.name, plan_key: str(sub(r).plan_key), status: str(sub(r).status), trial_ends_at: sub(r).trial_ends_at ? String(sub(r).trial_ends_at).slice(0, 10) : '' })} data-testid={`button-edit-org-${String(r.id)}`}><Pencil className="h-3 w-3" />Subscription</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {edit ? (
        <Modal title={`Subscription: ${str(edit.name)}`} onClose={() => setEdit(null)}>
          <div className="grid gap-4 sm:grid-cols-3">
            <LField label="Plan"><select className={aInput} value={str(edit.plan_key)} onChange={(e) => setEdit({ ...edit, plan_key: e.target.value })} data-testid="select-org-plan">{arr<AnyObj>(pricing.plans).map((p) => <option key={str(p.key)} value={str(p.key)}>{str(p.name)}</option>)}</select></LField>
            <LField label="Status"><select className={aInput} value={str(edit.status)} onChange={(e) => setEdit({ ...edit, status: e.target.value })} data-testid="select-org-status">{SUB_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></LField>
            <LField label="Trial ends"><input type="date" className={aInput} value={str(edit.trial_ends_at)} onChange={(e) => setEdit({ ...edit, trial_ends_at: e.target.value })} data-testid="input-org-trial" /></LField>
          </div>
          {update.isError ? <p className="mt-3 text-sm text-red-300">{errMsg(update.error)}</p> : null}
          <div className="mt-6 flex justify-end"><button className={aBtnPrimary} disabled={update.isPending} onClick={() => update.mutate({ entity: 'organisations', id: String(edit.id), data: { plan_key: edit.plan_key, status: edit.status, trial_ends_at: edit.trial_ends_at ? new Date(edit.trial_ends_at).toISOString() : null } }, { onSuccess: () => { invalidate(); setEdit(null); } })} data-testid="button-save-org"><Save className="h-3.5 w-3.5" />Save</button></div>
        </Modal>
      ) : null}
    </div>
  );
}

function LeadsAdmin() {
  const { q, rows, invalidate } = useRecords('leads');
  const del = useDeleteAdminRecord();
  const [open, setOpen] = useState<AnyObj | null>(null);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Leads</h1>
      <Panel className="mt-6">
        {q.isLoading ? <SkeletonBlock className="h-40" /> : (
          <Table head={['Name', 'Email', 'Organisation', 'Received', '']} empty={!rows.length}>
            {rows.map((r) => (
              <tr key={String(r.id)} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => setOpen(r)} data-testid={`row-lead-${String(r.id)}`}>
                <td className="px-3 py-2.5">{str(r.name)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{str(r.email)}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{str(r.organisation)}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="px-3 py-2.5 text-right"><button className={cn(aBtn, 'text-red-300')} onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this lead?')) del.mutate({ entity: 'leads', id: String(r.id) }, { onSuccess: invalidate }); }} data-testid={`button-delete-lead-${String(r.id)}`}><Trash2 className="h-3 w-3" /></button></td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {open ? (
        <Modal title={str(open.name)} onClose={() => setOpen(null)}>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">{['email', 'phone', 'organisation'].map((k) => <div key={k}><dt className="font-mono text-[10px] uppercase text-muted-foreground">{k}</dt><dd>{str(open[k], '-')}</dd></div>)}</dl>
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/[0.03] p-4 text-sm">{str(open.message)}</p>
          <a href={`mailto:${str(open.email)}`} className={cn(aBtnPrimary, 'mt-4')} data-testid="link-reply-lead">Reply by email</a>
        </Modal>
      ) : null}
    </div>
  );
}
