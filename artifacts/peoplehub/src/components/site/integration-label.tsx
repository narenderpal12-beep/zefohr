/** Legacy text entries and upload-enabled integration entries share one renderer. */
export function IntegrationLabel({ item }: { item: unknown }) {
  if (typeof item === 'string') return <>{item}</>;
  if (!item || typeof item !== 'object') return null;
  const entry = item as Record<string, unknown>;
  const name = typeof entry.name === 'string' ? entry.name : '';
  if (entry.displayMode === 'image') {
    const src = typeof entry.imageUrl === 'string' ? entry.imageUrl : '';
    return src ? <img src={src} alt={name || 'Integration logo'} className="inline-block h-10 w-32 max-w-full object-contain align-middle" loading="lazy" /> : null;
  }
  return <>{name}</>;
}
