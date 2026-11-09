import { arr, str, useSection, type AnyObj } from '@/lib/content';
import { Container, Reveal, SectionHead } from './primitives';

/** Public client logo wall. Omitted entirely when disabled or no visible clients. */
export function ClientsSection() {
  const s = useSection('clients');
  const items = arr<AnyObj>(s.items).filter((c) => c && c.visible !== false && str(c.logoUrl) && str(c.name));
  if (s.enabled === false || !items.length) return null;
  return (
    <section id="clients" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <SectionHead eyebrow={str(s.eyebrow)} title={str(s.title)} description={str(s.description)} center />
        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((c, i) => {
            const name = str(c.name);
            const site = /^https?:\/\//.test(str(c.website)) ? str(c.website) : '';
            const logo = (
              <span className="flex h-28 items-center justify-center rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#ffffff] p-5 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-32">
                <img src={str(c.logoUrl)} alt={str(c.alt).trim() || name} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
              </span>
            );
            return (
              <Reveal as="li" key={str(c.id, String(i))} delay={(i % 4) * 60} className="group">
                {site ? <a href={site} target="_blank" rel="noopener noreferrer" aria-label={`${name} website`} data-testid={`link-client-${i}`}>{logo}</a> : <div data-testid={`card-client-${i}`}>{logo}</div>}
                <span className="sr-only">{name}</span>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
