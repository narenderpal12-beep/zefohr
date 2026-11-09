import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Lock, LogOut, Rocket, Sparkles } from 'lucide-react';
import { useChangeSubscription, useLogout, getGetMeQueryKey } from '@workspace/api-client-react';
import { arr, errMsg, formatINR, str, useSection, type AnyObj } from '@/lib/content';
import { Aurora, SkeletonBlock, btnGhost, btnPrimary } from '@/components/site/primitives';
import { BrandMark, useMe } from '@/components/site/layout';
import { RoadmapList } from './public';
import { cn } from '@/lib/utils';

export function useSignOut() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  return {
    pending: logout.isPending,
    run: () => logout.mutate(undefined, {
      onSettled: () => {
        qc.setQueryData(getGetMeQueryKey(), undefined);
        qc.removeQueries({ predicate: (q) => String(q.queryKey[0]).includes('/admin') || String(q.queryKey[0]).includes('/seo') || String(q.queryKey[0]).includes('/auth/me') });
        setLocation('/login');
      },
    }),
  };
}

export const statusTone: Record<string, string> = {
  trial: 'bg-cyan-400/10 text-cyan-200 border-cyan-300/30',
  active: 'bg-emerald-400/10 text-emerald-200 border-emerald-300/30',
  pending_payment: 'bg-amber-400/10 text-amber-200 border-amber-300/30',
  past_due: 'bg-orange-400/10 text-orange-200 border-orange-300/30',
  cancelled: 'bg-white/5 text-muted-foreground border-white/10',
  expired: 'bg-red-400/10 text-red-200 border-red-300/30',
};
export function StatusPill({ s }: { s: string }) {
  return <span className={cn('rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider', statusTone[s] ?? statusTone.cancelled)} data-testid="status-subscription">{s.replace(/_/g, ' ') || 'unknown'}</span>;
}

