/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, ImageUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useGetContent, useSaveContent, getGetContentQueryKey, getGetContentHistoryQueryKey } from '@workspace/api-client-react';
import { arr, errMsg, str, type AnyObj } from '@/lib/content';
import { SkeletonBlock } from '@/components/site/primitives';
import { aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import { cn } from '@/lib/utils';

const MAX_LOGO = 200_000;
const MAX_JSON = 1_500_000;
const MAX_ITEMS = 60;
const DEFAULTS = { enabled: true, eyebrow: 'OUR CLIENTS', title: 'Our clients', description: 'Organisations we work with.', items: [] as AnyObj[] };

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`);

function validLogo(u: string) {
  if (!u) return false;
  if (u.startsWith('/') && !u.startsWith('//')) return true;
  if (/^https:\/\//.test(u)) return true;
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(u) && u.length <= MAX_LOGO;
}

function validate(d: AnyObj): string[] {
  const errs: string[] = [];
  const items = arr<AnyObj>(d.items);
  if (items.length > MAX_ITEMS) errs.push(`At most ${MAX_ITEMS} clients are allowed.`);
  const ids = new Set<string>();
  items.forEach((c, i) => {
    const data = str(c.logoUrl).startsWith('data:');
    const n = `Client ${i + 1}`;
    if (!str(c.name).trim()) errs.push(`${n}: name is required.`);
    if (!str(c.logoUrl).trim()) errs.push(`${str(c.name) || n}: a logo is required (upload a file or enter an image URL).`);
    else if (!validLogo(str(c.logoUrl))) errs.push(`${str(c.name) || n}: logo must be a /path, https:// URL or an uploaded PNG/JPEG/WebP under 150KB.`);
    const w = str(c.website).trim();
    if (w && !/^https?:\/\/[^\s]+$/.test(w)) errs.push(`${str(c.name) || n}: website must start with http:// or https://, or be left blank.`);
    if (!/^[A-Za-z0-9_-]+$/.test(str(c.id))) errs.push(`${str(c.name) || n}: invalid id.`);
    if (data && Math.floor(str(c.logoUrl).split(',')[1]?.length * 3 / 4) > 150000) errs.push(`${str(c.name) || n}: uploaded logo exceeds 150KB.`);
    if (ids.has(str(c.id))) errs.push(`${str(c.name) || n}: duplicate id.`);
    ids.add(str(c.id));
  });
  if (JSON.stringify(d).length > MAX_JSON) errs.push('Section is too large. Use smaller logos or URLs.');
  return errs;
}

function readAsDataUrl(f: Blob) {
  return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('Could not read file')); r.readAsDataURL(f); });
}

async function encodeLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Please choose a PNG, JPEG or WebP image. SVG is not accepted.');
  if (file.size > 10_000_000) throw new Error('Choose a logo file smaller than 10MB.');
  const original = await readAsDataUrl(file);
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('That image could not be opened.')); img.src = original; });
  const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
  let out = original;
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale)); c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    const webp = c.toDataURL('image/webp', 0.88);
    if (webp.startsWith('data:image/webp') && (webp.length < out.length || scale < 1)) out = webp;
  } catch { /* keep original */ }
  if (out.length > MAX_LOGO) throw new Error('This logo is still larger than 150KB after compression. Please use a smaller file or an image URL.');
  return out;
}

