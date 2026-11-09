/* Theme presets: 12 palettes, each with a light and dark variant, mapped onto CSS variables. */
export type Mode = 'light' | 'dark';
type Swatch = { primary: string; cyan: string; pink: string; bg: string };
export interface Preset { id: string; label: string; note: string; hue: number; sat: number; dark: Swatch; light: Swatch }

export const SITE_WIDTH_OPTIONS = [
  { id: 'standard', label: 'Standard container', note: 'Comfortable reading width', preview: '72%' },
  { id: 'wide', label: 'Wide container', note: 'More room for content', preview: '86%' },
  { id: 'fluid', label: 'Full width', note: 'Use the available screen width', preview: '100%' },
  { id: 'custom', label: 'Custom width', note: 'Set a maximum width', preview: '80%' },
] as const;

/** Resolve a saved Appearance choice to a safe CSS max-width. */
export function siteContainerMaxWidth(theme: Record<string, unknown> | undefined): string {
  switch (theme?.containerLayout) {
    case 'wide': return '84rem';
    case 'fluid': return '100%';
    case 'custom': {
      const width = Number(theme.customContainerWidth);
      return `${Math.max(1080, Math.min(1920, Number.isFinite(width) && width ? width : 1440))}px`;
    }
    case 'standard':
    default: return '72rem';
  }
}

export const PRESETS: Preset[] = [
  { id: 'aurora', label: 'Aurora', note: 'Indigo, cyan and rose. The signature look.', hue: 232, sat: 45,
    dark: { primary: '#6d6cf6', cyan: '#22d3ee', pink: '#f472b6', bg: '#060816' }, light: { primary: '#4f46e5', cyan: '#0e7490', pink: '#be185d', bg: '#f5f6fc' } },
  { id: 'ocean', label: 'Ocean', note: 'Deep sea blues with a coral edge.', hue: 212, sat: 50,
    dark: { primary: '#3b8cf6', cyan: '#38e1d2', pink: '#ff8a6b', bg: '#04101f' }, light: { primary: '#1d5fd1', cyan: '#0f766e', pink: '#c2410c', bg: '#f2f7fc' } },
  { id: 'emerald', label: 'Emerald', note: 'Fresh greens balanced by violet.', hue: 160, sat: 35,
    dark: { primary: '#10c48a', cyan: '#7dd3fc', pink: '#c084fc', bg: '#03130e' }, light: { primary: '#047857', cyan: '#0369a1', pink: '#7e22ce', bg: '#f2f8f5' } },
  { id: 'sunset', label: 'Sunset', note: 'Warm orange into magenta dusk.', hue: 18, sat: 40,
    dark: { primary: '#ff7a45', cyan: '#fbbf24', pink: '#ec4899', bg: '#160a06' }, light: { primary: '#c2410c', cyan: '#a16207', pink: '#be185d', bg: '#fcf6f2' } },
  { id: 'rose', label: 'Rose', note: 'Soft rose with plum depth.', hue: 340, sat: 38,
    dark: { primary: '#f0568c', cyan: '#a5b4fc', pink: '#fda4af', bg: '#15060c' }, light: { primary: '#be123c', cyan: '#4338ca', pink: '#9d174d', bg: '#fcf4f6' } },
  { id: 'royal', label: 'Royal', note: 'Regal violet and gold.', hue: 268, sat: 45,
    dark: { primary: '#9b6cf6', cyan: '#facc15', pink: '#f0abfc', bg: '#0b0618' }, light: { primary: '#6d28d9', cyan: '#a16207', pink: '#a21caf', bg: '#f7f4fc' } },
  { id: 'slate', label: 'Slate', note: 'Quiet graphite with a steel-blue pulse.', hue: 215, sat: 18,
    dark: { primary: '#7c93b8', cyan: '#5eead4', pink: '#fca5a5', bg: '#080b10' }, light: { primary: '#334e78', cyan: '#0f766e', pink: '#b91c1c', bg: '#f4f5f7' } },
  { id: 'teal', label: 'Teal', note: 'Clear teal with saffron accents.', hue: 182, sat: 40,
    dark: { primary: '#14b8b0', cyan: '#fdba74', pink: '#f9a8d4', bg: '#031314' }, light: { primary: '#0f766e', cyan: '#b45309', pink: '#be185d', bg: '#f1f8f8' } },
  { id: 'amber', label: 'Amber', note: 'Turmeric warmth on deep ink.', hue: 38, sat: 40,
    dark: { primary: '#f5a524', cyan: '#67e8f9', pink: '#fb7185', bg: '#120d04' }, light: { primary: '#a85b00', cyan: '#0e7490', pink: '#be123c', bg: '#fcf8f0' } },
  { id: 'crimson', label: 'Crimson', note: 'Bold red with cool counterpoints.', hue: 355, sat: 40,
    dark: { primary: '#ef4458', cyan: '#93c5fd', pink: '#fdba74', bg: '#140507' }, light: { primary: '#b91c2e', cyan: '#1d4ed8', pink: '#c2410c', bg: '#fcf3f3' } },
  { id: 'indigo', label: 'Indigo', note: 'Ink-dyed indigo with mint.', hue: 238, sat: 50,
    dark: { primary: '#5865f2', cyan: '#6ee7b7', pink: '#c4b5fd', bg: '#05061a' }, light: { primary: '#3730a3', cyan: '#047857', pink: '#6d28d9', bg: '#f3f4fc' } },
  { id: 'forest', label: 'Forest', note: 'Deep woodland green with clay.', hue: 140, sat: 28,
    dark: { primary: '#4caf6e', cyan: '#d6c36a', pink: '#e9967a', bg: '#06100a' }, light: { primary: '#2f6b40', cyan: '#8a6d0b', pink: '#a3412a', bg: '#f3f7f2' } },
];

