import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Briefcase, Check, ExternalLink, LifeBuoy, Mail, MapPin, Newspaper, Send, FolderOpen } from 'lucide-react';
import { useCreateLead } from '@workspace/api-client-react';
import { arr, errMsg, str, useContent, usePublicPages, useSection, type AnyObj } from '@/lib/content';
import { Markdown } from '@/lib/markdown';
import { Container, CtaLink, FaqList, PageHero, Reveal, btnPrimary } from '@/components/site/primitives';
import { CtaBand, Field, inputCls } from '@/components/site/sections';
import { NotFoundPage, PageSkeleton, fmtDate } from './public';
import { cn } from '@/lib/utils';

/** Finds the editable page record for any of the given slugs (published only). */
function usePageRecord(slugs: string[]): AnyObj | undefined {
  const { pages } = usePublicPages();
  const [loc] = useLocation();
  const cur = loc.replace(/^\/+|\/+$/g, '');
  const order = [cur, ...slugs.filter((s) => s !== cur)];
  for (const s of order) {
    const p = pages.find((x) => str(x.slug).replace(/^\/+|\/+$/g, '') === s && (!x.status || x.status === 'published'));
    if (p) return p;
  }
  return undefined;
}

function Hero({ section, page, crumb }: { section: AnyObj; page?: AnyObj; crumb: string }) {
  const pc = (page?.content ?? {}) as AnyObj;
  return (
    <PageHero
      crumbs={[{ label: 'Home', href: '/' }, { label: crumb }]}
      eyebrow={str(section.eyebrow)}
      title={str(page?.title || section.title, crumb)}
      description={str(pc.intro || section.description)}
    />
  );
}

function PageBody({ page }: { page?: AnyObj }) {
  const body = str((page?.content as AnyObj | undefined)?.body);
  if (!body.trim()) return null;
  return <Container className="mb-12 max-w-3xl"><div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={body} /></div></Container>;
}

function Empty({ icon: I, text }: { icon: typeof Newspaper; text: string }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl p-14 text-center" data-testid="status-empty">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]"><I className="h-6 w-6 text-[color:var(--ph-cyan)]" /></span>
      <p className="mt-5 max-w-md text-muted-foreground">{text}</p>
      <div className="mt-6"><CtaLink href="/contact" variant="ghost" testId="link-empty-contact">Talk to our team</CtaLink></div>
    </div>
  );
}

