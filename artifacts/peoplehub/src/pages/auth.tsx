import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Lock, ShieldCheck, Terminal } from 'lucide-react';
import {
  useLogin, useRegisterOrganisation, getGetMeQueryKey, type Account,
} from '@workspace/api-client-react';
import { arr, errMsg, errStatus, formatINR, str, useSection, type AnyObj } from '@/lib/content';
import { Aurora, btnPrimary } from '@/components/site/primitives';
import { BrandMark } from '@/components/site/layout';
import { Field, inputCls } from '@/components/site/sections';
import { cn } from '@/lib/utils';
import {SuccessLottie} from '@/components/site/success-lottie';
import { trackEvent } from '@/lib/analytics';

const INDUSTRIES = ['Manufacturing', 'IT & software services', 'Retail & e-commerce', 'Healthcare & pharma', 'Logistics & warehousing', 'Construction & real estate', 'Education', 'Financial services', 'Hospitality & food', 'Textiles & apparel', 'Automotive & engineering', 'Professional services', 'Other'];
const SIZE_BANDS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

function AuthFrame({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <Aurora />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.2fr] lg:py-12">
        <aside className="flex flex-col">
          <Link href="/" data-testid="link-auth-home"><BrandMark /></Link>
          <div className="mt-10 lg:mt-auto lg:mb-auto">{aside}</div>
        </aside>
        <main className="flex items-start lg:items-center">{children}</main>
      </div>
    </div>
  );
}

