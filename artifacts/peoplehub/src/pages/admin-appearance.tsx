/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Moon, RotateCcw, Save, Sun, Instagram, Linkedin, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { useGetContent, useSaveContent, getGetContentQueryKey, getGetContentHistoryQueryKey } from '@workspace/api-client-react';
import { arr, errMsg, str, type AnyObj } from '@/lib/content';
import { PRESETS, SITE_WIDTH_OPTIONS, themeVars, type Mode } from '@/lib/theme';
import { SkeletonBlock } from '@/components/site/primitives';
import { BrandMark } from '@/components/site/layout';
import { JsonForm, aBtn, aBtnPrimary, aInput } from '@/components/admin/json-form';
import { cn } from '@/lib/utils';
import { encodeLogo } from '@/lib/logo-upload';
import { HomepageDesignPicker } from '@/components/admin/homepage-design-picker';

/** Local draft of one CMS section, initialised once per key, saved through useSaveContent. */
function useDraft(key: string) {
  const qc = useQueryClient();
  const content = useGetContent({ query: { queryKey: getGetContentQueryKey() } });
  const [draft, setDraft] = useState<AnyObj | null>(null);
  const init = useRef(false);
  const server = (content.data as AnyObj | undefined)?.[key];
  useEffect(() => {
    if (content.data && !init.current) { init.current = true; setDraft(structuredClone((server ?? {}) as AnyObj)); }
  }, [content.data, server]);
  const save = useSaveContent();
  const [saved, setSaved] = useState(false);
  const doSave = () => {
    if (!draft) return;
    save.mutate({ key, data: draft as any }, {
      onSuccess: () => {
        setSaved(true); setTimeout(() => setSaved(false), 2500);
        void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey(key) });
      },
    });
  };
  const revert = () => setDraft(structuredClone((server ?? {}) as AnyObj));
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(server ?? {});
  return { draft, setDraft, doSave, revert, dirty, saving: save.isPending, saved, error: save.isError ? errMsg(save.error) : '', loading: content.isLoading };
}

function SaveBar({ d, label, disabled = false, saveText = 'Save' }: { d: ReturnType<typeof useDraft>; label: string; disabled?: boolean; saveText?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {d.error ? <span className="text-xs text-red-300">{d.error}</span> : d.dirty ? <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-pink)]">Unsaved</span> : null}
      <button type="button" className={aBtn} onClick={d.revert} disabled={!d.dirty} data-testid={`button-revert-${label}`}><RotateCcw className="h-3 w-3" />Revert</button>
      <button type="button" className={aBtnPrimary} onClick={d.doSave} disabled={disabled || d.saving || !d.draft} data-testid={`button-save-${label}`}>{d.saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{d.saving ? 'Saving...' : d.saved ? 'Saved' : saveText}</button>
    </div>
  );
}