export function MediaPage() {
  const m = useSection('media');
  const content = useContent();
  const page = usePageRecord(['media-coverage']);
  const items = arr<AnyObj>(m.items).filter((i) => str(i.title));
  if (!content) return <PageSkeleton />;
  return (
    <>
      <Hero section={m} page={page} crumb="Media coverage" />
      <PageBody page={page} />
      <Container>
        {!items.length ? <Empty icon={Newspaper} text={str(m.emptyMessage, 'No press coverage has been published yet.')} /> : (
          <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {items.map((it, i) => {
              const url = str(it.url);
              const Tag = url ? 'a' : 'div';
              return (
                <Reveal as="li" key={i} delay={(i % 4) * 60}>
                  <Tag {...(url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {})} className="group grid gap-3 py-7 sm:grid-cols-[180px_1fr_auto] sm:items-baseline" data-testid={`item-media-${i}`}>
                    <div className="font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--ph-pink)]">{str(it.publication)}<div className="mt-1 text-muted-foreground">{fmtDate(it.date) || str(it.date)}</div></div>
                    <div>
                      {it.sample ? <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-200">Sample — not verified coverage</span> : null}
                      <h2 className="font-display text-2xl font-bold leading-tight text-foreground group-hover:text-[color:var(--ph-cyan)]">{str(it.title)}</h2>
                      {it.description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{str(it.description)}</p> : null}
                    </div>
                    {url ? <ExternalLink className="h-4 w-4 text-muted-foreground" /> : <span />}
                  </Tag>
                </Reveal>
              );
            })}
          </ol>
        )}
      </Container>
      <CtaBand />
    </>
  );
}

const caseSlug = (c: AnyObj, i: number) => str(c.slug) || `story-${i + 1}`;

export function CaseStudiesPage() {
  const cs = useSection('caseStudies');
  const content = useContent();
  const page = usePageRecord(['case-studies']);
  const items = arr<AnyObj>(cs.items).filter((i) => str(i.title));
  if (!content) return <PageSkeleton />;
  return (
    <>
      <Hero section={cs} page={page} crumb="Use cases" />
      <PageBody page={page} />
      <Container>
        {!items.length ? <Empty icon={FolderOpen} text={str(cs.emptyMessage, 'Use cases will appear here when published.')} /> : (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((c, i) => (
              <Reveal key={i} delay={(i % 2) * 80} className={cn(i === 0 && items.length > 2 && 'md:col-span-2')}>
                <Link href={`/case-studies/${caseSlug(c, i)}`} className="glass border-gradient group block h-full rounded-3xl p-7 sm:p-9" data-testid={`link-case-${caseSlug(c, i)}`}>
                  {c.sample ? <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-200">Illustrative use case</span> : null}
                  {c.industry ? <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ph-cyan)]">{str(c.industry)}</span> : null}
                  <h2 className="font-display mt-5 text-2xl font-bold leading-tight sm:text-3xl">{str(c.title)}</h2>
                  <p className="mt-3 text-muted-foreground">{str(c.summary)}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-foreground/85 group-hover:text-foreground">{str(cs.linkLabel)} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
      <CtaBand />
    </>
  );
}

export function CaseStudyDetailPage() {
  const params = useParams<{ slug: string }>();
  const cs = useSection('caseStudies');
  const content = useContent();
  const items = arr<AnyObj>(cs.items);
  const idx = items.findIndex((c, i) => caseSlug(c, i) === params.slug);
  if (!content) return <PageSkeleton />;
  if (idx < 0) return <NotFoundPage />;
  const c = items[idx];
  return (
    <article>
      <PageHero crumbs={[{ label: 'Home', href: '/' }, { label: 'Use cases', href: '/case-studies' }, { label: str(c.title) }]} eyebrow={str(c.industry)} title={str(c.title)} description={str(c.summary)} />
      <Container className="max-w-3xl">
        {c.sample ? <p className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100" role="note">Illustrative use case only — this is not a customer story and does not describe a verified implementation or result.</p> : null}
        <div className="glass rounded-3xl p-7 sm:p-10"><Markdown source={str(c.body)} /></div>
        <Link href="/case-studies" className="mt-10 inline-flex items-center gap-2 text-sm text-[color:var(--ph-cyan)]" data-testid="link-back-cases"><ArrowLeft className="h-4 w-4" />{str(cs.backLabel, 'All use cases')}</Link>
      </Container>
      <CtaBand />
    </article>
  );
}

export function CareersPage() {
  const cr = useSection('careers');
  const content = useContent();
  const page = usePageRecord(['careers', 'career']);
  const items = arr<AnyObj>(cr.items).filter((i) => str(i.title));
  if (!content) return <PageSkeleton />;
  return (
    <>
      <Hero section={cr} page={page} crumb="Careers" />
      <PageBody page={page} />
      <Container>
        {!items.length ? <Empty icon={Briefcase} text={str(cr.emptyMessage, 'There are no open roles right now.')} /> : (
          <ul className="space-y-3">
            {items.map((j, i) => {
              const email = str(j.applyEmail).trim();
              return (
                <Reveal as="li" key={i} delay={(i % 4) * 50} className="glass rounded-2xl p-6" >
                  <div className="flex flex-wrap items-start justify-between gap-4" data-testid={`item-job-${i}`}>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-xl font-bold">{str(j.title)}</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {j.department ? <span>{str(j.department)}</span> : null}
                        {j.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{str(j.location)}</span> : null}
                        {j.employmentType ? <span className="text-[color:var(--ph-cyan)]">{str(j.employmentType)}</span> : null}
                      </div>
                      {j.description ? <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{str(j.description)}</p> : null}
                    </div>
                    {email.includes('@') ? <a href={`mailto:${email}?subject=${encodeURIComponent(`Application: ${str(j.title)}`)}`} className={cn(btnPrimary, 'py-2.5')} data-testid={`link-apply-${i}`}><Mail className="h-4 w-4" />{str(cr.applyLabel)}</a> : null}
                  </div>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Container>
      <CtaBand />
    </>
  );
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Enter a valid email').max(254),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  organisation: z.string().trim().max(200).optional().or(z.literal('')),
  extra: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Tell us a little more').max(4500),
});
type Enquiry = z.infer<typeof enquirySchema>;

function EnquiryForm({ kind, title, successMessage, extraLabel, messageLabel }: { kind: 'Demo request' | 'Support request'; title: string; successMessage: string; extraLabel: string; messageLabel: string }) {
  const copy = useSection(kind === 'Demo request' ? 'demo' : 'support');
  const contact = useSection('contact');
  const optional = str(copy.optionalLabel);
  const lead = useCreateLead();
  const [done, setDone] = useState(false);
  const form = useForm<Enquiry>({ resolver: zodResolver(enquirySchema), defaultValues: { name: '', email: '', phone: '', organisation: '', extra: '', message: '' } });
  const onSubmit = form.handleSubmit((v) => {
    const message = [`[${kind}]`, v.extra ? `${extraLabel}: ${v.extra}` : '', v.message].filter(Boolean).join('\n');
    lead.mutate(
      { data: { name: v.name, email: v.email, message, ...(v.phone ? { phone: v.phone } : {}), ...(v.organisation ? { organisation: v.organisation } : {}) } },
      { onSuccess: () => { setDone(true); form.reset(); } },
    );
  });
  const e = form.formState.errors;
  const tid = kind === 'Demo request' ? 'demo' : 'support';
  if (done) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center" data-testid={`status-${tid}-sent`}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--ph-cyan)]/15"><Check className="h-7 w-7 text-[color:var(--ph-cyan)]" /></span>
        <p className="mt-5 max-w-sm text-foreground">{successMessage}</p>
        <button type="button" onClick={() => setDone(false)} className="mt-6 text-sm text-[color:var(--ph-cyan)] underline underline-offset-4" data-testid={`button-${tid}-again`}>{str(copy.sendAnotherLabel)}</button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <h2 className="font-display text-2xl font-bold sm:col-span-2">{title}</h2>
      <Field label={str(contact.nameLabel)} error={e.name?.message}><input className={inputCls} {...form.register('name')} autoComplete="name" data-testid={`input-${tid}-name`} /></Field>
      <Field label={str(contact.emailLabel)} error={e.email?.message}><input type="email" className={inputCls} {...form.register('email')} autoComplete="email" data-testid={`input-${tid}-email`} /></Field>
      <Field label={`${str(contact.phoneLabel)} (${optional})`} error={e.phone?.message}><input className={inputCls} {...form.register('phone')} autoComplete="tel" data-testid={`input-${tid}-phone`} /></Field>
      <Field label={`${str(contact.organisationLabel)} (${optional})`} error={e.organisation?.message}><input className={inputCls} {...form.register('organisation')} autoComplete="organization" data-testid={`input-${tid}-org`} /></Field>
      <div className="sm:col-span-2"><Field label={`${extraLabel} (${optional})`} error={e.extra?.message}><input className={inputCls} {...form.register('extra')} data-testid={`input-${tid}-extra`} /></Field></div>
      <div className="sm:col-span-2"><Field label={messageLabel} error={e.message?.message}><textarea rows={5} className={inputCls} {...form.register('message')} data-testid={`input-${tid}-message`} /></Field></div>
      {lead.isError ? <p className="text-sm text-[hsl(var(--destructive))] sm:col-span-2">{errMsg(lead.error)}</p> : null}
      <div className="sm:col-span-2"><button type="submit" disabled={lead.isPending} className={cn(btnPrimary, 'w-full sm:w-auto')} data-testid={`button-${tid}-submit`}>{str(lead.isPending ? copy.sendingLabel : copy.button)} <Send className="h-4 w-4" /></button></div>
    </form>
  );
}

export function SupportPage() {
  const s = useSection('support');
  const content = useContent();
  const contact = useSection('contact');
  const page = usePageRecord(['support', 'our-support']);
  if (!content) return <PageSkeleton />;
  const faq = arr<AnyObj>(s.faq).filter((f) => str(f.question));
  return (
    <>
      <Hero section={s} page={page} crumb="Support" />
      <PageBody page={page} />
      <Container className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <div className="flex items-center gap-3"><LifeBuoy className="h-5 w-5 text-[color:var(--ph-cyan)]" /><h2 className="font-display text-2xl font-bold">{str(s.faqTitle)}</h2></div>
          {faq.length ? <div className="mt-6"><FaqList items={faq} idPrefix="support-faq" /></div> : <p className="mt-4 text-sm text-muted-foreground">{str(s.emptyFaqMessage)}</p>}
          {contact.email || contact.phone || contact.address || contact.officeHours ? (
            <div className="glass mt-6 space-y-2 rounded-2xl p-5 text-sm">
              {contact.email ? <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-foreground/90 hover:text-foreground" data-testid="link-support-email"><Mail className="h-4 w-4 text-[color:var(--ph-pink)]" />{str(contact.email)}</a> : null}
              {contact.phone ? <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} className="block font-mono text-foreground/90" data-testid="link-support-phone">{str(contact.phone)}</a> : null}
              {contact.address ? <address className="flex items-start gap-2 whitespace-pre-line break-words not-italic" data-testid="text-support-address"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ph-cyan)]" /><span>{contact.mapUrl ? <a href={str(contact.mapUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline">{str(contact.address)}</a> : str(contact.address)}</span></address> : null}
              {contact.officeHours ? <p className="text-muted-foreground">{str(contact.officeHours)}</p> : null}
            </div>
          ) : null}
        </div>
        <div className="glass border-gradient h-fit rounded-3xl p-6 sm:p-8">
          <EnquiryForm kind="Support request" title={str(s.formTitle, 'Raise a support request')} successMessage={str(s.successMessage, 'Thanks. Our support team will get back to you shortly.')} extraLabel={str(s.topicLabel, 'Topic')} messageLabel={str(s.messageLabel, 'Describe the issue')} />
        </div>
      </Container>
      <CtaBand />
    </>
  );
}

export function DemoPage() {
  const d = useSection('demo');
  const content = useContent();
  const page = usePageRecord(['request-demo', 'request-for-demo']);
  if (!content) return <PageSkeleton />;
  const benefits = arr<unknown>(d.benefits).map((b) => str(b)).filter(Boolean);
  return (
    <>
      <Hero section={d} page={page} crumb="Request a demo" />
      <PageBody page={page} />
      <Container className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          {benefits.length ? (
            <ul className="space-y-4">
              {benefits.map((b, i) => (
                <Reveal as="li" key={i} delay={i * 60} className="flex gap-4">
                  <span className="font-display text-3xl font-bold text-[color:var(--ph-indigo)]">{String(i + 1).padStart(2, '0')}</span>
                  <p className="pt-1.5 text-lg text-foreground/90">{b}</p>
                </Reveal>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="glass border-gradient rounded-3xl p-6 sm:p-8">
          <EnquiryForm kind="Demo request" title={str(d.formTitle, 'Book your walkthrough')} successMessage={str(d.successMessage, 'Thank you. We will reach out to schedule your demo.')} extraLabel={str(d.teamSizeLabel, 'Team size')} messageLabel={str(d.messageLabel, 'What would you like to see?')} />
        </div>
      </Container>
    </>
  );
}
