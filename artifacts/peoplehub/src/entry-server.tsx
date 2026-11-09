import { renderToString } from 'react-dom/server';
import { PublicApp } from '@/routes';
import type { Bootstrap } from '@/lib/content';
import './index.css';

export function render(initial: Bootstrap, path: string): string {
  return renderToString(<PublicApp data={initial ?? {}} path={path || '/'} />);
}
