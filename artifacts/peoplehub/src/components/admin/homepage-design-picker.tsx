import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Save } from 'lucide-react';
import { useGetContent, useSaveContent, getGetContentQueryKey, getGetContentHistoryQueryKey } from '@workspace/api-client-react';
import { errMsg, type AnyObj } from '@/lib/content';
import { HOMEPAGE_DESIGNS, normalizeHomepageDesign, type HomepageDesign } from '@/lib/homepage-designs';
import { aBtn, aBtnPrimary, aInput } from './json-form';

/** Shared by Appearance and page-wise Content so both save the same setting. */
export function HomepageDesignPicker() {
  const query = useGetContent({ query: { queryKey: getGetContentQueryKey() } });
  const content = query.data as AnyObj | undefined;
  const saved = normalizeHomepageDesign(content?.homepage?.activeVariant);
  const [draft, setDraft] = useState<HomepageDesign>(saved);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const save = useSaveContent();
  const qc = useQueryClient();
  useEffect(() => { setDraft(saved); }, [saved]);
  const persist = () => {
    const latest = (qc.getQueryData(getGetContentQueryKey()) as AnyObj | undefined)?.homepage ?? content?.homepage ?? {};
    const next = { ...latest, activeVariant: draft };
    save.mutate({ key: 'homepage', data: next }, {
      onSuccess: () => {
        qc.setQueryData(getGetContentQueryKey(), (old: AnyObj | undefined) => old ? { ...old, homepage: next } : old);
        void qc.invalidateQueries({ queryKey: getGetContentQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetContentHistoryQueryKey('homepage') });
        setMessage({ text: `${HOMEPAGE_DESIGNS.find((design) => design.id === draft)?.label} is now selected for the website.` });
      },
      onError: (error) => setMessage({ error: true, text: errMsg(error) }),
    });
  };
  return (
    <section className="glass mt-6 rounded-2xl p-5 sm:p-6" data-testid="homepage-design-picker">
      <h2 className="font-display text-lg font-bold">Homepage design</h2>
      <p className="mt-1 text-xs text-muted-foreground">Keep all three designs. Choose one for the public homepage, then save it here. Preview does not change the saved selection.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-[230px] flex-1">
          <span className="mb-1 block text-xs font-medium">Homepage shown on the website</span>
          <select className={aInput} value={draft} disabled={!content || save.isPending} onChange={(event) => { setDraft(normalizeHomepageDesign(event.target.value)); setMessage(null); }} data-testid="select-homepage-version">
            {HOMEPAGE_DESIGNS.map((design) => <option value={design.id} key={design.id}>{design.label}</option>)}
          </select>
        </label>
        <a href={`/?homePreview=${draft}`} target="_blank" rel="noopener noreferrer" className={aBtn} data-testid="link-preview-homepage"><ExternalLink className="h-3.5 w-3.5" />Preview design</a>
        <button type="button" className={aBtnPrimary} disabled={!content || save.isPending || draft === saved} onClick={persist} data-testid="button-save-homepage-version"><Save className="h-3.5 w-3.5" />{save.isPending ? 'Saving…' : 'Save homepage'}</button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{HOMEPAGE_DESIGNS.find((design) => design.id === draft)?.description}</p>
      {message ? <p role={message.error ? 'alert' : 'status'} className={`mt-3 text-sm ${message.error ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-300'}`}>{message.text}</p> : null}
      {query.isError ? <p role="alert" className="mt-3 text-sm text-red-500">{errMsg(query.error)}</p> : null}
    </section>
  );
}