export function SignedOutPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5">
      <Aurora />
      <div className="glass relative max-w-md rounded-3xl p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-[color:var(--ph-cyan)]" />
        <h1 className="font-display mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/login" className={btnPrimary} data-testid="link-signin">Log in</Link>
          <Link href="/" className={btnGhost}>Home</Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const me = useMe();
  const dash = useSection('dashboard');
  const roadmap = useSection('roadmap');
  const pricing = useSection('pricing');
  const signOut = useSignOut();
  const qc = useQueryClient();
  const change = useChangeSubscription();
  const [plan, setPlan] = useState<string>('');
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [done, setDone] = useState<string | null>(null);

  if (me.isLoading) return <div className="mx-auto max-w-6xl space-y-4 px-5 py-24"><SkeletonBlock className="h-10 w-1/3" /><div className="grid gap-4 md:grid-cols-3"><SkeletonBlock className="h-44" /><SkeletonBlock className="h-44" /><SkeletonBlock className="h-44" /></div><SkeletonBlock className="h-72" /></div>;
  if (me.isError || !me.data) return <SignedOutPanel title="Sign in to your dashboard" text="Your session has ended or you have not signed in yet." />;

  const user = me.data.user as AnyObj;
  const org = (me.data.organisation ?? {}) as AnyObj;
  const sub = (me.data.subscription ?? {}) as AnyObj;
  const modules = arr<AnyObj>(me.data.modules).slice().sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const enabled = modules.filter((m) => m.enabled);
  const plans = arr<AnyObj>(pricing.plans);
  const curPlan = plans.find((p) => p.key === sub.plan_key);
  const trialEnd = sub.trial_ends_at ? new Date(String(sub.trial_ends_at)) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;
  const trialDays = Number(pricing.trialDays ?? 14);
  const selPlan = plan || str(sub.plan_key);

  const submit = () => {
    setDone(null);
    change.mutate({ data: { plan_key: selPlan, billing_cycle: cycle } }, {
      onSuccess: (r) => { setDone(str((r as AnyObj)?.message, 'Subscription request recorded. Our team will confirm activation; no payment has been taken.')); void qc.invalidateQueries({ queryKey: getGetMeQueryKey() }); },
    });
  };

  return (
    <div className="relative min-h-[100dvh]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"><Aurora /></div>
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" data-testid="link-dash-home"><BrandMark /></Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-sm sm:block"><span className="block text-foreground">{str(user.name)}</span><span className="block font-mono text-[11px] text-muted-foreground">{str(user.email)}</span></span>
          <button type="button" onClick={signOut.run} disabled={signOut.pending} className={cn(btnGhost, 'px-4 py-2')} data-testid="button-logout"><LogOut className="h-4 w-4" />Log out</button>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--ph-cyan)]">{str(dash.title, 'Dashboard')}</p>
        <h1 className="font-display mt-2 text-4xl font-bold sm:text-5xl" data-testid="text-org-name"><span className="text-gradient">{str(org.name, 'Your organisation')}</span></h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{str(dash.description)}</p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <section className="glass border-gradient rounded-3xl p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Subscription</h2>
              <StatusPill s={str(sub.status)} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Plan</div><div className="font-display mt-1 text-2xl font-bold" data-testid="text-plan">{str(curPlan?.name, str(sub.plan_key))}</div></div>
              <div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Billing</div><div className="mt-1 text-lg capitalize">{str(sub.billing_cycle, 'monthly')}</div></div>
              <div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Employees</div><div className="mt-1 text-lg">{str(sub.employee_count, '-')}</div></div>
            </div>
            {sub.status === 'trial' && daysLeft !== null ? (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[color:var(--ph-cyan)]" /><span data-testid="text-days-left">{daysLeft} days left in trial</span></span><span className="font-mono text-xs text-muted-foreground">ends {trialEnd?.toLocaleDateString('en-IN')}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[color:var(--ph-cyan)] to-[color:var(--ph-pink)]" style={{ width: `${Math.min(100, (1 - daysLeft / trialDays) * 100)}%` }} /></div>
              </div>
            ) : null}
            {sub.status === 'pending_payment' ? <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-sm text-amber-100/80">Payment pending. Online payments are not enabled yet; an administrator will activate your subscription after confirming payment.</p> : null}
          </section>
          <section className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-bold">Organisation</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[['Industry', org.industry], ['Size', org.size_band], ['Phone', org.phone], ['GSTIN', org.gst_number], ['Workspace', org.slug]].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4 border-b border-white/[0.05] pb-2"><dt className="text-muted-foreground">{String(k)}</dt><dd className="truncate text-right font-mono text-xs">{str(v, '-')}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        <section className="glass mt-4 rounded-3xl p-6">
          <div className="flex items-center gap-2"><Rocket className="h-5 w-5 text-[color:var(--ph-pink)]" /><h2 className="font-display text-xl font-bold">{sub.status === 'active' ? 'Change plan' : 'Upgrade or subscribe'}</h2></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {plans.map((p) => (
              <button key={str(p.key)} type="button" onClick={() => setPlan(str(p.key))} className={cn('rounded-2xl border p-4 text-left transition', selPlan === p.key ? 'border-[color:var(--ph-indigo)] bg-[color:var(--ph-indigo)]/10' : 'border-white/10 hover:border-white/20')} data-testid={`button-dash-plan-${str(p.key)}`}>
                <div className="font-semibold">{str(p.name)}</div>
                <div className="font-mono text-xs text-muted-foreground">{p.monthly == null ? 'Custom' : `${formatINR(cycle === 'annual' ? p.annual : p.monthly)} / emp / mo`}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {(['monthly', 'annual'] as const).map((c) => <button key={c} type="button" onClick={() => setCycle(c)} className={cn('rounded-full border px-4 py-1.5 text-xs capitalize', cycle === c ? 'border-[color:var(--ph-cyan)] text-[color:var(--ph-cyan)]' : 'border-white/10 text-muted-foreground')} data-testid={`toggle-dash-cycle-${c}`}>{c}</button>)}
            <button type="button" onClick={submit} disabled={change.isPending} className={cn(btnPrimary, 'ml-auto')} data-testid="button-subscribe">{change.isPending ? 'Submitting...' : 'Request subscription'}</button>
          </div>
          {done ? <p className="mt-4 text-sm text-emerald-200" data-testid="status-subscribe">{done}</p> : null}
          {change.isError ? <p className="mt-4 text-sm text-red-300">{errMsg(change.error)}</p> : null}
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-bold">Modules</h2><span className="font-mono text-xs text-muted-foreground">{enabled.length} of {modules.length} enabled</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {modules.map((m) => (
              <div key={str(m.key)} className={cn('rounded-2xl border p-4', m.enabled ? 'glass' : 'border-dashed border-white/10 opacity-60')} data-testid={`card-module-${str(m.key)}`}>
                <div className="flex items-center justify-between">{m.enabled ? <Check className="h-4 w-4 text-emerald-300" /> : <Lock className="h-4 w-4 text-muted-foreground" />}<span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{str(m.priority)}</span></div>
                <div className="mt-3 text-sm font-semibold leading-snug">{str(m.name)}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{str(m.description)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass border-gradient relative mt-12 overflow-hidden rounded-3xl p-6 sm:p-10">
          <Sparkles className="h-6 w-6 text-[color:var(--ph-pink)]" />
          <h2 className="font-display mt-3 text-2xl font-bold">{str(dash.comingSoon, 'HRMS app coming soon')}</h2>
          {arr(roadmap.items).length ? <><h3 className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">{str(roadmap.title)}</h3><RoadmapList items={arr<AnyObj>(roadmap.items)} /></> : null}
        </section>
      </main>
    </div>
  );
}
