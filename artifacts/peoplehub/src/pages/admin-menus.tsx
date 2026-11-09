/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useSearch } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ListTree, Plus, RotateCcw, Save } from 'lucide-react';
import { useGetContent, useSaveContent, getGetContentQueryKey, getGetContentHistoryQueryKey } from '@workspace/api-client-react';
import { arr, errMsg, str, type AnyObj } from '@/lib/content';
import { SkeletonBlock } from '@/components/site/primitives';
import { JsonForm, aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import { LinkPicker, useLinkOptions } from '@/components/admin/link-picker';
import { useUnsavedGuard } from '@/lib/site-pages';
import { cn } from '@/lib/utils';

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function MenusAdmin() {
  const qc = useQueryClient();
  const content = useGetContent({ query: { queryKey: getGetContentQueryKey() } });
  const data = (content.data ?? {}) as AnyObj;
  const [nav, setNav] = useState<AnyObj | null>(null);
  const [footer, setFooter] = useState<AnyObj | null>(null);
  const [base, setBase] = useState<{ nav: AnyObj; footer: AnyObj } | null>(null);
  const init = useRef(false);
  useEffect(() => {
    if (content.data && !init.current) {
      init.current = true;
      const n = structuredClone((data.nav ?? {}) as AnyObj); const f = structuredClone((data.footer ?? {}) as AnyObj);
      setNav(n); setFooter(f); setBase({ nav: structuredClone(n), footer: structuredClone(f) });
    }
  }, [content.data, data.nav, data.footer]);
  const navDirty = !!base && !same(nav, base.nav);
  const footDirty = !!base && !same(footer, base.footer);
  useUnsavedGuard('menus', navDirty || footDirty);
  const save = useSaveContent();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ k: 'ok' | 'err'; t: string } | null>(null);

  const search = useSearch();
  const qs = new URLSearchParams(search);
  const opts = useLinkOptions();
  const [href, setHref] = useState(qs.get('add') ?? '');
  const [label, setLabel] = useState(qs.get('label') ?? '');
  const [dest, setDest] = useState('');
  const [added, setAdded] = useState('');

  if (content.isError) return <p className="text-red-300">{errMsg(content.error)} <button type="button" className="underline" onClick={() => content.refetch()}>Retry</button></p>;
  if (content.isLoading || !nav || !footer || !base) return <SkeletonBlock className="h-96" />;

  const mega = arr<AnyObj>(nav.megaMenu);
  const cols = arr<AnyObj>(footer.columns);
  const dests: [string, string][] = [
    ['top', 'Header: new top-level menu item'],
    ...mega.flatMap((m, i) => arr<AnyObj>(m.groups).map((g, j) => [`mega:${i}:${j}`, `Mega menu: ${str(m.label, `Menu ${i + 1}`)} > ${str(g.title, `Group ${j + 1}`)}`] as [string, string])),
    ...cols.map((c, i) => [`footer:${i}`, `Footer column: ${str(c.title, `Column ${i + 1}`)}`] as [string, string]),
    ['footerLinks', 'Footer bottom links'],
  ];
  const d = dest || dests[0][0];
  const optLabel = opts.flatMap((g) => g.options).find((o) => o.href === href)?.label ?? '';
  const addLink = () => {
    const l = label.trim() || optLabel;
    if (!href || !l) return;
    if (d === 'top') setNav({ ...nav, megaMenu: [...mega, { label: l, href, groups: [] }] });
    else if (d.startsWith('mega:')) {
      const [, i, j] = d.split(':').map(Number);
      setNav({ ...nav, megaMenu: mega.map((m, mi) => (mi !== i ? m : { ...m, groups: arr<AnyObj>(m.groups).map((g, gj) => (gj !== j ? g : { ...g, links: [...arr(g.links), { label: l, href, description: '', icon: '' }] })) })) });
    } else if (d.startsWith('footer:')) {
      const i = Number(d.split(':')[1]);
      setFooter({ ...footer, columns: cols.map((c, ci) => (ci !== i ? c : { ...c, links: [...arr(c.links), { label: l, href }] })) });
    } else setFooter({ ...footer, links: [...arr(footer.links), { label: l, href }] });
    setAdded(`"${l}" added to the draft. Click Save menus to publish it.`); setLabel(''); setHref('');
  };

  const saveAll = async () => {
    setSaving(true); setResult(null);
    const done: string[] = []; const failed: string[] = [];
    for (const [key, val, dirty] of [['nav', nav, navDirty], ['footer', footer, footDirty]] as const) {
      if (!dirty) continue;
      try {
        await save.mutateAsync({ key, data: val as any });
        done.push(key === 'nav' ? 'header menu' : 'footer');
        setBase((b) => (b ? { ...b, [key]: structuredClone(val) } : b));
        qc.setQueryData(getGetContentQueryKey(), (o: any) => (o ? { ...o, [key]: val } : o));
        void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey(key) });
      } catch (e) { failed.push(`${key === 'nav' ? 'header menu' : 'footer'} (${errMsg(e)})`); }
    }
    void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
    setSaving(false); setAdded('');
    setResult(failed.length ? { k: 'err', t: `${done.length ? `Saved ${done.join(' and ')}. ` : ''}Not saved: ${failed.join('; ')}.` } : { k: 'ok', t: `Saved ${done.join(' and ')}. Live within seconds.` });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Menus</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Header mega menu, submenus and footer. Pick pages from the list; renamed pages update their links automatically, and unpublished or deleted pages are removed from menus.</p>
        </div>
        <div className="flex items-center gap-2">
          {navDirty || footDirty ? <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-pink)]">Unsaved</span> : null}
          <button type="button" className={aBtn} disabled={!(navDirty || footDirty) || busy} onClick={() => { if (window.confirm('Discard all menu changes?')) { setNav(structuredClone(base.nav)); setFooter(structuredClone(base.footer)); } }} data-testid="button-revert-menus"><RotateCcw className="h-3 w-3" />Revert</button>
          <button type="button" className={aBtnPrimary} disabled={!(navDirty || footDirty) || saving || busy} onClick={() => void saveAll()} data-testid="button-save-menus">{result?.k === 'ok' && !saving ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saving ? 'Saving...' : 'Save menus'}</button>
        </div>
      </div>
      {result ? <p role={result.k === 'err' ? 'alert' : 'status'} className={cn('rounded-xl border px-3 py-2 text-sm', result.k === 'ok' ? 'border-emerald-300/30 text-emerald-300' : 'border-red-300/30 text-red-300')}>{result.t}</p> : null}

      <section className="glass rounded-2xl border-l-2 !border-l-[color:var(--ph-pink)] p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ListTree className="h-4 w-4" />Add a page to a menu</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.3fr_1fr_1.3fr_auto] md:items-end">
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Page</span><LinkPicker value={href} onChange={setHref} testId="select-menu-page" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Label</span><input className={aInput} value={label} placeholder={optLabel || 'Menu label'} onChange={(e) => setLabel(e.target.value)} data-testid="input-menu-label" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Where</span><select className={aInput} value={d} onChange={(e) => setDest(e.target.value)} data-testid="select-menu-destination">{dests.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button type="button" className={aBtnPrimary} onClick={addLink} disabled={!href || !(label.trim() || optLabel)} data-testid="button-add-menu-link"><Plus className="h-3.5 w-3.5" />Add</button>
        </div>
        {added ? <p role="status" className="mt-3 text-sm text-emerald-300">{added}</p> : null}
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold">Header mega menu</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Top-level items, their groups (submenus) and links. Icons use names such as Users, Wallet, ShieldCheck.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Header call to action</span><input className={aInput} value={str(nav.ctaLabel)} onChange={(e) => setNav({ ...nav, ctaLabel: e.target.value })} data-testid="input-menus-cta" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">Log in label</span><input className={aInput} value={str(nav.loginLabel)} onChange={(e) => setNav({ ...nav, loginLabel: e.target.value })} data-testid="input-menus-login" /></label>
        </div>
        <div className="mt-5"><JsonForm value={mega} onChange={(v) => setNav({ ...nav, megaMenu: v })} path="nav-megaMenu" onBusyChange={setBusy} /></div>
        <details className="mt-5"><summary className="cursor-pointer text-xs text-muted-foreground">Simple links (used where the mega menu is not shown)</summary><div className="mt-3"><JsonForm value={arr(nav.links)} onChange={(v) => setNav({ ...nav, links: v })} path="nav-links" /></div></details>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold">Footer</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Link columns and the bottom row. Description and social profiles live in Branding.</p>
        <div className="mt-4"><JsonForm value={cols} onChange={(v) => setFooter({ ...footer, columns: v })} path="footer-columns" /></div>
        <h3 className="mt-6 mb-2 text-xs font-medium text-foreground/80">Bottom links</h3>
        <JsonForm value={arr(footer.links)} onChange={(v) => setFooter({ ...footer, links: v })} path="footer-links" />
      </section>
    </div>
  );
}