const regSchema = z
  .object({
    organisation_name: z.string().trim().min(2, 'At least 2 characters').max(200),
    industry: z.string().min(1, 'Choose an industry').max(100),
    size_band: z.string().min(1, 'Choose a size band').max(50),
    employee_count: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'At least 1').max(1000000),
    phone: z.string().trim().min(8, 'Enter a valid phone number').max(20),
    gst_number: z.string().trim().max(15, 'GSTIN is 15 characters').optional().or(z.literal('')),
    name: z.string().trim().min(2, 'At least 2 characters').max(100),
    email: z.string().trim().email('Enter a valid email').max(254),
    password: z.string().min(10, 'Minimum 10 characters').max(128),
    confirm_password: z.string(),
    plan_key: z.string().min(1),
    mode: z.enum(['trial', 'subscribe']),
    billing_cycle: z.enum(['monthly', 'annual']),
    terms: z.boolean().refine((v) => v, 'Please accept the terms to continue'),
  })
  .refine((v) => v.password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match' });
type RegForm = z.infer<typeof regSchema>;

export function RegisterPage() {
  const reg = useSection('register');
  const pricing = useSection('pricing');
  const plans = arr<AnyObj>(pricing.plans);
  const search = useSearch();
  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const qPlan = qs.get('plan');
  const qMode = qs.get('mode');
  const defaultPlan = plans.find((p) => p.key === qPlan)?.key ?? plans.find((p) => p.highlighted)?.key ?? plans[0]?.key ?? 'growth';
  const qc = useQueryClient();
  const mutation = useRegisterOrganisation();
  const [account, setAccount] = useState<Account | null>(null);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<RegForm>({
    resolver: zodResolver(regSchema),
    defaultValues: {
      organisation_name: '', industry: '', size_band: '', employee_count: '' as unknown as number, phone: '', gst_number: '',
      name: '', email: '', password: '', confirm_password: '', plan_key: str(defaultPlan),
      mode: qMode === 'subscribe' ? 'subscribe' : 'trial', billing_cycle: 'monthly', terms: false,
    },
  });
  const e = form.formState.errors;
  const mode = form.watch('mode');
  const planKey = form.watch('plan_key');
  const cycle = form.watch('billing_cycle');

  const onSubmit = form.handleSubmit((v) => {
    mutation.mutate(
      {
        data: {
          organisation_name: v.organisation_name, industry: v.industry, size_band: v.size_band, employee_count: v.employee_count,
          phone: v.phone, ...(v.gst_number ? { gst_number: v.gst_number.toUpperCase() } : {}), name: v.name, email: v.email,
          password: v.password, confirm_password: v.confirm_password, plan_key: v.plan_key, mode: v.mode,
          ...(v.mode === 'subscribe' ? { billing_cycle: v.billing_cycle } : {}), terms: v.terms,
        },
      },
      {
        onSuccess: (acc) => {
          trackEvent('signup_completed', { plan_key: v.plan_key, signup_mode: v.mode });
          qc.setQueryData(getGetMeQueryKey(), acc);
          void qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setAccount(acc);
          if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
        },
      },
    );
  });

  const aside = (
    <div>
      <h1 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl"><span className="text-gradient">{str(reg.title, 'Create your organisation')}</span></h1>
      <p className="mt-4 max-w-md text-muted-foreground">{str(reg.description)}</p>
      <ul className="mt-8 hidden space-y-3 text-sm text-foreground/85 lg:block">
        {[`${str(pricing.trialDays, '14')}-day trial, every module in your plan`, 'Payment is never charged automatically', 'Your data stays in your organisation workspace'].map((t) => (
          <li key={t} className="flex gap-2.5"><Check className="h-4 w-4 text-[color:var(--ph-cyan)]" />{t}</li>
        ))}
      </ul>
    </div>
  );

  if (account) {
    const sub = (account.subscription ?? {}) as AnyObj;
    const org = (account.organisation ?? {}) as AnyObj;
    return (
      <AuthFrame aside={aside}>
        <div className="glass border-gradient w-full rounded-3xl p-8 text-center sm:p-12" data-testid="status-registered">
          <SuccessMark />
          <h2 className="font-display mt-8 text-3xl font-bold">{str(reg.successTitle, 'You are in')}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{str(reg.successDescription)}</p>
          <dl className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-white/[0.04] p-4"><dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Organisation</dt><dd className="mt-1 font-medium">{str(org.name)}</dd></div>
            <div className="rounded-2xl bg-white/[0.04] p-4"><dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</dt><dd className="mt-1 font-medium capitalize">{str(sub.status).replace(/_/g, ' ')}</dd></div>
          </dl>
          {sub.status === 'pending_payment' ? <p className="mx-auto mt-5 max-w-md text-xs text-amber-200/80">Online payment is not yet enabled. Our team will contact you to activate your subscription; nothing has been charged.</p> : null}
          <Link href="/dashboard" className={cn(btnPrimary, 'mt-8')} data-testid="link-go-dashboard">Open dashboard <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </AuthFrame>
    );
  }

  const selPlan = plans.find((p) => p.key === planKey);
  return (
    <AuthFrame aside={aside}>
      <form onSubmit={onSubmit} noValidate className="glass w-full rounded-3xl p-5 sm:p-8">
        <div className="inline-flex w-full rounded-full bg-white/[0.04] p-1 sm:w-auto" role="radiogroup" aria-label="Sign-up mode">
          {(['trial', 'subscribe'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => form.setValue('mode', m)} className={cn('flex-1 rounded-full px-5 py-2 text-sm font-medium transition', mode === m ? 'bg-brand text-on-brand' : 'text-muted-foreground')} data-testid={`toggle-mode-${m}`}>
              {m === 'trial' ? 'Free trial' : 'Subscribe'}
            </button>
          ))}
        </div>

        <fieldset className="mt-6">
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Plan</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {plans.map((p) => {
              const on = p.key === planKey;
              const price = cycle === 'annual' && mode === 'subscribe' ? p.annual : p.monthly;
              return (
                <button key={str(p.key)} type="button" onClick={() => form.setValue('plan_key', str(p.key))} className={cn('relative rounded-2xl border p-4 text-left transition', on ? 'border-[color:var(--ph-indigo)] bg-[color:var(--ph-indigo)]/10' : 'border-white/10 hover:border-white/20')} data-testid={`button-plan-${str(p.key)}`}>
                  {on ? <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand"><Check className="h-3 w-3 text-on-brand" /></span> : null}
                  <div className="font-semibold">{str(p.name)}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{/^\d/.test(str(price)) ? `${formatINR(price)} / emp / mo` : str(price, 'Custom')}</div>
                </button>
              );
            })}
          </div>
          {selPlan ? <p className="mt-2 text-xs text-muted-foreground">{arr(selPlan.modules).length} suites enabled with this plan.</p> : null}
        </fieldset>

        {mode === 'subscribe' ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Billing cycle</span>
            {(['monthly', 'annual'] as const).map((c) => (
              <button key={c} type="button" onClick={() => form.setValue('billing_cycle', c)} className={cn('rounded-full border px-4 py-1.5 text-xs capitalize', cycle === c ? 'border-[color:var(--ph-cyan)] text-[color:var(--ph-cyan)]' : 'border-white/10 text-muted-foreground')} data-testid={`toggle-billing-${c}`}>{c}</button>
            ))}
          </div>
        ) : null}

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Organisation name" error={e.organisation_name?.message}><input className={inputCls} {...form.register('organisation_name')} autoComplete="organization" data-testid="input-organisation-name" /></Field></div>
          <Field label="Industry" error={e.industry?.message}>
            <select className={inputCls} {...form.register('industry')} data-testid="select-industry">
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Company size" error={e.size_band?.message}>
            <select className={inputCls} {...form.register('size_band')} data-testid="select-size-band">
              <option value="">Select size</option>
              {SIZE_BANDS.map((i) => <option key={i} value={i}>{i} employees</option>)}
            </select>
          </Field>
          <Field label="Employee count" error={e.employee_count?.message}><input className={inputCls} type="number" min={1} inputMode="numeric" {...form.register('employee_count')} data-testid="input-employee-count" /></Field>
          <Field label="Phone" error={e.phone?.message}><input className={inputCls} type="tel" placeholder="+91 98xxx xxxxx" {...form.register('phone')} autoComplete="tel" data-testid="input-phone" /></Field>
          <div className="sm:col-span-2"><Field label="GSTIN (optional)" error={e.gst_number?.message}><input className={cn(inputCls, 'uppercase font-mono')} maxLength={15} placeholder="27ABCDE1234F1Z5" {...form.register('gst_number')} data-testid="input-gst" /></Field></div>
          <div className="sm:col-span-2 mt-2 border-t border-white/[0.07] pt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Admin account</div>
          <Field label="Your name" error={e.name?.message}><input className={inputCls} {...form.register('name')} autoComplete="name" data-testid="input-name" /></Field>
          <Field label="Work email" error={e.email?.message}><input className={inputCls} type="email" {...form.register('email')} autoComplete="email" data-testid="input-email" /></Field>
          <Field label="Password" error={e.password?.message} hint="At least 10 characters">
            <div className="relative">
              <input className={inputCls} type={showPw ? 'text' : 'password'} {...form.register('password')} autoComplete="new-password" data-testid="input-password" />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password visibility" data-testid="button-toggle-password">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
          <Field label="Confirm password" error={e.confirm_password?.message}><input className={inputCls} type={showPw ? 'text' : 'password'} {...form.register('confirm_password')} autoComplete="new-password" data-testid="input-confirm-password" /></Field>
        </div>

        <label className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[color:var(--ph-indigo)]" {...form.register('terms')} data-testid="checkbox-terms" />
          <span>I agree to the <Link href="/terms" className="text-foreground underline underline-offset-2">terms</Link> and <Link href="/privacy-policy" className="text-foreground underline underline-offset-2">privacy policy</Link>.</span>
        </label>
        {e.terms ? <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{e.terms.message}</p> : null}

        {mutation.isError ? <p className="mt-5 rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-sm text-red-200" data-testid="text-register-error">{errMsg(mutation.error)}</p> : null}

        <button type="submit" disabled={mutation.isPending} className={cn(btnPrimary, 'mt-6 w-full py-3.5')} data-testid="button-register">
          {mutation.isPending ? 'Creating your workspace...' : mode === 'trial' ? `Start ${str(pricing.trialDays, '14')}-day free trial` : 'Create account and request subscription'}
          <ArrowRight className="h-4 w-4" />
        </button>
        {mode === 'subscribe' ? <p className="mt-3 text-center text-xs text-muted-foreground">Your subscription is created as pending payment. No card is charged here.</p> : null}
        <p className="mt-5 text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="text-foreground underline underline-offset-2" data-testid="link-to-login">Log in</Link></p>
      </form>
    </AuthFrame>
  );
}

