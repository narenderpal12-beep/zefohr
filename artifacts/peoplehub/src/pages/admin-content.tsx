/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearch } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Copy, Eye, EyeOff, ExternalLink, FileText, History, Layers, Link2, ListTree, Lock, Plus, RotateCcw, Save, Settings2, Trash2, Unlink, X,
} from 'lucide-react';
import {
  useGetContent, useSaveContent, useResetContent, useGetContentHistory, useGetAdminRecords, useCreateAdminRecord, useUpdateAdminRecord, useDeleteAdminRecord,
  getGetContentQueryKey, getGetContentHistoryQueryKey, getGetAdminRecordsQueryKey, getGetPagesQueryKey, getGetAdminSummaryQueryKey,
} from '@workspace/api-client-react';
import { arr, errMsg, str, type AnyObj } from '@/lib/content';
import { SkeletonBlock } from '@/components/site/primitives';
import { CustomBlock } from '@/components/site/page-blocks';
import { JsonForm, RawJson, aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import {
  ORIGINAL, SECTION_TYPES, expandOriginal, homeNativeBlocks, TYPE_META, ROUTE_KEYS, buildCatalogue, cleanSlug, confirmLeave, customTemplate, fmtSize, getIn, isNativePath, makeBlock, newBlockId,
  pagesUsingKey, setIn, sizeOf, slugify, useUnsavedGuard, validateSections, validateSlug, type Block, type PageEntry,
} from '@/lib/site-pages';
import { cn } from '@/lib/utils';
import { HeroSliderEditor } from '@/components/admin/hero-slider-editor';

const PAGE_LIMIT = 1500000;
const LAYOUT_LIMIT = 2100000;
const clone = <T,>(v: T): T => structuredClone(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const KIND_LABEL: Record<PageEntry['kind'], string> = { native: 'Website page', feature: 'Feature detail', service: 'Service detail', legal: 'Legal page', dynamic: 'Your page' };

/* ---------- small shared pieces ---------- */
function Card({ title, sub, actions, children, className, tone }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; tone?: 'shared' | 'owned' }) {
  return (
    <section className={cn('glass rounded-2xl p-5', tone === 'shared' && 'border-l-2 !border-l-[color:var(--ph-cyan)]', tone === 'owned' && 'border-l-2 !border-l-[color:var(--ph-pink)]', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="font-display text-lg font-bold">{title}</h2>{sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}</div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'shared' | 'owned' | 'draft' | 'live' }) {
  const t = { muted: 'border-white/10 text-muted-foreground', shared: 'border-[color:var(--ph-cyan)]/40 text-[color:var(--ph-cyan)]', owned: 'border-[color:var(--ph-pink)]/40 text-[color:var(--ph-pink)]', draft: 'border-amber-300/40 text-amber-300', live: 'border-emerald-300/40 text-emerald-300' }[tone];
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', t)}>{children}</span>;
}
function Notice({ kind, children }: { kind: 'ok' | 'err' | 'info'; children: ReactNode }) {
  return <div role={kind === 'err' ? 'alert' : 'status'} className={cn('rounded-xl border px-3 py-2 text-sm', kind === 'ok' && 'border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-300', kind === 'err' && 'border-red-300/30 bg-red-300/[0.06] text-red-300', kind === 'info' && 'border-white/10 bg-white/[0.03] text-muted-foreground')}>{children}</div>;
}
function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()} className="glass-strong max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className={aBtn} aria-label="Close" data-testid="button-close-modal"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>{children}{hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}</label>;
}

function useContentQ() { return useGetContent({ query: { queryKey: getGetContentQueryKey() } }); }
function usePageRecords() { return useGetAdminRecords('pages', { query: { queryKey: getGetAdminRecordsQueryKey('pages') } }); }
function HomepageVersionEditor({ content }: { content: AnyObj }) {
  const qc = useQueryClient();
  const save = useSaveContent();
  const settings = (content.homepage ?? {}) as AnyObj;
  const saved = str(settings.activeVariant, 'original') === 'alternate' ? 'alternate' : 'original';
  const [draft, setDraft] = useState<'original' | 'alternate'>(saved);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => setDraft(saved), [saved]);
  const persist = () => {
    const latest = ((qc.getQueryData(getGetContentQueryKey()) ?? content) as AnyObj).homepage ?? {};
    const next = { ...latest, activeVariant: draft };
    save.mutate({ key: 'homepage', data: next }, {
      onSuccess: () => {
        qc.setQueryData(getGetContentQueryKey(), (old: any) => old ? { ...old, homepage: next } : old);
        void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
        setMessage({ kind: 'ok', text: `${draft === 'alternate' ? 'New' : 'Current'} homepage is now selected for /.` });
      },
      onError: (error) => setMessage({ kind: 'err', text: errMsg(error) }),
    });
  };
  return (
    <Card title="Homepage design" sub="Choose which built-in design visitors see at /. Your shared header, footer and theme stay the same." tone="owned">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Homepage shown on the website">
          <select className={aInput} value={draft} onChange={(event) => { setDraft(event.target.value as 'original' | 'alternate'); setMessage(null); }} data-testid="select-homepage-version">
            <option value="original">Current homepage</option>
            <option value="alternate">New homepage</option>
          </select>
        </Field>
        <button type="button" className={aBtnPrimary} disabled={save.isPending || draft === saved} onClick={persist} data-testid="button-save-homepage-version">
          <Save className="h-3.5 w-3.5" />{save.isPending ? 'Saving...' : 'Save homepage'}
        </button>
      </div>
      {message ? <div className="mt-3"><Notice kind={message.kind}>{message.text}</Notice></div> : null}
      {save.isError && !message ? <div className="mt-3"><Notice kind="err">{errMsg(save.error)}</Notice></div> : null}
    </Card>
  );
}
function useInvalidatePages() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: getGetAdminRecordsQueryKey('pages') });
    void qc.invalidateQueries({ queryKey: getGetPagesQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
  };
}