function Switch({ on, onChange, id, label }: { on: boolean; onChange: (v: boolean) => void; id: string; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand' : 'bg-white/15')} data-testid={`toggle-${id}`}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-on-brand transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

function ClientRow({ c, i, total, onChange, onMove, onRemove }: { c: AnyObj; i: number; total: number; onChange: (p: AnyObj) => void; onMove: (d: number) => void; onRemove: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [upErr, setUpErr] = useState('');
  const [busy, setBusy] = useState(false);
  const logo = str(c.logoUrl);
  const isData = logo.startsWith('data:');
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy(true); setUpErr('');
    try { onChange({ logoUrl: await encodeLogo(f) }); } catch (x) { setUpErr((x as Error).message); } finally { setBusy(false); }
  };
  const visible = c.visible !== false;
  return (
    <li className={cn('rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4', !visible && 'opacity-70')} data-testid={`row-client-${i}`}>
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div>
          <div className="flex h-28 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.1)] bg-[#ffffff] p-3">
            {logo ? <img src={logo} alt={`${str(c.name, 'Client')} logo preview`} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-[#64748b]">No logo</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} data-testid={`input-client-file-${i}`} />
          <button type="button" className={cn(aBtn, 'mt-2 w-full justify-center')} onClick={() => fileRef.current?.click()} disabled={busy} data-testid={`button-client-upload-${i}`}><ImageUp className="h-3.5 w-3.5" />{busy ? 'Processing...' : 'Upload logo'}</button>
          {upErr ? <p className="mt-1.5 text-[11px] text-red-300">{upErr}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Name <span className="text-[color:var(--ph-pink)]">*</span></span>
            <input className={cn(aInput, !str(c.name).trim() && 'border-red-400/60')} value={str(c.name)} onChange={(e) => onChange({ name: e.target.value })} placeholder="Organisation name" data-testid={`input-client-name-${i}`} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Website (optional)</span>
            <input type="url" className={aInput} value={str(c.website)} onChange={(e) => onChange({ website: e.target.value })} placeholder="https://" data-testid={`input-client-website-${i}`} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-foreground/80">Logo alt text (optional)</span>
            <input className={aInput} value={str(c.alt)} onChange={(e) => onChange({ alt: e.target.value })} placeholder={str(c.name) ? `Defaults to "${str(c.name)}"` : 'Describe the logo for screen readers'} data-testid={`input-client-alt-${i}`} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-foreground/80">Logo image URL</span>
            <input className={cn(aInput, 'font-mono text-xs')} value={isData ? '' : logo} placeholder={isData ? `Uploaded image (${Math.round(logo.length * 0.75 / 1024)}KB). Type a URL to replace it.` : '/client-logos/... or https://'} onChange={(e) => onChange({ logoUrl: e.target.value })} data-testid={`input-client-logo-${i}`} /></label>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
            <span className="flex items-center gap-2 text-sm">
              <Switch on={visible} onChange={(v) => onChange({ visible: v })} id={`client-visible-${i}`} label="Show on website" />
              {visible ? <><Eye className="h-3.5 w-3.5 text-muted-foreground" />Visible</> : <><EyeOff className="h-3.5 w-3.5 text-muted-foreground" />Hidden</>}
            </span>
            <span className="flex gap-1">
              <button type="button" className={aBtn} onClick={() => onMove(-1)} disabled={i === 0} aria-label="Move up" data-testid={`button-client-up-${i}`}><ArrowUp className="h-3 w-3" /></button>
              <button type="button" className={aBtn} onClick={() => onMove(1)} disabled={i === total - 1} aria-label="Move down" data-testid={`button-client-down-${i}`}><ArrowDown className="h-3 w-3" /></button>
              <button type="button" className={cn(aBtn, 'text-red-300')} onClick={onRemove} aria-label="Remove client" data-testid={`button-client-remove-${i}`}><Trash2 className="h-3 w-3" />Remove</button>
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ClientsAdmin() {
  const qc = useQueryClient();
  const content = useGetContent({ query: { queryKey: getGetContentQueryKey() } });
  const server = (content.data as AnyObj | undefined)?.clients as AnyObj | undefined;
  const [draft, setDraft] = useState<AnyObj | null>(null);
  const init = useRef(false);
  useEffect(() => {
    if (content.data && !init.current) { init.current = true; setDraft(structuredClone({ ...DEFAULTS, ...(server ?? {}) })); }
  }, [content.data, server]);
  const save = useSaveContent();
  const [saved, setSaved] = useState(false);
  const [showErrs, setShowErrs] = useState(false);

  if (content.isLoading) return <SkeletonBlock className="h-96" />;
  if (content.isError) return <p className="text-red-300">{errMsg(content.error)} <button className="underline" onClick={() => content.refetch()}>Retry</button></p>;
  if (!draft) return <SkeletonBlock className="h-96" />;

  const items = arr<AnyObj>(draft.items);
  const setItems = (n: AnyObj[]) => setDraft({ ...draft, items: n });
  // File decoding finishes asynchronously; update by stable id against the latest
  // draft so other edits/reordering during an upload cannot be overwritten.
  const patch = (id: string, p: AnyObj) => setDraft(current => current ? { ...current, items: arr<AnyObj>(current.items).map(c => c.id === id ? { ...c, ...p } : c) } : current);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n); };
  const remove = (i: number) => { if (window.confirm(`Remove "${str(items[i].name, 'this client')}"? It is deleted when you save.`)) setItems(items.filter((_, j) => j !== i)); };
  const add = () => { if (items.length >= MAX_ITEMS) return; setItems([...items, { id: newId(), name: '', alt: '', logoUrl: '', website: '', visible: true }]); };
  const errs = validate(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ ...DEFAULTS, ...(server ?? {}) });
  const doSave = () => {
    setShowErrs(true);
    if (errs.length) return;
    save.mutate({ key: 'clients', data: draft as any }, {
      onSuccess: () => {
        setSaved(true); setShowErrs(false); setTimeout(() => setSaved(false), 2500);
        void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey('clients') });
      },
    });
  };
  const revert = () => { if (window.confirm('Discard unsaved changes?')) setDraft(structuredClone({ ...DEFAULTS, ...(server ?? {}) })); };
  const visibleCount = items.filter((c) => c.visible !== false).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Logos shown in the "clients" section of the home page. {visibleCount} of {items.length} visible.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-pink)]">Unsaved</span> : null}
          <button type="button" className={aBtn} onClick={revert} disabled={!dirty} data-testid="button-revert-clients"><RotateCcw className="h-3 w-3" />Revert</button>
          <button type="button" className={aBtnPrimary} onClick={doSave} disabled={save.isPending} data-testid="button-save-clients">{saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{save.isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}</button>
        </div>
      </div>
      {save.isError ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">Save failed: {errMsg(save.error)}</p> : null}
      {showErrs && errs.length ? <ul role="alert" className="space-y-1 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{errs.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}

      <section className="glass rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Section heading</h2>
          <span className="flex items-center gap-2 text-sm">Show on website<Switch on={draft.enabled !== false} onChange={(v) => setDraft({ ...draft, enabled: v })} id="clients-enabled" label="Show clients section" /></span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Eyebrow</span><input className={aInput} value={str(draft.eyebrow)} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} data-testid="input-clients-eyebrow" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Title</span><input className={aInput} value={str(draft.title)} onChange={(e) => setDraft({ ...draft, title: e.target.value })} data-testid="input-clients-title" /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-foreground/80">Description</span><textarea className={cn(aInput, 'min-h-[70px]')} value={str(draft.description)} onChange={(e) => setDraft({ ...draft, description: e.target.value })} data-testid="input-clients-description" /></label>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg font-bold">Client logos</h2><p className="text-xs text-muted-foreground">Upload PNG, JPEG or WebP (resized to 800px, max 150KB) or paste an image URL.</p></div>
          <button type="button" className={aBtnPrimary} onClick={add} disabled={items.length >= MAX_ITEMS} data-testid="button-add-client"><Plus className="h-3.5 w-3.5" />Add client</button>
        </div>
        {items.length ? (
          <ul className="space-y-3">
            {items.map((c, i) => <ClientRow key={str(c.id, String(i))} c={c} i={i} total={items.length} onChange={(p) => patch(str(c.id), p)} onMove={(d) => move(i, d)} onRemove={() => remove(i)} />)}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <ImageUp className="mx-auto h-8 w-8 text-[color:var(--ph-cyan)]" />
            <p className="mt-3 font-medium">No clients yet</p>
            <p className="mt-1 text-sm text-muted-foreground">The section stays hidden on the website until you add one.</p>
          </div>
        )}
      </section>
    </div>
  );
}