function SuccessMark() {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center" aria-hidden>
      <SuccessLottie />
      <span className="pop-ring absolute inset-0 rounded-full border-2 border-[color:var(--ph-cyan)]" />
      <span className="pop-ring absolute inset-0 rounded-full border-2 border-[color:var(--ph-pink)] [animation-delay:.5s]" />
      <span className="grid h-24 w-24 place-items-center rounded-full bg-brand shadow-[0_20px_60px_-10px_var(--ph-indigo)]">
        <svg viewBox="0 0 40 40" className="h-11 w-11"><path className="draw-check" d="M10 21l7 7 14-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Enter your password').max(128) });

export function LoginPage() {
  const nav = useSection('nav');
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const login = useLogin();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const status = errStatus(login.error);
  const notConfigured = login.isError && (status === 503 || /not configured|no admin|setup/i.test(errMsg(login.error)));
  const onSubmit = form.handleSubmit((v) =>
    login.mutate({ data: v }, {
      onSuccess: (acc) => {
        qc.setQueryData(getGetMeQueryKey(), acc);
        void qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation(str((acc.user as AnyObj)?.role) === 'super_admin' ? '/admin' : '/dashboard');
      },
    }),
  );
  return (
    <AuthFrame aside={
      <div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl"><span className="text-gradient">Welcome back</span></h1>
        <p className="mt-4 max-w-sm text-muted-foreground">Sign in to manage your organisation, subscription and modules.</p>
      </div>
    }>
      <div className="w-full max-w-md lg:ml-auto">
        <form onSubmit={onSubmit} noValidate className="glass rounded-3xl p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand"><Lock className="h-5 w-5 text-on-brand" /></span>
          <h2 className="font-display mt-5 text-2xl font-bold">{str(nav.loginLabel, 'Log in')}</h2>
          <div className="mt-6 space-y-4">
            <Field label="Email" error={form.formState.errors.email?.message}><input className={inputCls} type="email" autoComplete="email" {...form.register('email')} data-testid="input-login-email" /></Field>
            <Field label="Password" error={form.formState.errors.password?.message}><input className={inputCls} type="password" autoComplete="current-password" {...form.register('password')} data-testid="input-login-password" /></Field>
          </div>
          {login.isError && !notConfigured ? <p className="mt-4 text-sm text-red-300" data-testid="text-login-error">{status === 401 ? 'Email or password is incorrect.' : errMsg(login.error)}</p> : null}
          <button type="submit" disabled={login.isPending} className={cn(btnPrimary, 'mt-6 w-full')} data-testid="button-login">{login.isPending ? 'Signing in...' : 'Sign in'}</button>
          <p className="mt-5 text-center text-sm text-muted-foreground">New here? <Link href="/register?mode=trial" className="text-foreground underline underline-offset-2" data-testid="link-to-register">Create an organisation</Link></p>
        </form>
        <AdminSetupNote highlight={notConfigured} />
      </div>
    </AuthFrame>
  );
}

export function AdminSetupNote({ highlight }: { highlight?: boolean }) {
  return (
    <details open={highlight} className={cn('mt-4 rounded-2xl border p-4 text-sm', highlight ? 'border-amber-300/30 bg-amber-300/[0.06]' : 'border-white/[0.07] bg-white/[0.02]')} data-testid="panel-admin-setup">
      <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground/90"><KeyRound className="h-4 w-4 text-amber-300" />Super admin not set up yet?</summary>
      <div className="mt-3 space-y-2 text-muted-foreground">
        <p>The super admin account is created from environment secrets. There are no default credentials.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Add secrets <code className="font-mono text-xs text-foreground">SUPER_ADMIN_EMAIL</code> and <code className="font-mono text-xs text-foreground">SUPER_ADMIN_PASSWORD</code> (and <code className="font-mono text-xs text-foreground">JWT_SECRET</code>).</li>
          <li>Run the database seed so the account is created.</li>
          <li>Sign in here with those credentials to reach <code className="font-mono text-xs text-foreground">/admin</code>.</li>
        </ol>
        <p className="flex items-center gap-2 font-mono text-xs"><Terminal className="h-3.5 w-3.5" />Organisation admins sign in with the email used at registration.</p>
        <p className="flex items-center gap-2 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Sessions use a secure cookie; nothing is stored in the browser.</p>
      </div>
    </details>
  );
}
