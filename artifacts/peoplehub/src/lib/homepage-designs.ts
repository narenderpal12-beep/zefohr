export const HOMEPAGE_DESIGNS = [
  { id: 'original', label: 'Original homepage', description: 'The existing modular ZefoHR homepage.' },
  { id: 'alternate', label: 'Alternate homepage', description: 'The second design with interactive product storytelling.' },
  { id: 'creative', label: 'Creative homepage · third design', description: 'A fresh people-first experience with reusable sections.' },
] as const;

export type HomepageDesign = typeof HOMEPAGE_DESIGNS[number]['id'];

export function normalizeHomepageDesign(value: unknown): HomepageDesign {
  return HOMEPAGE_DESIGNS.some((design) => design.id === value) ? value as HomepageDesign : 'original';
}

/** A preview changes only this visit, never the saved public homepage. */
export function resolveHomepageDesign(saved: unknown, search = ''): HomepageDesign {
  const preview = new URLSearchParams(search).get('homePreview');
  return HOMEPAGE_DESIGNS.some((design) => design.id === preview)
    ? normalizeHomepageDesign(preview)
    : normalizeHomepageDesign(saved);
}