/* ---------- Section list builder ---------- */
function BlockEditor({ block, onChange, onBusy, content }: { block: Block; onChange: (b: Block) => void; onBusy: (b: boolean) => void; content: AnyObj }) {
  const meta = TYPE_META[block.type];
  const [preview, setPreview] = useState(false);
  if (block.type === 'original') return <p className="text-sm text-muted-foreground">Shows this page exactly as built. Move it among your added sections or hide it. Its text and images are edited in <strong className="text-foreground">Linked sections</strong> below and are shared with other pages that use them.</p>;
  if (meta?.key) {
    const linked = !Object.keys(block.content ?? {}).length;
    return (
      <div className="space-y-3">
        {linked ? (
          <Notice kind="info"><span className="inline-flex flex-wrap items-center gap-2"><Link2 className="h-3.5 w-3.5" />Linked to shared <code className="font-mono text-foreground">{meta.key}</code> content. Edits in Global settings change every page that uses it.
            <button type="button" className={aBtn} onClick={() => onChange({ ...block, content: clone((content[meta.key ?? ""] ?? {}) as AnyObj) })} data-testid={`button-own-${block.id}`}><Copy className="h-3 w-3" />Make an independent copy for this page</button></span></Notice>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2"><Badge tone="owned">This page only</Badge><span className="text-xs text-muted-foreground">Independent copy. Shared {meta.key} content is unaffected.</span>
              <button type="button" className={aBtn} onClick={() => { if (window.confirm('Discard this copy and use the shared content again?')) onChange({ ...block, content: {} }); }} data-testid={`button-relink-${block.id}`}><Unlink className="h-3 w-3" />Use shared content again</button></div>
            <JsonForm value={block.content} onChange={(v) => onChange({ ...block, content: v })} path={`block-${block.type}`} onBusyChange={onBusy} />
          </>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {block.type === 'heroSlider'
        ? <HeroSliderEditor id={block.id} value={block.content} onChange={(v) => onChange({ ...block, content: v })} onBusy={onBusy} />
        : <JsonForm value={block.content} onChange={(v) => onChange({ ...block, content: v })} path={`block-${block.type}`} onBusyChange={onBusy} />}
      <button type="button" className={aBtn} onClick={() => setPreview((p) => !p)} data-testid={`button-preview-${block.id}`}><Eye className="h-3 w-3" />{preview ? 'Hide draft preview' : 'Show draft preview'}</button>
      {preview ? (
        <div className={cn(block.type === 'heroSlider' ? 'max-h-[850px] overflow-auto' : 'pointer-events-none max-h-[520px] overflow-hidden', 'rounded-xl border border-dashed border-white/15')} onClickCapture={e => { if(block.type === 'heroSlider' && (e.target as Element).closest('a')) e.preventDefault(); }} aria-label="Draft preview" data-testid={`preview-block-${block.id}`}>
          <p className="px-3 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Draft preview, not public</p>
          <CustomBlock type={block.type} content={block.content} preview />
        </div>
      ) : null}
    </div>
  );
}

export function SectionsEditor({ value, onChange, allowOriginal, onBusyChange, content, expandable }: { value: Block[]; onChange: (v: Block[]) => void; allowOriginal: boolean; onBusyChange: (b: boolean) => void; content: AnyObj; expandable?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const anyBusy = Object.values(busy).some(Boolean);
  const cb = useRef(onBusyChange); cb.current = onBusyChange;
  useEffect(() => { cb.current(anyBusy); }, [anyBusy]);
  const types = SECTION_TYPES.filter((t) => t !== 'original' || (allowOriginal && !value.some((b) => b.type === 'original')));
  const [addType, setAddType] = useState<string>('text');
  const move = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const set = (i: number, b: Block) => { const n = [...value]; n[i] = b; onChange(n); };
  const add = () => {
    if (value.length >= 40) return;
    const t = types.includes(addType as any) ? addType : 'text';
    const b = t === 'original' ? clone(ORIGINAL) : makeBlock(t);
    onChange([...value, b]); setOpen((o) => ({ ...o, [b.id]: true }));
  };
  return (
    <fieldset disabled={anyBusy} className="min-w-0 space-y-2" aria-busy={anyBusy}>
      {expandable && value.some((b) => b.type === 'original') ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--ph-cyan)]/30 bg-[color:var(--ph-cyan)]/[0.05] p-3 text-xs text-muted-foreground" data-testid="status-home-expand">
          <ListTree className="h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" />
          <span className="min-w-[200px] flex-1">The Original block holds all 12 homepage sections (Hero to Call to action). Expand it to move, hide or reset each one separately. Content stays linked to the shared sections.</span>
          <button type="button" className={aBtn} disabled={value.length + 11 > 40} title={value.length + 11 > 40 ? 'Remove added sections first so the expanded layout stays within 40 sections.' : undefined} onClick={() => { if (window.confirm('Expand the Original block into 12 separate homepage sections in their current order? Other sections keep their place. This is a draft until you click Save layout; the live page does not change before then.')) onChange(expandOriginal(value)); }} data-testid="button-expand-original"><ListTree className="h-3 w-3" />Expand into individual sections</button>
        </div>
      ) : null}
      {!value.length ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground" data-testid="status-no-sections">No sections yet. Add your first section below.</div> : null}
      {value.map((b, i) => {
        const meta = TYPE_META[b.type] ?? { label: b.type, desc: '' };
        const isOpen = !!open[b.id];
        const owned = !meta.key || Object.keys(b.content ?? {}).length > 0;
        return (
          <div key={b.id} className={cn('rounded-2xl border bg-white/[0.015] transition', b.enabled === false ? 'border-dashed border-white/10 opacity-60' : 'border-white/[0.08]')} data-testid={`block-${b.id}`}>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <span className="w-6 text-center font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [b.id]: !isOpen }))} className="flex min-w-0 flex-1 items-center gap-2 text-left" data-testid={`button-toggle-block-${b.id}`}>
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition', !isOpen && '-rotate-90')} />
                <span className="truncate text-sm font-semibold">{meta.label}</span>
                {b.type === 'original' ? <Badge tone="shared">Built-in</Badge> : owned ? <Badge tone="owned">Page only</Badge> : <Badge tone="shared">Shared</Badge>}
                {b.enabled === false ? <Badge>Hidden</Badge> : null}
                <span className="hidden truncate font-mono text-[10px] text-muted-foreground md:inline">#{b.id}</span>
              </button>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Reorder ${meta.label}`}>
                <button type="button" className={cn(aBtn, 'min-h-9 min-w-[82px] justify-center whitespace-nowrap border-white/20 bg-white/[0.06] font-semibold text-foreground')} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${meta.label} up`} data-testid={`button-block-up-${b.id}`}><ArrowUp className="h-3.5 w-3.5" />Move up</button>
                <button type="button" className={cn(aBtn, 'min-h-9 min-w-[82px] justify-center whitespace-nowrap border-white/20 bg-white/[0.06] font-semibold text-foreground')} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move ${meta.label} down`} data-testid={`button-block-down-${b.id}`}><ArrowDown className="h-3.5 w-3.5" />Move down</button>
                <button type="button" className={aBtn} onClick={() => set(i, { ...b, enabled: b.enabled === false })} aria-label={b.enabled === false ? 'Show' : 'Hide'} data-testid={`button-block-visibility-${b.id}`}>{b.enabled === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>
                {b.type !== 'original' ? <>
                  <button type="button" className={aBtn} onClick={() => {
                    const msg = meta.key
                      ? `Reset "${meta.label}" on this page? This drops the page-only copy and relinks to the shared ${meta.key} content. The shared site-wide content is NOT reset. Nothing is live until you Save.`
                      : `Reset "${meta.label}" to its default content? Your edits in this section are replaced. Nothing is live until you Save.`;
                    if (window.confirm(msg)) set(i, { ...b, content: meta.key ? {} : customTemplate(b.type) });
                  }} aria-label="Reset to default" data-testid={`button-block-reset-${b.id}`}><RotateCcw className="h-3 w-3" />Reset</button>
                  <button type="button" className={aBtn} onClick={() => { if (value.length >= 40) return; const n = [...value]; n.splice(i + 1, 0, { ...clone(b), id: newBlockId(b.type) }); onChange(n); }} disabled={value.length >= 40} aria-label="Duplicate" data-testid={`button-block-duplicate-${b.id}`}><Copy className="h-3 w-3" /></button>
                  <button type="button" className={cn(aBtn, 'text-red-300')} onClick={() => { if (window.confirm(`Delete the "${meta.label}" section from this page? This cannot be undone after saving.`)) onChange(value.filter((x) => x.id !== b.id)); }} aria-label="Delete" data-testid={`button-block-delete-${b.id}`}><Trash2 className="h-3 w-3" /></button>
                </> : null}
              </div>
            </div>
            {isOpen ? <div className="border-t border-white/[0.06] p-4"><BlockEditor block={b} content={content} onChange={(nb) => set(i, nb)} onBusy={(v) => setBusy((s) => ({ ...s, [b.id]: v }))} /></div> : null}
          </div>
        );
      })}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-white/15 p-3">
        <div className="min-w-[220px] flex-1">
          <Field label="Add a section" hint={TYPE_META[addType]?.desc}>
            <select className={aInput} value={addType} onChange={(e) => setAddType(e.target.value)} data-testid="select-add-section">
              {types.map((t) => <option key={t} value={t}>{TYPE_META[t]?.label ?? t}</option>)}
            </select>
          </Field>
        </div>
        <button type="button" className={aBtnPrimary} onClick={add} disabled={value.length >= 40} data-testid="button-add-section"><Plus className="h-3.5 w-3.5" />Add section</button>
        <span className="w-full text-[11px] text-muted-foreground">{value.length} of 40 sections</span>
      </div>
    </fieldset>
  );
}

/* ---------- Shared (global) section editor, optionally scoped to a sub-path ---------- */
export function SharedSectionEditor({ contentKey, sub = [], title, defaultOpen = false, scopeNote }: { contentKey: string; sub?: (string | number)[]; title?: string; defaultOpen?: boolean; scopeNote?: string }) {
  const qc = useQueryClient();
  const content = useContentQ();
  const data = (content.data ?? {}) as AnyObj;
  const server = getIn(data[contentKey], sub);
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState<any>(null);
  const [mode, setMode] = useState<'form' | 'raw' | 'history'>('form');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (open && draft === null && content.data) setDraft(clone(server ?? {})); }, [open, draft, content.data, server]);
  const dirty = draft !== null && !same(draft, server ?? {});
  useUnsavedGuard(`shared:${contentKey}:${sub.join('.')}`, dirty);
  const save = useSaveContent();
  const reset = useResetContent();
  const history = useGetContentHistory(contentKey, { query: { queryKey: getGetContentHistoryQueryKey(contentKey), enabled: open && mode === 'history' } });
  const after = () => { void qc.invalidateQueries({ queryKey: getGetContentQueryKey() }); void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey(contentKey) }); };
  const doSave = () => {
    const latest = ((qc.getQueryData(getGetContentQueryKey()) ?? data) as AnyObj)[contentKey];
    const next = sub.length ? setIn(clone(latest ?? {}), sub, draft) : draft;
    save.mutate({ key: contentKey, data: next }, { onSuccess: () => { qc.setQueryData(getGetContentQueryKey(), (o: any) => (o ? { ...o, [contentKey]: next } : o)); setSaved(true); setTimeout(() => setSaved(false), 2500); after(); } });
  };
  const doReset = () => {
    if (!window.confirm(`Reset all "${contentKey}" content to built-in defaults? This affects every page that uses it.`)) return;
    reset.mutate({ key: contentKey }, { onSuccess: (d) => { const v = (d as AnyObj)?.value ?? d; qc.setQueryData(getGetContentQueryKey(), (o: any) => (o ? { ...o, [contentKey]: v } : o)); setDraft(clone(getIn(v, sub) ?? {})); after(); } });
  };
  const used = pagesUsingKey(contentKey);
  const tid = `${contentKey}${sub.length ? `-${sub.join('-')}` : ''}`;
  return (
    <Card tone="shared" title={<span className="inline-flex flex-wrap items-center gap-2">{title ?? contentKey}<Badge tone="shared">Shared</Badge>{dirty ? <Badge tone="draft">Unsaved</Badge> : null}</span>}
      sub={scopeNote ?? (used.length > 1 ? `Used on ${used.length} pages: ${used.slice(0, 6).join(', ')}${used.length > 6 ? '...' : ''}` : used.length ? `Used on ${used[0]}` : 'Site-wide setting')}
      actions={<button type="button" className={aBtn} onClick={() => { if (open && dirty && !window.confirm('Close with unsaved changes? They will be discarded.')) return; if (open) setDraft(null); setOpen(!open); }} data-testid={`button-open-shared-${tid}`}>{open ? 'Close' : 'Edit'}<ChevronDown className={cn('h-3 w-3 transition', open && 'rotate-180')} /></button>}>
      {open ? (
        content.isLoading || draft === null ? <SkeletonBlock className="h-40" /> : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['form', 'raw', 'history'] as const).map((m) => <button key={m} type="button" className={cn(aBtn, mode === m && 'border-[color:var(--ph-indigo)] text-foreground')} onClick={() => setMode(m)} disabled={busy} data-testid={`tab-content-${m}-${tid}`}>{m === 'form' ? 'Form' : m === 'raw' ? 'Raw JSON' : <><History className="h-3 w-3" />History</>}</button>)}
              <span className="flex-1" />
              {!sub.length ? <button type="button" className={aBtn} onClick={doReset} disabled={reset.isPending || busy} data-testid={`button-reset-${tid}`}><RotateCcw className="h-3 w-3" />Reset to default</button> : null}
              <button type="button" className={aBtn} onClick={() => setDraft(clone(server ?? {}))} disabled={!dirty || busy} data-testid={`button-revert-${tid}`}>Revert</button>
              <button type="button" className={aBtnPrimary} onClick={doSave} disabled={save.isPending || busy || !dirty} data-testid={`button-save-${tid}`}>{saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{save.isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}</button>
            </div>
            {save.isError ? <Notice kind="err">{errMsg(save.error)}</Notice> : null}
            {reset.isError ? <Notice kind="err">{errMsg(reset.error)}</Notice> : null}
            {contentKey === 'theme' || contentKey === 'brand' ? <p className="text-xs text-muted-foreground">Tip: the <Link href={contentKey === 'theme' ? '/admin/appearance' : '/admin/branding'} className="text-[color:var(--ph-cyan)] underline">{contentKey === 'theme' ? 'Appearance' : 'Branding'}</Link> tab has friendlier controls.</p> : null}
            {contentKey === 'nav' || contentKey === 'footer' ? <p className="text-xs text-muted-foreground">Tip: the <Link href="/admin/menus" className="text-[color:var(--ph-cyan)] underline">Menus</Link> tab lets you pick pages from a list.</p> : null}
            {mode === 'form' ? <JsonForm value={draft} onChange={setDraft} path={sub.length ? `${contentKey}-${sub.join('-')}` : contentKey} onBusyChange={setBusy} /> : null}
            {mode === 'raw' ? <RawJson value={draft} onChange={setDraft} testId={`input-raw-${tid}`} /> : null}
            {mode === 'history' ? (history.isLoading ? <SkeletonBlock className="h-32" /> : history.isError ? <Notice kind="err">{errMsg(history.error)} <button type="button" className="underline" onClick={() => history.refetch()}>Retry</button></Notice> : arr<AnyObj>(history.data).length ? (
              <ul className="space-y-2">{arr<AnyObj>(history.data).map((h, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] p-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{h.updated_at || h.created_at ? new Date(String(h.updated_at ?? h.created_at)).toLocaleString('en-IN') : `Version ${i + 1}`} {h.updated_by ? `by ${str(h.updated_by)}` : ''}</span>
                  <button type="button" className={aBtn} onClick={() => { setDraft(clone(getIn(h.value ?? h, sub) ?? {})); setMode('form'); }} data-testid={`button-restore-content-${i}`}>Load into editor</button>
                </li>))}</ul>
            ) : <p className="text-sm text-muted-foreground">No saved versions yet.</p>) : null}
          </div>
        )
      ) : null}
    </Card>
  );
}

/* ---------- Native route workspace ---------- */
function NativeWorkspace({ entry, content, onEditRecord }: { entry: PageEntry; content: AnyObj; onEditRecord: (id: string) => void }) {
  const qc = useQueryClient();
  const save = useSaveContent();
  const routes = ((content.pageLayouts as AnyObj | undefined)?.routes ?? {}) as AnyObj;
  const saved = routes[entry.path]?.sections as Block[] | undefined;
  const baseline = useMemo<Block[]>(() => saved ?? (entry.path === '/' ? homeNativeBlocks() : [ORIGINAL]), [entry.path, saved]);
  const [draft, setDraft] = useState<Block[]>(() => clone(baseline));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ k: 'ok' | 'err'; t: string } | null>(null);
  const dirty = !same(draft, baseline);
  useUnsavedGuard(`layout:${entry.path}`, dirty);
  const persist = (sections: Block[] | null) => {
    const latest = (((qc.getQueryData(getGetContentQueryKey()) ?? content) as AnyObj).pageLayouts ?? { routes: {} }) as AnyObj;
    const nextRoutes = { ...(latest.routes ?? {}) };
    if (sections) {
      const err = validateSections(sections, true);
      if (err) { setMsg({ k: 'err', t: err }); return; }
      nextRoutes[entry.path] = { sections };
    } else delete nextRoutes[entry.path];
    const next = { ...latest, routes: nextRoutes };
    if (sizeOf(next) > LAYOUT_LIMIT) { setMsg({ k: 'err', t: `All page layouts together would be ${fmtSize(sizeOf(next))}, above the 2.1MB limit. Use smaller images or fewer copies.` }); return; }
    setMsg(null);
    save.mutate({ key: 'pageLayouts', data: next }, {
      onSuccess: () => {
        qc.setQueryData(getGetContentQueryKey(), (o: any) => (o ? { ...o, pageLayouts: next } : o));
        void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
        if (!sections) setDraft([clone(ORIGINAL)]);
        setMsg({ k: 'ok', t: sections ? 'Layout saved. It is live on the website.' : 'Default layout restored.' });
      },
      onError: (e) => setMsg({ k: 'err', t: errMsg(e) }),
    });
  };
  const keys = entry.kind === 'native' ? ROUTE_KEYS[entry.path] ?? [] : [];
  return (
    <div className="space-y-5">
      {entry.path === '/' ? <HomepageVersionEditor content={content} /> : null}
      <Card tone="owned"
        title={<span className="inline-flex flex-wrap items-center gap-2"><Layers className="h-4 w-4" />Page layout {saved ? <Badge tone="owned">Custom layout</Badge> : <Badge>Default layout</Badge>}{dirty ? <Badge tone="draft">Unsaved</Badge> : null}</span>}
        sub={<>Sections on <span className="font-mono">{entry.path}</span> only. The page keeps the global theme.</>}
        actions={<>
          <a href={entry.path} target="_blank" rel="noreferrer" className={aBtn} data-testid="link-view-native"><ExternalLink className="h-3 w-3" />View live page</a>
          {saved || dirty ? <button type="button" className={aBtn} disabled={save.isPending || busy} onClick={() => {
            if (saved) { if (window.confirm('Restore the default layout? This removes all added sections and saves immediately, so the live page shows exactly as built. Shared content is not changed.')) persist(null); }
            else if (window.confirm('Discard your unsaved section changes and go back to the default layout? Nothing has been saved yet.')) setDraft([clone(ORIGINAL)]);
          }} data-testid="button-restore-layout"><RotateCcw className="h-3 w-3" />Restore default</button> : null}
          <button type="button" className={aBtn} disabled={!dirty || busy} onClick={() => setDraft(clone(baseline))} data-testid="button-revert-layout">Revert</button>
          <button type="button" className={aBtnPrimary} disabled={!dirty || save.isPending || busy} onClick={() => persist(draft)} data-testid="button-save-layout"><Save className="h-3.5 w-3.5" />{save.isPending ? 'Saving...' : 'Save layout'}</button>
        </>}>
        {msg ? <div className="mb-3"><Notice kind={msg.k}>{msg.t}</Notice></div> : null}
        <SectionsEditor value={draft} onChange={setDraft} allowOriginal onBusyChange={setBusy} content={content} expandable={entry.path === '/'} />
      </Card>
      <div>
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold"><Link2 className="h-4 w-4 text-[color:var(--ph-cyan)]" />Linked sections</h3>
        <p className="mb-3 text-xs text-muted-foreground">{entry.path === '/' ? 'Each homepage section reads shared site content. Saving here changes every page that uses those same shared sections.' : 'Content shown by the original block. These are shared: saving here updates every page listed on each card.'}</p>
        <div className="space-y-3">
          {entry.path === '/' ? <SharedSectionEditor contentKey="homepageV2" title="New homepage content" scopeNote="Homepage-only copy and interactive content shown when the new homepage is selected." /> : null}
          {entry.kind === 'feature' ? <SharedSectionEditor contentKey="suites" sub={['items', entry.index ?? 0]} title={`${entry.label} (feature)`} scopeNote="Only this feature item. Also appears in the Features page, Home and Pricing." /> : null}
          {entry.kind === 'service' ? <SharedSectionEditor contentKey="services" sub={['items', entry.index ?? 0]} title={`${entry.label} (service)`} scopeNote="Only this service item. Also appears in the Services page and Home." /> : null}
          {entry.kind === 'legal' ? <SharedSectionEditor contentKey="legal" sub={[entry.slug ?? '']} title={entry.label} scopeNote="Only this legal page." /> : null}
          {keys.map((k) => <SharedSectionEditor key={k} contentKey={k} />)}
          {entry.record && !isNativePath(entry.path) ? (
            <Card tone="owned" title={<span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />Page text record<Badge tone="owned">This page only</Badge></span>} sub={`Intro and body for /${cleanSlug(entry.record.slug)} (${str(entry.record.status)})`}
              actions={<button type="button" className={aBtn} onClick={() => onEditRecord(String(entry.record?.id))} data-testid="button-edit-page-record">Edit page text</button>} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dynamic page editor ---------- */
const pick = (r: AnyObj) => ({ title: str(r.title), slug: cleanSlug(r.slug), status: str(r.status, 'draft'), content: clone((r.content ?? {}) as AnyObj) });

export function DynamicPageEditor({ record, records, content, onDeleted, onBack }: { record: AnyObj; records: AnyObj[]; content: AnyObj; onDeleted: () => void; onBack?: () => void }) {
  const invalidate = useInvalidatePages();
  const update = useUpdateAdminRecord();
  const del = useDeleteAdminRecord();
  const [baseline, setBaseline] = useState(() => pick(record));
  const [draft, setDraft] = useState(() => pick(record));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ k: 'ok' | 'err'; t: string } | null>(null);
  const dirty = !same(draft, baseline);
  useUnsavedGuard(`page:${String(record.id)}`, dirty);
  const nativeText = isNativePath(`/${baseline.slug}`);
  const c = draft.content;
  const sections = Array.isArray(c.sections) ? (c.sections as Block[]) : null;
  const setC = (patch: AnyObj) => setDraft({ ...draft, content: { ...c, ...patch } });
  const slugErr = nativeText ? null : validateSlug(draft.slug, records, record.id);
  const live = baseline.status === 'published';

  const doSave = (statusOverride?: string) => {
    const next = { ...draft, status: statusOverride ?? draft.status };
    if (!next.title.trim()) { setMsg({ k: 'err', t: 'Give the page a title.' }); return; }
    if (slugErr) { setMsg({ k: 'err', t: slugErr }); return; }
    if (sections) { const e = validateSections(sections, false); if (e) { setMsg({ k: 'err', t: e }); return; } }
    if (sizeOf(next.content) > PAGE_LIMIT) { setMsg({ k: 'err', t: `This page is ${fmtSize(sizeOf(next.content))}, above the 1.5MB limit. Use smaller images.` }); return; }
    if (live && next.status !== 'published' && !window.confirm('Unpublishing hides this page from visitors and removes its links from menus and the footer. Continue?')) return;
    if (live && next.slug !== baseline.slug && !window.confirm(`Change the path from /${baseline.slug} to /${next.slug}? Menu and footer links pointing at the old path will be updated. Other links elsewhere may break.`)) return;
    setMsg(null);
    update.mutate({ entity: 'pages', id: String(record.id), data: { title: next.title, slug: next.slug, status: next.status, content: next.content } }, {
      onSuccess: () => { setDraft(next); setBaseline(next); invalidate(); setMsg({ k: 'ok', t: next.status === 'published' ? 'Saved and published.' : 'Saved as draft. Drafts are not visible to visitors.' }); },
      onError: (e) => setMsg({ k: 'err', t: errMsg(e) }),
    });
  };
  const doDelete = () => {
    if (!window.confirm(`Delete "${baseline.title}" permanently?${live ? ' Its links will also be removed from menus and the footer.' : ''}`)) return;
    del.mutate({ entity: 'pages', id: String(record.id) }, { onSuccess: () => { invalidate(); onDeleted(); }, onError: (e) => setMsg({ k: 'err', t: errMsg(e) }) });
  };
  const convert = () => {
    if (!window.confirm('Convert this page to sections? Body becomes a text block, benefits become cards, FAQ becomes an FAQ block. The original fields are kept as a backup in the page record.')) return;
    const out: Block[] = [];
    if (str(c.body).trim()) out.push({ id: newBlockId('text'), type: 'text', enabled: true, content: { ...customTemplate('text'), title: '', body: str(c.body) } });
    const benefits = arr<unknown>(c.benefits).map((b) => (typeof b === 'object' && b ? str((b as AnyObj).title ?? (b as AnyObj).text) : str(b))).filter(Boolean);
    if (benefits.length) out.push({ id: newBlockId('cards'), type: 'cards', enabled: true, content: { eyebrow: '', title: 'Key benefits', description: '', items: benefits.map((t) => ({ title: t, description: '', icon: 'Check', href: '' })), ctaLabel: '', ctaHref: '' } });
    const faq = arr<AnyObj>(c.faq).filter((f) => str(f.question));
    if (faq.length) out.push({ id: newBlockId('faq'), type: 'faq', enabled: true, content: { title: 'Questions', items: faq } });
    out.push({ id: newBlockId('cta'), type: 'cta', enabled: true, content: {} });
    setC({ sections: out });
  };
  const menuHref = `/admin/menus?add=${encodeURIComponent(`/${baseline.slug}`)}&label=${encodeURIComponent(baseline.title)}`;

  if (nativeText) {
    const entry = buildCatalogue(content, records).find(e => e.path === `/${baseline.slug}`);
    return <Notice kind="info">This is an existing website page. Its live content is managed through linked sections, not the older page text record. <Link href={`/admin/content?page=${encodeURIComponent(entry?.id ?? 'native:/')}`} className="underline">Edit this page’s linked sections</Link></Notice>;
  }
  return (
    <div className="space-y-5" data-testid="page-editor">
      <Card tone="owned"
        title={<span className="inline-flex flex-wrap items-center gap-2">{onBack ? <button type="button" className={aBtn} onClick={() => { if (!dirty || window.confirm('Leave this page with unsaved changes?')) onBack(); }} data-testid="button-back-pages"><ArrowLeft className="h-3 w-3" /></button> : null}{baseline.title || 'Untitled page'}<Badge tone={live ? 'live' : 'draft'}>{live ? 'Published' : 'Draft'}</Badge>{dirty ? <Badge tone="draft">Unsaved</Badge> : null}</span>}
        sub={live ? <a href={`/${baseline.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[color:var(--ph-cyan)] underline" data-testid="link-view-public">/{baseline.slug} <ExternalLink className="h-3 w-3" /></a> : <span className="font-mono">/{baseline.slug} . Draft, not visible to visitors</span>}
        actions={<>
          {live && !dirty ? <Link href={menuHref} className={aBtn} data-testid="link-add-to-menu"><ListTree className="h-3 w-3" />Add to menu</Link> : null}
          {!nativeText ? <button type="button" className={cn(aBtn, 'text-red-300')} onClick={doDelete} disabled={del.isPending || busy} data-testid="button-delete-page"><Trash2 className="h-3 w-3" />Delete</button> : null}
          <button type="button" className={aBtn} onClick={() => setDraft(clone(baseline))} disabled={!dirty || busy} title="Discard unsaved changes and go back to the last saved version" data-testid="button-revert-page">Revert to last saved</button>
          {!live ? <button type="button" className={aBtn} onClick={() => doSave('published')} disabled={update.isPending || busy} data-testid="button-publish-page">Save and publish</button> : null}
          <button type="button" className={aBtnPrimary} onClick={() => doSave()} disabled={update.isPending || busy || !dirty} data-testid="button-save-page"><Save className="h-3.5 w-3.5" />{update.isPending ? 'Saving...' : 'Save page'}</button>
        </>}>
        {msg ? <div className="mb-4"><Notice kind={msg.k}>{msg.t}{msg.k === 'ok' && live ? <> <Link href={menuHref} className="underline" data-testid="link-add-to-menu-notice">Add it to a menu</Link></> : null}</Notice></div> : null}
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_160px]">
          <Field label="Title"><input className={aInput} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} data-testid="input-page-title" /></Field>
          <Field label="Path" hint={nativeText ? <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />Fixed: this text belongs to a built-in page.</span> : slugErr ? <span className="text-red-300">{slugErr}</span> : `Visitors open ${'/'}${draft.slug}`}>
            <div className="flex items-center"><span className="rounded-l-lg border border-r-0 border-white/10 bg-white/[0.05] px-2 py-2 font-mono text-sm text-muted-foreground">/</span><input className={cn(aInput, 'rounded-l-none font-mono')} value={draft.slug} disabled={nativeText} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/^\/+/, '') })} data-testid="input-page-slug" /></div>
          </Field>
          <Field label="Status"><select className={aInput} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} data-testid="select-page-status"><option value="draft">Draft</option><option value="published">Published</option></select></Field>
        </div>
        <div className="mt-4"><Field label="Header introduction" hint="Shown under the page title."><textarea className={cn(aInput, 'min-h-[70px]')} value={str(c.intro)} onChange={(e) => setC({ intro: e.target.value })} data-testid="input-page-intro" /></Field></div>
        <p className="mt-2 text-[11px] text-muted-foreground">Size {fmtSize(sizeOf(c))} of 1.5MB</p>
      </Card>

      {sections && !nativeText ? (
        <Card tone="owned" title="Sections" sub="Rendered in this order below the page header.">
          <SectionsEditor value={sections} onChange={(v) => setC({ sections: v })} allowOriginal={false} onBusyChange={setBusy} content={content} />
        </Card>
      ) : (
        <Card title={<span className="inline-flex items-center gap-2">{nativeText ? 'Page text' : 'Classic page content'}<Badge>{nativeText ? 'Native page text' : 'Legacy'}</Badge></span>}
          sub={nativeText ? 'Intro and body shown on the built-in page. Add sections from the Content tab instead.' : 'This page uses the classic layout: intro, markdown body, benefits and FAQ.'}
          actions={!nativeText ? <button type="button" className={aBtnPrimary} onClick={convert} data-testid="button-convert-sections"><Layers className="h-3.5 w-3.5" />Convert to sections</button> : null}>
          <JsonForm value={{ body: str(c.body), benefits: arr(c.benefits).length ? c.benefits : [''], faq: arr(c.faq).length ? c.faq : [{ question: '', answer: '' }] }} onChange={(v) => setC(v)} path="page" onBusyChange={setBusy} />
        </Card>
      )}
    </div>
  );
}