function Card({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-display text-lg font-bold">{title}</h2>{sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}</div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-foreground/80">{label}</span>{children}{hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}</label>;
}

function Switch({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand' : 'bg-white/15')} data-testid={`toggle-${id}`}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-on-brand transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

/** Miniature site rendered with a theme's own variables, so it previews independently of the admin's current mode. */
function MiniPreview({ theme, mode, big }: { theme: AnyObj; mode: Mode; big?: boolean }) {
  const style = themeVars(theme, mode) as CSSProperties;
  return (
    <div className={cn(mode, 'overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[color:var(--ph-bg)] text-foreground')} style={style}>
      <div className={cn('space-y-2', big ? 'p-5' : 'p-3')}>
        <div className="flex items-center justify-between">
          <span className="h-2 w-10 rounded-full bg-foreground/70" />
          <span className="h-3.5 w-9 rounded-full bg-brand" />
        </div>
        <div className={cn('font-display font-bold leading-none', big ? 'text-2xl' : 'text-sm')}><span className="text-gradient">Payroll, sorted.</span></div>
        {big ? <p className="text-xs text-muted-foreground">Readable body text on this surface, with muted secondary copy.</p> : null}
        <div className="glass flex items-center gap-1.5 rounded-lg p-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ph-indigo)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ph-cyan)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ph-pink)]" />
          <span className="ml-auto h-1.5 w-8 rounded-full bg-muted-foreground/50" />
        </div>
        {big ? <div className="flex gap-2"><span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-on-brand">Primary</span><span className="rounded-full border border-white/15 px-3 py-1 text-[11px]">Secondary</span><input readOnly value="Input field" className="w-28 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-foreground" aria-label="Preview input" /></div> : null}
      </div>
    </div>
  );
}

export function AppearanceAdmin() {
  const d = useDraft('theme');
  const [previewMode, setPreviewMode] = useState<Mode>('dark');
  if (d.loading || !d.draft) return <SkeletonBlock className="h-96" />;
  const t = d.draft;
  const set = (patch: AnyObj) => d.setDraft({ ...t, ...patch });
  const preset = str(t.preset, 'aurora');
  const containerLayout = SITE_WIDTH_OPTIONS.some((option) => option.id === t.containerLayout) ? str(t.containerLayout) : 'standard';
  const customContainerWidth = Math.max(1080, Math.min(1920, Number(t.customContainerWidth) || 1440));
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Appearance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a palette for the whole site, sign-in screens, dashboard and this admin. Visitors see saved changes within a few seconds.</p>
        </div>
        <SaveBar d={d} label="appearance" saveText="Save appearance" />
      </div>
      <HomepageDesignPicker />
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card title="Theme preset" sub="Every preset ships with a tuned light and dark variant.">
          <div role="radiogroup" aria-label="Theme preset" className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {PRESETS.map((p) => {
              const on = p.id === preset;
              return (
                <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => set({ preset: p.id })} className={cn('rounded-2xl border p-2.5 text-left transition', on ? 'border-[color:var(--ph-indigo)] bg-white/[0.05] ring-2 ring-[color:var(--ph-indigo)]/30' : 'border-white/10 hover:border-white/25')} data-testid={`button-preset-${p.id}`}>
                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniPreview theme={{ preset: p.id }} mode="light" />
                    <MiniPreview theme={{ preset: p.id }} mode="dark" />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between px-1">
                    <span className="text-sm font-semibold">{p.label}</span>
                    {on ? <Check className="h-4 w-4 text-[color:var(--ph-indigo)]" /> : null}
                  </div>
                  <p className="px-1 text-[11px] leading-snug text-muted-foreground">{p.note}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Overall website width</h3>
              <p className="mt-1 text-xs text-muted-foreground">Controls the public header, page content and footer. The admin and dashboard keep their own layout.</p>
            </div>
            <div role="radiogroup" aria-label="Overall website width" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SITE_WIDTH_OPTIONS.map((option) => {
                const on = containerLayout === option.id;
                return (
                  <button key={option.id} type="button" role="radio" aria-checked={on} onClick={() => set({ containerLayout: option.id })} className={cn('rounded-xl border p-3 text-left transition', on ? 'border-[color:var(--ph-indigo)] bg-white/[0.05] ring-2 ring-[color:var(--ph-indigo)]/25' : 'border-white/10 hover:border-white/25')} data-testid={`button-layout-${option.id}`}>
                    <div className="flex h-8 items-center justify-center rounded-md bg-white/[0.04]">
                      <div className="h-3 rounded bg-brand" style={{ width: option.preview }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{option.label}</span>
                      {on ? <Check className="h-3.5 w-3.5 text-[color:var(--ph-indigo)]" /> : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{option.note}</p>
                  </button>
                );
              })}
            </div>
            {containerLayout === 'custom' ? (
              <F label={`Maximum width: ${customContainerWidth}px`} hint="Choose a width between 1,080 and 1,920 pixels. It will still fit smaller screens.">
                <input type="range" min="1080" max="1920" step="40" value={customContainerWidth} onChange={(e) => set({ customContainerWidth: Number(e.target.value) })} className="mt-2 w-full accent-[color:var(--ph-indigo)]" aria-label="Custom website maximum width" data-testid="input-custom-container-width" />
              </F>
            ) : null}
          </div>
        </Card>
        <div className="space-y-5">
          <Card title="Live preview">
            <div className="mb-3 inline-flex rounded-lg border border-white/10 p-0.5">
              {(['light', 'dark'] as const).map((m) => <button key={m} type="button" onClick={() => setPreviewMode(m)} className={cn('inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs capitalize', previewMode === m ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground')} data-testid={`button-preview-${m}`}>{m === 'light' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}{m}</button>)}
            </div>
            <MiniPreview theme={t} mode={previewMode} big />
          </Card>
          <Card title="Mode">
            <div className="space-y-4">
              <F label="Default mode for visitors" hint="Used unless a visitor picks their own mode with the toggle.">
                <div className="grid grid-cols-2 gap-2">
                  {(['light', 'dark'] as const).map((m) => <button key={m} type="button" onClick={() => set({ defaultMode: m })} className={cn(aBtn, 'justify-center py-2 capitalize', t.defaultMode === m && 'border-[color:var(--ph-indigo)] bg-white/[0.08]')} data-testid={`button-default-${m}`}>{m === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{m}</button>)}
                </div>
              </F>
              <div className="flex items-center justify-between gap-3"><span className="text-sm">Show light/dark toggle to visitors</span><Switch on={t.allowModeToggle !== false} onChange={(v) => set({ allowModeToggle: v })} id="allow-toggle" /></div>
            </div>
          </Card>
          <Card title="Custom colours" sub="Override the preset accents. Background applies to the default mode only.">
            <div className="flex items-center justify-between gap-3"><span className="text-sm">Use custom colours</span><Switch on={!!t.customColors} onChange={(v) => set({ customColors: v })} id="custom-colors" /></div>
            <div className={cn('mt-4 grid grid-cols-2 gap-3', !t.customColors && 'pointer-events-none opacity-40')}>
              {(['primary', 'cyan', 'pink', 'background'] as const).map((k) => (
                <F key={k} label={k === 'cyan' ? 'Accent' : k === 'pink' ? 'Highlight' : k[0].toUpperCase() + k.slice(1)}>
                  <div className="flex items-center gap-2">
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(str(t[k])) ? str(t[k]) : '#6d6cf6'} onChange={(e) => set({ [k]: e.target.value })} className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-white/10 bg-transparent" aria-label={`${k} colour`} data-testid={`input-color-${k}`} />
                    <input className={cn(aInput, 'font-mono text-xs')} value={str(t[k])} onChange={(e) => set({ [k]: e.target.value })} data-testid={`input-hex-${k}`} />
                  </div>
                </F>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const SOCIALS = [
  { platform: 'instagram', label: 'Instagram', I: Instagram },
  { platform: 'linkedin', label: 'LinkedIn', I: Linkedin },
  { platform: 'facebook', label: 'Facebook', I: Facebook },
  { platform: 'twitter', label: 'X (Twitter)', I: Twitter },
];

export function BrandingAdmin() {
  const brand = useDraft('brand');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const footer = useDraft('footer');
  const wa = useDraft('whatsapp');
  const nav = useDraft('nav');
  const contact = useDraft('contact');
  if (brand.loading || !brand.draft || !footer.draft || !wa.draft || !nav.draft || !contact.draft) return <SkeletonBlock className="h-96" />;
  const b = brand.draft, f = footer.draft, w = wa.draft, n = nav.draft, c = contact.draft;
  const socials = arr<AnyObj>(f.socials);
  const setSocial = (platform: string, patch: AnyObj) => {
    const exists = socials.some((s) => s.platform === platform);
    const next = exists ? socials.map((s) => (s.platform === platform ? { ...s, ...patch } : s)) : [...socials, { platform, label: SOCIALS.find((x) => x.platform === platform)?.label ?? platform, url: '', enabled: true, ...patch }];
    footer.setDraft({ ...f, socials: next });
  };
  const digits = str(w.phone).replace(/[^\d]/g, '');
  const waValid = digits.length >= 10 && digits.length <= 15;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Branding</h1>
        <p className="mt-1 text-sm text-muted-foreground">Website profile, name, logo, contact details, social profiles, WhatsApp, navigation and footer. Each card saves independently. Use Content and Pages to edit all website copy.</p>
      </div>
      <Card title="Identity" actions={<SaveBar d={brand} label="brand" disabled={uploading} />}>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Brand name"><input className={aInput} value={str(b.name)} onChange={(e) => brand.setDraft({ ...b, name: e.target.value })} data-testid="input-brand-name" /></F>
            <F label="Tagline"><input className={aInput} value={str(b.tagline)} onChange={(e) => brand.setDraft({ ...b, tagline: e.target.value })} data-testid="input-brand-tagline" /></F>
            <F label="Logo type"><select className={aInput} value={str(b.logoMode, b.logoUrl ? 'image' : 'mark')} disabled={uploading} onChange={(e) => brand.setDraft({ ...b, logoMode: e.target.value })} data-testid="select-brand-logo-type"><option value="text">Text only</option><option value="image">Image logo</option><option value="mark">Built-in mark and text</option></select></F>
            {str(b.logoMode, b.logoUrl ? 'image' : 'mark') === 'image' ? <>
              <F label="Browse logo image" hint="Choose an SVG, PNG, JPEG or WebP from your device. SVG files are converted to a safe web image. Preview before clicking Save."><input className={cn(aInput, 'file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-on-brand')} type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" disabled={uploading} data-testid="input-brand-logo-upload" onChange={async (e) => {
                const file = e.target.files?.[0]; e.target.value = '';
                if (!file) return;
                setUploading(true); setUploadError('');
                try { const logoUrl = await encodeLogo(file, { allowSvg: true }); brand.setDraft((current) => current ? { ...current, logoUrl, logoMode: 'image' } : current); }
                catch (error) { setUploadError((error as Error).message); }
                finally { setUploading(false); }
              }} /></F>
              <F label="Logo alt text"><input className={aInput} value={str(b.logoAlt)} onChange={(e) => brand.setDraft({ ...b, logoAlt: e.target.value })} data-testid="input-brand-logo-alt" /></F>
              <div className="flex items-center justify-between gap-3 sm:col-span-2"><span className="text-sm">Show brand name next to logo</span><Switch on={b.showWordmark !== false} onChange={(v) => brand.setDraft({ ...b, showWordmark: v })} id="wordmark" /></div>
            </> : null}
            {uploading ? <p role="status" className="text-sm">Processing image...</p> : null}
            {uploadError ? <p role="alert" className="text-sm text-red-500">{uploadError}</p> : null}
            <F label="Logo corner radius (px)"><input type="number" min={0} max={100} step={1} className={aInput} value={b.logoRadius ?? (b.logoMode === 'image' ? 6 : 0)} onChange={(e) => brand.setDraft({ ...b, logoRadius: Math.max(0, Math.min(100, Number(e.target.value))) })} data-testid="input-brand-logo-radius" /></F>
            <F label="Logo padding (px)"><input type="number" min={0} max={32} step={1} className={aInput} value={b.logoPadding ?? (b.logoMode === 'image' ? 4 : 0)} onChange={(e) => brand.setDraft({ ...b, logoPadding: Math.max(0, Math.min(32, Number(e.target.value))) })} data-testid="input-brand-logo-padding" /></F>
            <F label="Logo background">
              <select className={aInput} value={(b.logoBackground ?? (b.logoMode === 'image' ? '#ffffff' : 'transparent')) === 'transparent' ? 'transparent' : 'color'} onChange={(e) => brand.setDraft({ ...b, logoBackground: e.target.value === 'transparent' ? 'transparent' : '#ffffff' })} data-testid="select-brand-logo-background"><option value="transparent">Transparent</option><option value="color">Custom color</option></select>
            </F>
            {(b.logoBackground ?? (b.logoMode === 'image' ? '#ffffff' : 'transparent')) !== 'transparent' ? <F label="Logo background color"><input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent" value={str(b.logoBackground, '#ffffff')} onChange={(e) => brand.setDraft({ ...b, logoBackground: e.target.value })} data-testid="input-brand-logo-background" /></F> : null}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Logo preview</p>
            <div className="flex min-h-36 items-center justify-center overflow-auto rounded-lg border border-white/10 p-4" data-testid="brand-image-preview">
              <BrandMark name={str(b.name, 'ZefoHR')} logoUrl={str(b.logoUrl)} logoAlt={str(b.logoAlt)} logoMode={str(b.logoMode, b.logoUrl ? 'image' : 'mark')} showWordmark={b.showWordmark !== false} logoRadius={b.logoRadius} logoPadding={b.logoPadding} logoBackground={b.logoBackground} />
            </div>
            {b.tagline ? <p className="mt-3 text-sm text-muted-foreground">{str(b.tagline)}</p> : null}
          </div>
        </div>
      </Card>

      <Card title="Website contact profile" sub="Shared by the Contact page, Support page and footer. Leave optional details blank to hide them." actions={<SaveBar d={contact} label="contact-profile" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Mobile / telephone" hint="Include the country code."><input type="tel" className={aInput} value={str(c.phone)} onChange={(e) => contact.setDraft({ ...c, phone: e.target.value })} data-testid="input-profile-phone" /></F>
          <F label="Public email"><input type="email" className={aInput} value={str(c.email)} onChange={(e) => contact.setDraft({ ...c, email: e.target.value })} data-testid="input-profile-email" /></F>
          <div className="sm:col-span-2"><F label="Office address"><textarea rows={3} className={aInput} value={str(c.address)} onChange={(e) => contact.setDraft({ ...c, address: e.target.value })} data-testid="input-profile-address" /></F></div>
          <F label="Map link" hint="Optional full https link to your office location."><input type="url" className={aInput} value={str(c.mapUrl)} onChange={(e) => contact.setDraft({ ...c, mapUrl: e.target.value })} data-testid="input-profile-map" /></F>
          <F label="Office hours"><input className={aInput} value={str(c.officeHours)} onChange={(e) => contact.setDraft({ ...c, officeHours: e.target.value })} data-testid="input-profile-hours" /></F>
        </div>
      </Card>

      <Card title="Social profiles" sub="Profiles without a URL show as unavailable in the footer. Never add accounts you do not own." actions={<SaveBar d={footer} label="socials" />}>
        <div className="space-y-3">
          {SOCIALS.map(({ platform, label, I }) => {
            const s = socials.find((x) => x.platform === platform) ?? {};
            return (
              <div key={platform} className="grid items-center gap-3 sm:grid-cols-[150px_1fr_160px_auto]">
                <span className="flex items-center gap-2 text-sm"><I className="h-4 w-4 text-[color:var(--ph-cyan)]" />{label}</span>
                <input className={aInput} placeholder="https://" value={str(s.url)} onChange={(e) => setSocial(platform, { url: e.target.value })} aria-label={`${label} URL`} data-testid={`input-social-${platform}`} />
                <input className={aInput} placeholder="Label" value={str(s.label, label)} onChange={(e) => setSocial(platform, { label: e.target.value })} aria-label={`${label} label`} data-testid={`input-social-label-${platform}`} />
                <Switch on={s.enabled !== false} onChange={(v) => setSocial(platform, { enabled: v })} id={`social-${platform}`} />
              </div>
            );
          })}
          <F label="Message shown for unconfigured profiles"><input className={aInput} value={str(f.socialUnavailableMessage)} onChange={(e) => footer.setDraft({ ...f, socialUnavailableMessage: e.target.value })} data-testid="input-social-unavailable" /></F>
        </div>
      </Card>

      <Card title="WhatsApp button" sub="With a valid number the button opens WhatsApp. Without one it links to your fallback page." actions={<SaveBar d={wa} label="whatsapp" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 sm:col-span-2"><span className="text-sm">Show floating button</span><Switch on={w.enabled !== false} onChange={(v) => wa.setDraft({ ...w, enabled: v })} id="whatsapp" /></div>
          <F label="Phone with country code" hint={str(w.phone) ? (waValid ? `Opens wa.me/${digits}` : 'Enter 10 to 15 digits, e.g. 91 followed by the number') : 'Empty: visitors are sent to the fallback page'}><input className={aInput} value={str(w.phone)} onChange={(e) => wa.setDraft({ ...w, phone: e.target.value })} data-testid="input-wa-phone" /></F>
          <F label="Fallback link"><input className={aInput} value={str(w.fallbackHref)} onChange={(e) => wa.setDraft({ ...w, fallbackHref: e.target.value })} data-testid="input-wa-fallback" /></F>
          <F label="Button label"><input className={aInput} value={str(w.label)} onChange={(e) => wa.setDraft({ ...w, label: e.target.value })} data-testid="input-wa-label" /></F>
          <F label="Label when no number is set"><input className={aInput} value={str(w.unconfiguredLabel)} onChange={(e) => wa.setDraft({ ...w, unconfiguredLabel: e.target.value })} data-testid="input-wa-unconfigured" /></F>
          <div className="sm:col-span-2"><F label="Prefilled message"><textarea className={cn(aInput, 'min-h-[70px]')} value={str(w.message)} onChange={(e) => wa.setDraft({ ...w, message: e.target.value })} data-testid="input-wa-message" /></F></div>
          <div className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground"><MessageCircle className="h-4 w-4 text-[#1f9d55]" />Visitors will see: <strong className="text-foreground">{waValid ? str(w.label, 'Chat on WhatsApp') : str(w.unconfiguredLabel, 'Contact our team')}</strong></div>
        </div>
      </Card>

      <Card title="Mega menu" sub="Top-level menus, their groups and links. Icons use names such as Users, Wallet, ShieldCheck." actions={<SaveBar d={nav} label="nav" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Header call to action"><input className={aInput} value={str(n.ctaLabel)} onChange={(e) => nav.setDraft({ ...n, ctaLabel: e.target.value })} data-testid="input-nav-cta" /></F>
          <F label="Log in label"><input className={aInput} value={str(n.loginLabel)} onChange={(e) => nav.setDraft({ ...n, loginLabel: e.target.value })} data-testid="input-nav-login" /></F>
        </div>
        <div className="mt-5"><JsonForm value={arr(n.megaMenu)} onChange={(v) => nav.setDraft({ ...n, megaMenu: v })} path="nav-megaMenu" /></div>
      </Card>

      <Card title="Footer" sub="Description, link columns, compliance note and copyright. Use {year} for the current year." actions={<SaveBar d={footer} label="footer" />}>
        <div className="grid gap-4">
          <F label="Description"><textarea className={cn(aInput, 'min-h-[70px]')} value={str(f.description)} onChange={(e) => footer.setDraft({ ...f, description: e.target.value })} data-testid="input-footer-description" /></F>
          <F label="Compliance note" hint="Required disclaimer. Keep this present."><textarea className={cn(aInput, 'min-h-[70px]')} value={str(f.complianceNote)} onChange={(e) => footer.setDraft({ ...f, complianceNote: e.target.value })} data-testid="input-footer-compliance" /></F>
          <F label="Copyright"><input className={aInput} value={str(f.copyright)} onChange={(e) => footer.setDraft({ ...f, copyright: e.target.value })} data-testid="input-footer-copyright" /></F>
          <div><span className="mb-2 block text-xs font-medium text-foreground/80">Columns</span><JsonForm value={arr(f.columns)} onChange={(v) => footer.setDraft({ ...f, columns: v })} path="footer-columns" /></div>
        </div>
      </Card>
    </div>
  );
}
