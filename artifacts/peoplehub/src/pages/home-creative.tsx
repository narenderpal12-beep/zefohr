import { useMemo } from 'react';
import { arr, str, usePublicPosts, useSection, type AnyObj } from '@/lib/content';
import { creativeHomeDefaults } from '../../../../lib/peoplehub/src/creative-home-defaults';
import {
  creativeSectionComponents, type CreativeHomeData,
} from '@/components/site/creative-home/sections';
import './home-creative.css';

export const CREATIVE_SECTION_OPTIONS = [
  { key: 'hero', label: 'Creative home — Hero' },
  { key: 'clients', label: 'Creative home — Client logos' },
  { key: 'roles', label: 'Creative home — Role selector' },
  { key: 'suites', label: 'Creative home — Planned suites' },
  { key: 'journey', label: 'Creative home — People journey' },
  { key: 'services', label: 'Creative home — Specialist services' },
  { key: 'learning', label: 'Creative home — Learning & resources' },
  { key: 'faq', label: 'Creative home — FAQs' },
  { key: 'finalCta', label: 'Creative home — Closing invitation' },
] as const;

type CreativeSectionInput = string | { key?: string; section?: string };

/**
 * Dynamic-page-builder renderer. `content` is an optional homepageV3-shaped
 * object and is shallow-merged over the live homepageV3 CMS section.
 */
export function CreativeHomeSection({ section, content }: { section: CreativeSectionInput; content?: AnyObj }) {
  const homepage = useSection<AnyObj>('homepageV3');
  const brand = useSection<AnyObj>('brand');
  const suitesSection = useSection<AnyObj>('suites');
  const servicesSection = useSection<AnyObj>('services');
  const clientsSection = useSection<AnyObj>('clients');
  const faqSection = useSection<AnyObj>('faq');
  const whyUs = useSection<AnyObj>('whyUs');
  const { posts } = usePublicPosts();
  const page = useMemo(() => ({
    ...creativeHomeDefaults,
    ...homepage,
    ...(content ?? {}),
    hero: {
      ...creativeHomeDefaults.hero,
      ...(homepage.hero ?? {}),
      ...(content?.hero ?? {}),
    },
  }), [homepage, content]);
  const data: CreativeHomeData = {
    page,
    brand,
    suites: arr<AnyObj>(suitesSection.items),
    services: arr<AnyObj>(servicesSection.items),
    clientsSection,
    faq: arr<AnyObj>(faqSection.items),
    posts: arr<AnyObj>(posts),
    complianceNote: str(whyUs.complianceNote),
  };
  const key = str(typeof section === 'string' ? section : section.key ?? section.section);
  const Section = creativeSectionComponents[key];
  if (!Section) return null;
  return <Section data={data} />;
}

const homepageSections = CREATIVE_SECTION_OPTIONS.map(({ key }) => key);

export function HomeCreative() {
  return (
    <main className="home-creative phv3" data-testid="home-creative">
      {homepageSections.map((section) => <CreativeHomeSection key={section} section={section} />)}
    </main>
  );
}

export default HomeCreative;