/* ---------- New page ---------- */
export function NewPageModal({ records, onClose, onCreated }: { records: AnyObj[]; onClose: () => void; onCreated: (r: AnyObj) => void }) {
  const create = useCreateAdminRecord();
  const invalidate = useInvalidatePages();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('draft');
  const [starter, setStarter] = useState<'text' | 'textCards' | 'blank'>('textCards');
  const [err, setErr] = useState('');
  const s = touched ? slug : slugify(title);
  const slugErr = s ? validateSlug(s, records) : null;
  const submit = () => {
    if (!title.trim()) { setErr('Give the page a title.'); return; }
    const e = validateSlug(s, records); if (e) { setErr(e); return; }
    const sections: Block[] = starter === 'blank' ? [] : starter === 'text' ? [makeBlock('text')] : [makeBlock('text'), makeBlock('cards'), { id: newBlockId('cta'), type: 'cta', enabled: true, content: {} }];
    setErr('');
    create.mutate({ entity: 'pages', data: { slug: s, title: title.trim(), status, content: { intro: '', sections } } }, {
      onSuccess: (doc) => { invalidate(); onCreated(doc as AnyObj); },
      onError: (x) => setErr(errMsg(x)),
    });
  };
  return (
    <Shell title="New page" onClose={onClose}>
      <div className="grid gap-4">
        <Field label="Title"><input autoFocus className={aInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Payroll for garment exporters" data-testid="input-new-page-title" /></Field>
        <Field label="Path" hint={slugErr ? <span className="text-red-300">{slugErr}</span> : s ? `Will open at /${s}` : 'Filled from the title. Edit if needed.'}>
          <div className="flex items-center"><span className="rounded-l-lg border border-r-0 border-white/10 bg-white/[0.05] px-2 py-2 font-mono text-sm text-muted-foreground">/</span><input className={cn(aInput, 'rounded-l-none font-mono')} value={s} onChange={(e) => { setTouched(true); setSlug(e.target.value.toLowerCase().replace(/^\/+/, '')); }} data-testid="input-new-page-slug" /></div>
        </Field>
        <Field label="Status"><select className={aInput} value={status} onChange={(e) => setStatus(e.target.value)} data-testid="select-new-page-status"><option value="draft">Draft (only admins can see it here)</option><option value="published">Published (live immediately)</option></select></Field>
        <Field label="Start with">
          <div className="grid gap-2 sm:grid-cols-3">
            {([['textCards', 'Text, cards and CTA'], ['text', 'One text block'], ['blank', 'Empty page']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setStarter(k)} className={cn(aBtn, 'justify-center py-2', starter === k && 'border-[color:var(--ph-indigo)] bg-white/[0.08]')} data-testid={`button-starter-${k}`}>{l}</button>)}
          </div>
        </Field>
        {err || create.isError ? <Notice kind="err">{err || errMsg(create.error)}</Notice> : null}
        <p className="text-[11px] text-muted-foreground">After creating, add it to a menu from the page editor or the Menus tab. That is a separate save.</p>
        <div className="flex justify-end gap-2"><button type="button" className={aBtn} onClick={onClose}>Cancel</button><button type="button" className={aBtnPrimary} onClick={submit} disabled={create.isPending || !!slugErr} data-testid="button-create-page"><Plus className="h-3.5 w-3.5" />{create.isPending ? 'Creating...' : 'Create page'}</button></div>
      </div>
    </Shell>
  );
}

/* ---------- Content tab ---------- */
const GLOBAL = 'global';
export function ContentAdmin() {
  const content = useContentQ();
  const recQ = usePageRecords();
  const records = arr<AnyObj>(recQ.data);
  const data = (content.data ?? {}) as AnyObj;
  const catalogue = useMemo(() => buildCatalogue(content.data as AnyObj | undefined, records), [content.data, records]);
  const search = useSearch();
  const [sel, setSel] = useState(() => new URLSearchParams(search).get('page') ?? 'native:/');
  const [creating, setCreating] = useState(false);
  const [globalKey, setGlobalKey] = useState('hero');
  const choose = (id: string) => { if (id === sel || !confirmLeave()) return; setSel(id); };
  if (content.isLoading || recQ.isLoading) return <div className="space-y-4"><SkeletonBlock className="h-12 w-72" /><SkeletonBlock className="h-96" /></div>;
  if (content.isError) return <Notice kind="err">{errMsg(content.error)} <button type="button" className="underline" onClick={() => content.refetch()}>Retry</button></Notice>;
  if (recQ.isError) return <Notice kind="err">{errMsg(recQ.error)} <button type="button" className="underline" onClick={() => recQ.refetch()}>Retry loading pages</button></Notice>;
  const entry = catalogue.find((e) => e.id === sel);
  const groups: [string, PageEntry[]][] = [['Website pages', catalogue.filter((e) => e.kind === 'native')], ['Your pages', catalogue.filter((e) => e.kind === 'dynamic')], ['Feature details', catalogue.filter((e) => e.kind === 'feature')], ['Service details', catalogue.filter((e) => e.kind === 'service')], ['Legal pages', catalogue.filter((e) => e.kind === 'legal')]];
  const keys = Object.keys(data).filter((k) => !['pageLayouts', 'homepage', 'homepageV2'].includes(k));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Content</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Pick a page to see what it is made of. <span className="text-[color:var(--ph-pink)]">Pink</span> cards belong to that page only. <span className="text-[color:var(--ph-cyan)]">Cyan</span> cards are shared across the site.</p>
        </div>
        <button type="button" className={aBtnPrimary} onClick={() => { if (confirmLeave()) setCreating(true); }} data-testid="button-new-page"><Plus className="h-3.5 w-3.5" />New page</button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
        <label className="flex min-w-[260px] flex-1 items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Page</span>
          <select className={aInput} value={entry || sel === GLOBAL ? sel : ''} onChange={(e) => choose(e.target.value)} data-testid="select-content-page">
            {!entry && sel !== GLOBAL ? <option value="">Choose a page</option> : null}
            {groups.map(([g, list]) => list.length ? <optgroup key={g} label={g}>{list.map((e) => <option key={e.id} value={e.id}>{e.label} . {e.path}{e.kind === 'dynamic' && str(e.record?.status) !== 'published' ? ' (draft)' : ''}{(data.pageLayouts as AnyObj | undefined)?.routes?.[e.path] ? ' . custom layout' : ''}</option>)}</optgroup> : null)}
            <optgroup label="Site-wide"><option value={GLOBAL}>Global settings (all shared sections)</option></optgroup>
          </select>
        </label>
        {entry ? <><Badge>{KIND_LABEL[entry.kind]}</Badge>{entry.kind === 'dynamic' ? <Badge tone={str(entry.record?.status) === 'published' ? 'live' : 'draft'}>{str(entry.record?.status, 'draft')}</Badge> : null}</> : null}
        {sel === GLOBAL ? <Badge tone="shared"><Settings2 className="h-3 w-3" />Site-wide</Badge> : null}
      </div>
      <div className="mt-5">
        {sel.startsWith('rec:') ? (() => { const r = records.find((x) => `rec:${String(x.id)}` === sel); return r ? <DynamicPageEditor key={sel} record={r} records={records} content={data} onDeleted={() => setSel('native:/')} onBack={() => setSel(`native:/${cleanSlug(r.slug)}`)} /> : <Notice kind="info">That page record no longer exists.</Notice>; })() : sel === GLOBAL ? (
          <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
            <div className="scrollbar-thin flex gap-1 overflow-x-auto lg:flex-col">
              {keys.map((k) => <button key={k} type="button" onClick={() => { if (k !== globalKey && confirmLeave()) setGlobalKey(k); }} className={cn('shrink-0 rounded-lg px-3 py-2 text-left font-mono text-xs', k === globalKey ? 'bg-brand text-on-brand' : 'text-muted-foreground hover:bg-white/5')} data-testid={`button-section-${k}`}>{k}</button>)}
            </div>
            <SharedSectionEditor key={globalKey} contentKey={globalKey} defaultOpen />
          </div>
        ) : !entry ? (
          <Notice kind="info">That page no longer exists. Choose another from the list.</Notice>
        ) : entry.kind === 'dynamic' && entry.record ? (
          <DynamicPageEditor key={entry.id} record={entry.record} records={records} content={data} onDeleted={() => setSel('native:/')} />
        ) : (
          <NativeWorkspace key={entry.id} entry={entry} content={data} onEditRecord={(id) => { if (confirmLeave()) setSel(`rec:${id}`); }} />
        )}
      </div>
      {creating ? <NewPageModal records={records} onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); setSel(`dyn:${String(r.id)}`); }} /> : null}
    </div>
  );
}

