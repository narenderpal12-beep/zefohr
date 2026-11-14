import type { CSSProperties } from 'react';

export type LogoAppearance = { logoRadius?: number; logoPadding?: number; logoBackground?: string };

export function logoStyle(mode: string, appearance: LogoAppearance): CSSProperties {
  const image = mode === 'image';
  const background = appearance.logoBackground === 'transparent' || /^#[0-9a-f]{6}$/i.test(appearance.logoBackground ?? '')
    ? appearance.logoBackground! : image ? '#ffffff' : 'transparent';
  const radius = Number.isFinite(appearance.logoRadius) ? Math.max(0, Math.min(100, appearance.logoRadius!)) : image ? 6 : 0;
  const padding = Number.isFinite(appearance.logoPadding) ? Math.max(0, Math.min(32, appearance.logoPadding!)) : image ? 4 : 0;
  const style: CSSProperties = { backgroundColor: background, borderRadius: radius, padding };
  if (!image && background !== 'transparent') {
    const rgb = background.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    style.color = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > .179 ? '#0f172a' : '#ffffff';
    style.backgroundImage = 'none';
    style.WebkitTextFillColor = 'currentColor';
  }
  return style;
}
