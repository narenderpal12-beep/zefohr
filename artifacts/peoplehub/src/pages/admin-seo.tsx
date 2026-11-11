/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Download, ExternalLink, History, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react';
import {
  useGetSeoPages, useGetSeoPage, useGetSeoHistory, useSaveSeoPage, useRestoreSeoPage, useBulkSeoPages,
  useGetSeoSettings, useSaveSeoSettings, useGetRedirects, useCreateRedirect, useUpdateRedirect, useDeleteRedirect, useGetNotFoundLog,
  useResolveSeo,
  getGetSeoPagesQueryKey, getGetSeoPageQueryKey, getGetSeoHistoryQueryKey, getGetSeoSettingsQueryKey, getGetRedirectsQueryKey,
  getGetNotFoundLogQueryKey, getResolveSeoQueryKey,
} from '@workspace/api-client-react';
import { arr, errMsg, str, type AnyObj } from '@/lib/content';
import { SkeletonBlock } from '@/components/site/primitives';
import { JsonForm, RawJson, aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import { LField, Modal, Panel } from './admin';
import { cn } from '@/lib/utils';

const PAGE_TYPES = ['static', 'suite', 'service', 'blog', 'landing', 'legal', 'app_public'];
const SCHEMA_TYPES = ['WebPage', 'FAQPage', 'Article', 'SoftwareApplication', 'Product', 'Service'];
const ROBOTS = ['index,follow', 'index,nofollow', 'noindex,follow', 'noindex,nofollow'];
const IMPORTANT = /^\/($|pricing|features|services)/;

const scoreTone = (s: number) => (s >= 80 ? 'text-emerald-300 bg-emerald-400/10' : s >= 50 ? 'text-amber-200 bg-amber-300/10' : 'text-red-300 bg-red-400/10');

export function SeoManager() {
  const [tab, setTab] = useState<'pages' | 'settings' | 'schema' | 'sitemap' | 'redirects' | '404'>('pages');
  const tabs = [['pages', 'Pages'], ['settings', 'Global settings'], ['schema', 'Schema'], ['sitemap', 'Sitemap & robots'], ['redirects', 'Redirects'], ['404', '404 monitor']] as const;
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">SEO Manager</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every public URL is discovered automatically. Empty fields fall back to content-derived defaults, then global templates.</p>
      <div role="tablist" aria-label="SEO manager sections" className="scrollbar-thin mt-6 flex gap-1 overflow-x-auto border-b border-white/[0.07]">
        {tabs.map(([k, l], index) => {
          const id = `seo-tab-${k || 'pages'}`;
          return <button key={k} id={id} role="tab" aria-selected={tab === k} aria-controls="seo-panel" tabIndex={tab === k ? 0 : -1} type="button" onClick={() => setTab(k)} onKeyDown={(event) => {
            const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!direction) return;
            event.preventDefault();
            const next = (index + direction + tabs.length) % tabs.length;
            setTab(tabs[next][0]);
            document.getElementById(`seo-tab-${tabs[next][0] || 'pages'}`)?.focus();
          }} className={cn('relative shrink-0 px-4 py-2.5 text-sm', tab === k ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')} data-testid={`tab-seo-${k}`}>{l}{tab === k ? <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand" /> : null}</button>;
        })}
      </div>
      <div id="seo-panel" role="tabpanel" aria-labelledby={`seo-tab-${tab || 'pages'}`} tabIndex={0} className="mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ph-cyan)]">
        {tab === 'pages' && <SeoPages />}
        {tab === 'settings' && <SeoSettings />}
        {tab === 'schema' && <SeoSchema />}
        {tab === 'sitemap' && <SitemapRobots />}
        {tab === 'redirects' && <RedirectsPanel />}
        {tab === '404' && <NotFoundMonitor />}
      </div>
    </div>
  );
}

function SeoPages() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [issue, setIssue] = useState('all');
  const [page, setPage] = useState(1);
  const params = { search: search || undefined, type, status, issue, page };
  const q = useGetSeoPages(params, { query: { queryKey: getGetSeoPagesQueryKey(params) } });
  const data = (q.data ?? {}) as AnyObj;
  const items = arr<AnyObj>(data.items);
  const [sel, setSel] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const bulk = useBulkSeoPages();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const invalidate = () => void qc.invalidateQueries({ predicate: (x) => String(x.queryKey[0]).includes('/api/v1/seo') });
  const applyBulk = (changes: AnyObj) => {
    if (!sel.length) return;
    if (changes.robots?.startsWith('noindex') && items.some((i) => sel.includes(String(i.id)) && IMPORTANT.test(str(i.path))) && !window.confirm('Some selected pages are important (home, pricing, features, services). Set noindex anyway?')) return;
    bulk.mutate({ data: { ids: sel, changes } }, { onSuccess: (r) => { setMsg(`Updated ${str((r as AnyObj).updated, String(sel.length))} pages`); setSel([]); invalidate(); } });
  };
  const exportCsv = async () => {
    const r = await fetch('/api/v1/seo/export', { credentials: 'include' });
    if (!r.ok) { setMsg('Export failed'); return; }
    const blob = await r.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'peoplehub-seo.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const importCsv = async (f: File) => {
    const csv = await f.text();
    const r = await fetch('/api/v1/seo/import', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Imported: ${str(j.updated, '0')} pages updated` : str(j.error, 'Import failed'));
    if (r.ok) invalidate();
  };
  const allSel = items.length > 0 && items.every((i) => sel.includes(String(i.id)));
  return (
    <Panel>
      <div className="flex flex-wrap gap-2">
        <input className={cn(aInput, 'w-full sm:w-60')} placeholder="Search path or title" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} data-testid="input-seo-search" />
        <select className={cn(aInput, 'w-auto')} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} data-testid="select-seo-type"><option value="all">All types</option>{PAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select className={cn(aInput, 'w-auto')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} data-testid="select-seo-status"><option value="all">Any index status</option><option value="index">Indexed</option><option value="noindex">Noindex</option></select>
        <select className={cn(aInput, 'w-auto')} value={issue} onChange={(e) => { setIssue(e.target.value); setPage(1); }} data-testid="select-seo-issue"><option value="all">Any issue</option><option value="missing-title">Missing title</option><option value="missing-description">Missing description</option><option value="long-title">Title over 60</option><option value="long-description">Description over 160</option><option value="low-score">Score under 80</option></select>
        <div className="ml-auto flex gap-2">
          <button className={aBtn} onClick={exportCsv} data-testid="button-seo-export"><Download className="h-3 w-3" />CSV export</button>
          <button className={aBtn} onClick={() => fileRef.current?.click()} data-testid="button-seo-import"><Upload className="h-3 w-3" />CSV import</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.target.value = ''; }} />
        </div>
      </div>
      {sel.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--ph-indigo)]/40 bg-[color:var(--ph-indigo)]/10 p-2.5 text-xs">
          <span className="font-mono">{sel.length} selected</span>
          <button className={aBtn} onClick={() => applyBulk({ robots: 'noindex,follow' })} data-testid="button-bulk-noindex">Set noindex</button>
          <button className={aBtn} onClick={() => applyBulk({ robots: 'index,follow' })} data-testid="button-bulk-index">Set index</button>
          <button className={aBtn} onClick={() => applyBulk({ include_in_sitemap: true })} data-testid="button-bulk-sitemap-in">Include in sitemap</button>
          <button className={aBtn} onClick={() => applyBulk({ include_in_sitemap: false })} data-testid="button-bulk-sitemap-out">Exclude from sitemap</button>
          <select className={cn(aInput, 'w-auto py-1 text-xs')} defaultValue="" onChange={(e) => { if (e.target.value) applyBulk({ schema_type: e.target.value }); e.target.value = ''; }} data-testid="select-bulk-schema"><option value="">Schema type...</option>{SCHEMA_TYPES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      ) : null}
      {msg ? <p className="mt-3 text-xs text-emerald-200" data-testid="text-seo-msg">{msg}</p> : null}
      {bulk.isError ? <p className="mt-3 text-xs text-red-300">{errMsg(bulk.error)}</p> : null}
      <div className="scrollbar-thin mt-4 overflow-x-auto">
        {q.isLoading ? <SkeletonBlock className="h-64" /> : q.isError ? <p role="alert" className="py-8 text-center text-sm text-red-300">{errMsg(q.error)} <button className="underline" onClick={() => q.refetch()}>Retry</button></p> : (
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="border-b border-white/[0.07] text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2"><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? [] : items.map((i) => String(i.id)))} data-testid="checkbox-seo-all" /></th>
              {['Path', 'Type', 'Title', 'Desc', 'Index', 'Sitemap', 'Score'].map((h) => <th key={h} className="px-2 py-2 font-normal">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {items.map((p) => {
                const id = String(p.id);
                const dl = str(p.meta_description).length;
                const score = Number(p.score ?? 0);
                return (
                  <tr key={id} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => setEditId(id)} data-testid={`row-seo-${id}`}>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.includes(id)} onChange={() => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} data-testid={`checkbox-seo-${id}`} /></td>
                    <td className="px-2 py-2 font-mono text-xs">{str(p.path)}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{str(p.page_type)}</td>
                    <td className="max-w-[260px] truncate px-2 py-2">{str(p.title)}</td>
                    <td className={cn('px-2 py-2 font-mono text-xs', dl > 160 || dl < 50 ? 'text-amber-200' : 'text-muted-foreground')}>{dl}</td>
                    <td className="px-2 py-2 text-xs">{str(p.robots).includes('noindex') ? <span className="text-amber-200">noindex</span> : <span className="text-emerald-300">index</span>}</td>
                    <td className="px-2 py-2">{p.include_in_sitemap ? <Check className="h-4 w-4 text-emerald-300" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                    <td className="px-2 py-2"><span className={cn('rounded-md px-2 py-0.5 font-mono text-xs', scoreTone(score))}>{score}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!q.isLoading && !items.length ? <p className="py-8 text-center text-sm text-muted-foreground">No pages match these filters.</p> : null}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{str(data.total, '0')} pages</span>
        <div className="flex items-center gap-2">
          <button className={aBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} data-testid="button-seo-prev">Prev</button>
          <span className="font-mono">{page} / {str(data.totalPages, '1')}</span>
          <button className={aBtn} disabled={page >= Number(data.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)} data-testid="button-seo-next">Next</button>
        </div>
      </div>
      {editId ? <SeoPageEditor id={editId} onClose={() => setEditId(null)} /> : null}
    </Panel>
  );
}

const FIELDS = ['title', 'meta_description', 'canonical_url', 'robots', 'og_title', 'og_description', 'og_image_url', 'twitter_card', 'focus_keyword', 'schema_type', 'custom_jsonld', 'include_in_sitemap', 'sitemap_priority', 'changefreq', 'page_type'];

function SeoPageEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useGetSeoPage(id, { query: { queryKey: getGetSeoPageQueryKey(id) } });
  const hist = useGetSeoHistory(id, { query: { queryKey: getGetSeoHistoryQueryKey(id) } });
  const save = useSaveSeoPage();
  const restore = useRestoreSeoPage();
  const [d, setD] = useState<AnyObj | null>(null);
  const [jsonld, setJsonld] = useState('');
  const [jerr, setJerr] = useState<string | null>(null);
  const [view, setView] = useState<'edit' | 'history'>('edit');
  const init = useRef<string | null>(null);
  const raw = q.data as AnyObj | undefined;
  useEffect(() => {
    if (raw && init.current !== id) {
      init.current = id;
      const o: AnyObj = {}; FIELDS.forEach((f) => { o[f] = raw[f] ?? ''; });
      o.include_in_sitemap = !!raw.include_in_sitemap;
      setD(o);
      setJsonld(raw.custom_jsonld ? JSON.stringify(raw.custom_jsonld, null, 2) : '');
    }
  }, [raw, id]);
  const resolved = (raw?.resolved ?? {}) as AnyObj;
  const after = () => { void qc.invalidateQueries({ predicate: (x) => String(x.queryKey[0]).includes('/api/v1/seo') }); };
  const doSave = () => {
    if (!d) return;
    let cj: unknown = null;
    if (jsonld.trim()) { try { cj = JSON.parse(jsonld); } catch (e) { setJerr((e as Error).message); return; } }
    if (str(d.robots).startsWith('noindex') && IMPORTANT.test(str(raw?.path)) && !window.confirm('This is an important page. Setting noindex removes it from search results. Continue?')) return;
    const data: AnyObj = { ...d, custom_jsonld: cj, sitemap_priority: d.sitemap_priority === '' ? null : Number(d.sitemap_priority) };
    save.mutate({ id, data }, { onSuccess: () => { init.current = null; after(); } });
  };
  const set = (k: string) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value });
  const title = str(d?.title) || str(resolved.title);
  const desc = str(d?.meta_description) || str(resolved.meta_description);
  const ogImg = str(d?.og_image_url) || str(resolved.og_image_url);
  const url = str(d?.canonical_url) || str(resolved.canonical_url) || str(raw?.path);
  const checklist = arr<AnyObj>(resolved.checklist);
  const score = Number(resolved.score ?? 0);
  return (
    <Modal title={`SEO: ${str(raw?.path, '...')}`} onClose={onClose} wide>
      {!d ? <SkeletonBlock className="h-80" /> : (
        <>
          <div className="mb-4 flex gap-2">
            <button className={cn(aBtn, view === 'edit' && 'border-[color:var(--ph-indigo)]')} onClick={() => setView('edit')} data-testid="tab-seo-edit">Editor</button>
            <button className={cn(aBtn, view === 'history' && 'border-[color:var(--ph-indigo)]')} onClick={() => setView('history')} data-testid="tab-seo-history"><History className="h-3 w-3" />History</button>
            <a href={str(raw?.path)} target="_blank" rel="noreferrer" className={cn(aBtn, 'ml-auto')} data-testid="link-seo-view"><ExternalLink className="h-3 w-3" />View page</a>
          </div>
          {view === 'history' ? (
            hist.isLoading ? <SkeletonBlock className="h-40" /> : arr<AnyObj>(hist.data).length ? (
              <ul className="space-y-2">{arr<AnyObj>(hist.data).map((h) => (
                <li key={String(h.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] p-3 text-sm">
                  <div><div className="font-mono text-xs text-muted-foreground">{h.updated_at ? new Date(String(h.updated_at)).toLocaleString('en-IN') : ''} {h.updated_by ? `by ${str(h.updated_by)}` : ''}</div><div className="mt-1 truncate text-foreground/85">{str((h.value as AnyObj)?.title, '(no title override)')}</div></div>
                  <button className={aBtn} disabled={restore.isPending} onClick={() => restore.mutate({ id, data: { history_id: String(h.id) } }, { onSuccess: () => { init.current = null; after(); setView('edit'); } })} data-testid={`button-restore-seo-${String(h.id)}`}><RotateCcw className="h-3 w-3" />Restore</button>
                </li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No previous versions yet.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div className="grid gap-4">
                <LField label="Title" hint={<Counter n={str(d.title).length} max={60} placeholder={resolved.title} />}><input className={aInput} value={str(d.title)} placeholder={str(resolved.title)} onChange={set('title')} data-testid="input-seo-title" /></LField>
                <LField label="Meta description" hint={<Counter n={str(d.meta_description).length} max={160} placeholder={resolved.meta_description} />}><textarea className={cn(aInput, 'min-h-[80px]')} value={str(d.meta_description)} placeholder={str(resolved.meta_description)} onChange={set('meta_description')} data-testid="input-seo-description" /></LField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LField label="Focus keyword"><input className={aInput} value={str(d.focus_keyword)} onChange={set('focus_keyword')} data-testid="input-seo-keyword" /></LField>
                  <LField label="Canonical URL"><input className={aInput} value={str(d.canonical_url)} placeholder={str(resolved.canonical_url)} onChange={set('canonical_url')} data-testid="input-seo-canonical" /></LField>
                  <LField label="Robots" hint={/^\/(admin|dashboard|login|register)/.test(str(raw?.path)) ? 'App routes are forced to noindex unless explicitly overridden server-side.' : undefined}><select className={aInput} value={str(d.robots)} onChange={set('robots')} data-testid="select-seo-robots"><option value="">(default)</option>{ROBOTS.map((r) => <option key={r}>{r}</option>)}</select></LField>
                  <LField label="Page type"><select className={aInput} value={str(d.page_type)} onChange={set('page_type')} data-testid="select-seo-pagetype">{PAGE_TYPES.map((r) => <option key={r}>{r}</option>)}</select></LField>
                  <LField label="Schema type"><select className={aInput} value={str(d.schema_type)} onChange={set('schema_type')} data-testid="select-seo-schema"><option value="">(default)</option>{SCHEMA_TYPES.map((r) => <option key={r}>{r}</option>)}</select></LField>
                  <LField label="Twitter card"><select className={aInput} value={str(d.twitter_card)} onChange={set('twitter_card')} data-testid="select-seo-twitter"><option value="">(default)</option><option value="summary">summary</option><option value="summary_large_image">summary_large_image</option></select></LField>
                  <LField label="OG title"><input className={aInput} value={str(d.og_title)} placeholder={str(resolved.og_title)} onChange={set('og_title')} data-testid="input-seo-ogtitle" /></LField>
                  <LField label="OG image URL"><input className={aInput} value={str(d.og_image_url)} placeholder={str(resolved.og_image_url)} onChange={set('og_image_url')} data-testid="input-seo-ogimage" /></LField>
                </div>
                <LField label="OG description"><textarea className={cn(aInput, 'min-h-[60px]')} value={str(d.og_description)} placeholder={str(resolved.og_description)} onChange={set('og_description')} data-testid="input-seo-ogdesc" /></LField>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.include_in_sitemap} onChange={(e) => setD({ ...d, include_in_sitemap: e.target.checked })} data-testid="checkbox-seo-sitemap" />In sitemap</label>
                  <LField label="Priority"><input type="number" step="0.1" min="0" max="1" className={aInput} value={str(d.sitemap_priority)} onChange={set('sitemap_priority')} data-testid="input-seo-priority" /></LField>
                  <LField label="Change freq"><select className={aInput} value={str(d.changefreq)} onChange={set('changefreq')} data-testid="select-seo-changefreq"><option value="">(default)</option>{['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map((c) => <option key={c}>{c}</option>)}</select></LField>
                </div>
                <LField label="Custom JSON-LD (for FAQPage, add mainEntity question items)" hint={jerr ? <span className="text-red-300">Invalid JSON: {jerr}</span> : 'Validated before saving.'}>
                  <textarea className={cn(aInput, 'min-h-[120px] font-mono text-xs')} value={jsonld} onChange={(e) => { setJsonld(e.target.value); if (!e.target.value.trim()) { setJerr(null); return; } try { JSON.parse(e.target.value); setJerr(null); } catch (x) { setJerr((x as Error).message); } }} data-testid="input-seo-jsonld" />
                </LField>
                <button className={aBtn} type="button" onClick={() => setJsonld(JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: '', acceptedAnswer: { '@type': 'Answer', text: '' } }] }, null, 2))} data-testid="button-faq-template">Insert FAQPage template</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#f8f8fb] p-4 text-left">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Google preview</div>
                  <div className="mt-2 truncate text-xs text-slate-600">{url}</div>
                  <div className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{title.slice(0, 62)}{title.length > 62 ? '...' : ''}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-slate-700">{desc.slice(0, 160)}{desc.length > 160 ? '...' : ''}</div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <div className="aspect-[1.91/1] bg-[radial-gradient(circle_at_30%_30%,var(--ph-indigo),transparent_60%),radial-gradient(circle_at_80%_70%,var(--ph-pink),transparent_55%)]">{ogImg ? <img src={ogImg} alt="" className="h-full w-full object-cover" /> : null}</div>
                  <div className="p-3"><div className="font-mono text-[10px] uppercase text-muted-foreground">Facebook / LinkedIn / X</div><div className="mt-1 line-clamp-1 font-semibold">{str(d.og_title) || title}</div><div className="line-clamp-2 text-xs text-muted-foreground">{str(d.og_description) || desc}</div></div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] p-4">
                  <div className="flex items-center justify-between"><span className="font-semibold">SEO score</span><span className={cn('rounded-lg px-3 py-1 font-display text-2xl font-bold', scoreTone(score))} data-testid="text-seo-score">{score}</span></div>
                  <ul className="mt-3 space-y-1.5">{checklist.map((c, i) => <li key={i} className="flex gap-2 text-xs">{c.ok ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />}<span className={c.ok ? 'text-muted-foreground' : 'text-foreground'}>{str(c.label)}</span></li>)}</ul>
                  <p className="mt-3 text-[11px] text-muted-foreground">Score reflects saved values. Save to recalculate.</p>
                </div>
              </div>
            </div>
          )}
          {save.isError ? <p className="mt-4 text-sm text-red-300">{errMsg(save.error)}</p> : null}
          {restore.isError ? <p className="mt-4 text-sm text-red-300">{errMsg(restore.error)}</p> : null}
          {view === 'edit' ? <div className="mt-6 flex justify-end gap-2"><button className={aBtn} onClick={onClose}>Close</button><button className={aBtnPrimary} disabled={save.isPending || !!jerr} onClick={doSave} data-testid="button-save-seo">{save.isPending ? 'Saving...' : save.isSuccess ? 'Saved' : <><Save className="h-3.5 w-3.5" />Save</>}</button></div> : null}
        </>
      )}
    </Modal>
  );
}

function Counter({ n, max, placeholder }: { n: number; max: number; placeholder?: unknown }) {
  return <span className={cn('font-mono', n > max ? 'text-red-300' : n > max * 0.9 ? 'text-amber-200' : '')}>{n}/{max}{n === 0 && placeholder ? ' (using default)' : ''}</span>;
}

function useSettingsDraft() {
  const qc = useQueryClient();
  const q = useGetSeoSettings({ query: { queryKey: getGetSeoSettingsQueryKey() } });
  const save = useSaveSeoSettings();
  const [d, setD] = useState<AnyObj | null>(null);
  const init = useRef(false);
  useEffect(() => { if (q.data && !init.current) { init.current = true; setD(structuredClone(q.data as AnyObj)); } }, [q.data]);
  const doSave = (data: AnyObj) => save.mutate({ data }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getGetSeoSettingsQueryKey() }); void qc.invalidateQueries({ predicate: (x) => String(x.queryKey[0]).includes('/api/v1/seo') }); } });
  return { q, save, d, setD, doSave };
}

function SeoSettings() {
  const { q, save, d, setD, doSave } = useSettingsDraft();
  if (q.isLoading || !d) return <SkeletonBlock className="h-80" />;
  const { organisation_schema: _o, id: _i, updated_at: _u, updated_by: _ub, ...rest } = d;
  void _o; void _i; void _u; void _ub;
  return (
    <Panel title="Global SEO settings" actions={<button className={aBtnPrimary} disabled={save.isPending} onClick={() => doSave(d)} data-testid="button-save-seo-settings"><Save className="h-3.5 w-3.5" />{save.isPending ? 'Saving...' : save.isSuccess ? 'Saved' : 'Save'}</button>}>
      <p className="mb-4 text-xs text-muted-foreground">Title template supports <code className="font-mono">%page%</code> and <code className="font-mono">%site%</code>. GA4 and verification tags are injected into every page head. Extra head HTML is sanitised server-side.</p>
      <JsonForm value={rest} onChange={(v) => setD({ ...d, ...v })} path="seo-settings" />
      {save.isError ? <p className="mt-3 text-sm text-red-300">{errMsg(save.error)}</p> : null}
    </Panel>
  );
}

function SeoSchema() {
  const { q, save, d, setD, doSave } = useSettingsDraft();
  const home = useResolveSeo({ path: '/' }, { query: { queryKey: getResolveSeoQueryKey({ path: '/' }) } });
  if (q.isLoading || !d) return <SkeletonBlock className="h-80" />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Organization / WebSite JSON-LD" actions={<button className={aBtnPrimary} disabled={save.isPending} onClick={() => doSave(d)} data-testid="button-save-schema"><Save className="h-3.5 w-3.5" />{save.isSuccess ? 'Saved' : 'Save'}</button>}>
        <p className="mb-3 text-xs text-muted-foreground">Legal name, logo, address, phone, email and social profile URLs. Used on every page.</p>
        <RawJson value={d.organisation_schema ?? {}} onChange={(v) => setD({ ...d, organisation_schema: v })} testId="input-org-schema" />
        {save.isError ? <p className="mt-3 text-sm text-red-300">{errMsg(save.error)}</p> : null}
      </Panel>
      <Panel title="Resolved output for /">
        <p className="mb-3 text-xs text-muted-foreground">Per-page schema type and FAQ items are edited in each page's editor (Pages tab).</p>
        {home.isLoading ? <SkeletonBlock className="h-60" /> : <pre className="scrollbar-thin max-h-[420px] overflow-auto rounded-xl bg-black/30 p-3 font-mono text-[11px] text-muted-foreground">{JSON.stringify(home.data ?? {}, null, 2)}</pre>}
      </Panel>
    </div>
  );
}

function SitemapRobots() {
  const { d, setD, doSave, save } = useSettingsDraft();
  const [type, setType] = useState<'sitemap' | 'robots'>('sitemap');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const load = async (t: 'sitemap' | 'robots') => {
    setLoading(true);
    try { const r = await fetch(`/api/v1/seo/preview?type=${t}`, { credentials: 'include' }); setText(await r.text()); } catch { setText('Could not load preview.'); }
    setLoading(false);
  };
  useEffect(() => { void load(type); }, [type]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Panel title="Robots & sitemap settings" actions={<button className={aBtnPrimary} disabled={!d || save.isPending} onClick={() => { if (d) doSave(d); setTimeout(() => void load(type), 800); }} data-testid="button-save-robots"><Save className="h-3.5 w-3.5" />Save</button>}>
        {!d ? <SkeletonBlock className="h-40" /> : (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.sitemap_enabled} onChange={(e) => setD({ ...d, sitemap_enabled: e.target.checked })} data-testid="checkbox-sitemap-enabled" />Sitemap enabled</label>
            <LField label="Extra robots.txt rules" hint="/admin, /dashboard and /api are always disallowed."><textarea className={cn(aInput, 'min-h-[160px] font-mono text-xs')} value={str(d.robots_extra_rules)} onChange={(e) => setD({ ...d, robots_extra_rules: e.target.value })} data-testid="input-robots-rules" /></LField>
            <p className="text-xs text-muted-foreground">Toggle individual pages in or out of the sitemap from the Pages tab (bulk actions or page editor).</p>
          </div>
        )}
      </Panel>
      <Panel title="Live preview" actions={<>{(['sitemap', 'robots'] as const).map((t) => <button key={t} className={cn(aBtn, type === t && 'border-[color:var(--ph-indigo)]')} onClick={() => setType(t)} data-testid={`button-preview-${t}`}>{t === 'sitemap' ? 'sitemap.xml' : 'robots.txt'}</button>)}<a className={aBtn} href={type === 'sitemap' ? '/sitemap.xml' : '/robots.txt'} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a></>}>
        {loading ? <SkeletonBlock className="h-72" /> : <pre className="scrollbar-thin max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-[11px] text-muted-foreground" data-testid="text-preview">{text}</pre>}
      </Panel>
    </div>
  );
}

export function RedirectsPanel({ prefillFrom, onDone }: { prefillFrom?: string; onDone?: () => void } = {}) {
  const qc = useQueryClient();
  const q = useGetRedirects({ query: { queryKey: getGetRedirectsQueryKey() } });
  const create = useCreateRedirect();
  const update = useUpdateRedirect();
  const del = useDeleteRedirect();
  const [form, setForm] = useState({ from_path: prefillFrom ?? '', to_path: '', status_code: 301 });
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const inv = () => { void qc.invalidateQueries({ queryKey: getGetRedirectsQueryKey() }); void qc.invalidateQueries({ queryKey: getGetNotFoundLogQueryKey() }); };
  const runTest = async () => {
    const r = await fetch('/api/v1/seo/redirects/test', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    setTest({ ok: r.ok && j.valid !== false, message: str(j.message ?? j.error, r.ok ? 'Redirect is valid.' : 'Invalid redirect') });
  };
  const add = () => create.mutate({ data: { ...form, is_active: true } }, { onSuccess: () => { setForm({ from_path: '', to_path: '', status_code: 301 }); setTest(null); inv(); onDone?.(); } });
  const rows = arr<AnyObj>(q.data);
  const importRedirects=async(file:File)=>{
    try{
      const lines=(await file.text()).trim().split(/\r?\n/);
      const header=lines.shift()?.split(',').map(v=>v.replace(/^"|"$/g,'').trim())??[];
      if(!header.includes('from_path')||!header.includes('to_path'))throw new Error('CSV needs from_path,to_path,status_code columns.');
      let count=0;
      for(const line of lines.filter(Boolean)){
        const cells=line.split(',').map(v=>v.replace(/^"|"$/g,'').trim());
        const row=Object.fromEntries(header.map((key,i)=>[key,cells[i]]));
        await create.mutateAsync({data:{from_path:row.from_path,to_path:row.to_path,status_code:Number(row.status_code||301),is_active:true}});
        count++;
      }
      setTest({ok:true,message:`Imported ${count} redirects.`});inv();
    }catch(error){setTest({ok:false,message:errMsg(error)});inv();}
  };
  return (
    <div className="space-y-4">
      {!prefillFrom ? <h1 className="font-display text-3xl font-bold">Redirects</h1> : null}
      <Panel title="Add redirect">
        <label className="mb-4 block text-xs text-muted-foreground">Import redirects CSV
          <input type="file" accept=".csv" className="ml-3 max-w-full" onChange={e=>{if(e.target.files?.[0])void importRedirects(e.target.files[0]);e.target.value='';}} />
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <LField label="From path"><input className={cn(aInput, 'font-mono')} placeholder="/old-page" value={form.from_path} onChange={(e) => setForm({ ...form, from_path: e.target.value })} data-testid="input-redirect-from" /></LField>
          <LField label="To local path"><input className={cn(aInput, 'font-mono')} placeholder="/new-page" value={form.to_path} onChange={(e) => setForm({ ...form, to_path: e.target.value })} data-testid="input-redirect-to" /></LField>
          <LField label="Type"><select className={aInput} value={form.status_code} onChange={(e) => setForm({ ...form, status_code: Number(e.target.value) })} data-testid="select-redirect-code"><option value={301}>301</option><option value={302}>302</option></select></LField>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={aBtn} onClick={runTest} disabled={!form.from_path || !form.to_path} data-testid="button-test-redirect">Test (loop check)</button>
          <button className={aBtnPrimary} onClick={add} disabled={create.isPending || !form.from_path || !form.to_path} data-testid="button-add-redirect"><Plus className="h-3.5 w-3.5" />Add redirect</button>
          {test ? <span className={cn('text-xs', test.ok ? 'text-emerald-300' : 'text-red-300')} data-testid="text-redirect-test">{test.message}</span> : null}
        </div>
        {create.isError ? <p className="mt-2 text-sm text-red-300">{errMsg(create.error)}</p> : null}
      </Panel>
      {!prefillFrom ? (
        <Panel title={`${rows.length} redirects`}>
          {q.isLoading ? <SkeletonBlock className="h-40" /> : rows.length ? (
            <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-white/[0.07] text-left font-mono text-[10px] uppercase text-muted-foreground">{['From', 'To', 'Code', 'Hits', 'Active', ''].map((h) => <th key={h} className="px-2 py-2 font-normal">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/[0.05]">{rows.map((r) => (
                <tr key={String(r.id)} data-testid={`row-redirect-${String(r.id)}`}>
                  <td className="px-2 py-2 font-mono text-xs">{str(r.from_path)}</td>
                  <td className="px-2 py-2 font-mono text-xs">{str(r.to_path)}</td>
                  <td className="px-2 py-2"><select className={cn(aInput, 'w-20 py-1 text-xs')} value={Number(r.status_code)} onChange={(e) => update.mutate({ id: String(r.id), data: { ...r, status_code: Number(e.target.value) } }, { onSuccess: inv })} data-testid={`select-redirect-code-${String(r.id)}`}><option value={301}>301</option><option value={302}>302</option></select></td>
                  <td className="px-2 py-2 font-mono text-xs">{str(r.hit_count, '0')}</td>
                  <td className="px-2 py-2"><input type="checkbox" checked={!!r.is_active} onChange={(e) => update.mutate({ id: String(r.id), data: { ...r, is_active: e.target.checked } }, { onSuccess: inv })} data-testid={`checkbox-redirect-active-${String(r.id)}`} /></td>
                  <td className="px-2 py-2 text-right"><button className={cn(aBtn, 'text-red-300')} onClick={() => { if (window.confirm('Delete redirect?')) del.mutate({ id: String(r.id) }, { onSuccess: inv }); }} data-testid={`button-delete-redirect-${String(r.id)}`}><Trash2 className="h-3 w-3" /></button></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No redirects yet.</p>}
          {update.isError ? <p className="mt-2 text-sm text-red-300">{errMsg(update.error)}</p> : null}
        </Panel>
      ) : null}
    </div>
  );
}

function NotFoundMonitor() {
  const q = useGetNotFoundLog({ query: { queryKey: getGetNotFoundLogQueryKey() } });
  const [from, setFrom] = useState<string | null>(null);
  const rows = arr<AnyObj>(q.data);
  return (
    <Panel title="404 monitor">
      {q.isLoading ? <SkeletonBlock className="h-40" /> : rows.length ? (
        <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-white/[0.07] text-left font-mono text-[10px] uppercase text-muted-foreground">{['Path', 'Hits', 'Last seen', ''].map((h) => <th key={h} className="px-2 py-2 font-normal">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-white/[0.05]">{rows.map((r, i) => (
            <tr key={i} data-testid={`row-404-${i}`}>
              <td className="px-2 py-2 font-mono text-xs">{str(r.path)}</td>
              <td className="px-2 py-2 font-mono text-xs">{str(r.count)}</td>
              <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{r.last_seen ? new Date(String(r.last_seen)).toLocaleString('en-IN') : ''}</td>
              <td className="px-2 py-2 text-right"><button className={aBtn} onClick={() => setFrom(str(r.path))} data-testid={`button-404-redirect-${i}`}>Create redirect</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="py-6 text-center text-sm text-muted-foreground">No 404s logged. Nice and tidy.</p>}
      {from ? <Modal title={`Redirect ${from}`} onClose={() => setFrom(null)}><RedirectsPanel prefillFrom={from} onDone={() => setFrom(null)} /></Modal> : null}
    </Panel>
  );
}