/* ---------- Pages tab ---------- */
export function PagesAdmin() {
  const content = useContentQ();
  const recQ = usePageRecords();
  const records = arr<AnyObj>(recQ.data);
  const dynamicRecords = records.filter(r => !isNativePath(`/${cleanSlug(r.slug)}`));
  const search = useSearch();
  const [editId, setEditId] = useState<string | null>(() => new URLSearchParams(search).get('edit'));
  const [creating, setCreating] = useState(false);
  const editing = editId ? records.find((r) => String(r.id) === editId) : undefined;
  if (editing && content.data) return <DynamicPageEditor key={editId} record={editing} records={records} content={content.data as AnyObj} onDeleted={() => setEditId(null)} onBack={() => setEditId(null)} />;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create new pages from sections. Built-in pages are edited in <Link href="/admin/content" className="text-[color:var(--ph-cyan)] underline">Content</Link> and cannot be deleted.</p>
        </div>
        <button type="button" className={aBtnPrimary} onClick={() => setCreating(true)} data-testid="button-new-page"><Plus className="h-3.5 w-3.5" />New page</button>
      </div>
      <div className="glass mt-6 rounded-2xl p-2 sm:p-4">
        {recQ.isLoading ? <SkeletonBlock className="h-40" /> : recQ.isError ? <Notice kind="err">{errMsg(recQ.error)} <button type="button" className="underline" onClick={() => recQ.refetch()}>Retry</button></Notice> : !dynamicRecords.length ? (
          <div className="flex flex-col items-center py-14 text-center" data-testid="status-no-pages">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]"><FileText className="h-6 w-6 text-[color:var(--ph-cyan)]" /></span>
            <p className="mt-4 font-display text-xl font-bold">No pages yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Build a landing page for an industry, a city or a campaign. It follows your site theme automatically.</p>
            <button type="button" className={cn(aBtnPrimary, 'mt-5')} onClick={() => setCreating(true)} data-testid="button-new-page-empty"><Plus className="h-3.5 w-3.5" />Create your first page</button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {dynamicRecords.map((r) => {
              const native = isNativePath(`/${cleanSlug(r.slug)}`);
              const live = str(r.status) === 'published';
              return (
                <li key={String(r.id)} className="flex flex-wrap items-center gap-3 px-2 py-3" data-testid={`row-page-${String(r.id)}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-medium">{str(r.title, 'Untitled')}<Badge tone={live ? 'live' : 'draft'}>{live ? 'Published' : 'Draft'}</Badge>{native ? <Badge tone="shared">Built-in page text</Badge> : Array.isArray((r.content as AnyObj | undefined)?.sections) ? <Badge tone="owned">Sections</Badge> : <Badge>Classic</Badge>}</div>
                    {live ? <a href={`/${cleanSlug(r.slug)}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-[color:var(--ph-cyan)]">/{cleanSlug(r.slug)}</a> : <span className="font-mono text-xs text-muted-foreground">/{cleanSlug(r.slug)} . not public</span>}
                  </div>
                  <button type="button" className={aBtn} onClick={() => setEditId(String(r.id))} data-testid={`button-edit-page-${String(r.id)}`}>Edit</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {creating ? <NewPageModal records={records} onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); setEditId(String(r.id)); }} /> : null}
    </div>
  );
}