export const presetById = (id?: unknown): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
export const normMode = (m: unknown): Mode | undefined => (m === 'light' || m === 'dark' ? m : undefined);

function hexToHsl(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function resolveSwatch(theme: Record<string, unknown> | undefined, mode: Mode): Swatch {
  const p = presetById(theme?.preset);
  const base = { ...p[mode] };
  // Light palettes share a clean white canvas; only their accent colours vary.
  if (mode === 'light') base.bg = '#ffffff';
  if (theme?.customColors) {
    const ok = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
    if (ok(theme.primary)) base.primary = String(theme.primary);
    if (ok(theme.cyan)) base.cyan = String(theme.cyan);
    if (ok(theme.pink)) base.pink = String(theme.pink);
    // A custom background only applies to the mode it was designed for (the admin default mode).
    const dm = normMode(theme.defaultMode) ?? 'dark';
    if (ok(theme.background) && dm === mode) base.bg = String(theme.background);
  }
  return base;
}

/** Full CSS variable map for a theme + mode. Strings only, deterministic for SSR. */
export function themeVars(theme: Record<string, unknown> | undefined, mode: Mode): Record<string, string> {
  const p = presetById(theme?.preset);
  const sw = resolveSwatch(theme, mode);
  const h = p.hue, s = p.sat;
  const prim = hexToHsl(sw.primary) ?? '243 85% 67%';
  const acc = hexToHsl(sw.cyan) ?? '189 85% 52%';
  const bgH = hexToHsl(sw.bg);
  const v: Record<string, string> = {
    '--ph-indigo': sw.primary, '--ph-cyan': sw.cyan, '--ph-pink': sw.pink, '--ph-bg': sw.bg,
    '--primary': prim, '--ring': prim, '--sidebar-primary': prim, '--sidebar-ring': prim, '--chart-1': prim, '--chart-2': acc,
    '--accent': acc, '--primary-foreground': '0 0% 99%', '--sidebar-primary-foreground': '0 0% 99%',
  };
  if (mode === 'dark') {
    Object.assign(v, {
      '--ph-ink': '#ffffff', '--ph-strong': `hsl(${h} ${s}% 9% / .78)`,
      '--background': bgH ?? `${h} ${s}% 5%`, '--foreground': `${h} 35% 94%`,
      '--card': `${h} ${s - 5}% 9%`, '--card-foreground': `${h} 35% 94%`, '--card-border': `${h} 25% 18%`,
      '--popover': `${h} ${s - 3}% 9%`, '--popover-foreground': `${h} 35% 94%`, '--popover-border': `${h} 25% 20%`,
      '--secondary': `${h} 28% 15%`, '--secondary-foreground': `${h} 35% 94%`,
      '--muted': `${h} 26% 13%`, '--muted-foreground': `${h} 16% 68%`, '--accent-foreground': `${h} ${s}% 6%`,
      '--border': `${h} 25% 18%`, '--input': `${h} 24% 24%`,
      '--sidebar': `${h} ${s}% 7%`, '--sidebar-foreground': `${h} 28% 88%`, '--sidebar-border': `${h} 25% 15%`,
      '--sidebar-accent': `${h} 30% 14%`, '--sidebar-accent-foreground': `${h} 35% 94%`,
    });
  } else {
    Object.assign(v, {
      '--ph-ink': '#111827', '--ph-strong': '#ffffff',
      '--background': bgH ?? '0 0% 100%', '--foreground': '222 47% 11%',
      '--card': '0 0% 100%', '--card-foreground': '222 47% 11%', '--card-border': '220 13% 91%',
      '--popover': '0 0% 100%', '--popover-foreground': '222 47% 11%', '--popover-border': '220 13% 88%',
      '--secondary': '220 14% 97%', '--secondary-foreground': '222 47% 14%',
      '--muted': '220 14% 97%', '--muted-foreground': '215 16% 37%', '--accent-foreground': '0 0% 99%',
      '--border': '220 13% 91%', '--input': '220 13% 80%',
      '--sidebar': '0 0% 100%', '--sidebar-foreground': '222 47% 16%', '--sidebar-border': '220 13% 91%',
      '--sidebar-accent': '220 14% 97%', '--sidebar-accent-foreground': '222 47% 11%',
    });
  }
  return v;
}
