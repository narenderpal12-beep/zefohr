import { useState } from 'react';
import { str, type AnyObj } from '@/lib/content';
import { cn } from '@/lib/utils';

/** Editorial workplace photo for a suite/service. Hidden when imageUrl is explicitly empty or fails to load. */
export function SolutionImage({ item, className, imgClassName, eager }: { item: AnyObj; className?: string; imgClassName?: string; eager?: boolean }) {
  const src = str(item.imageUrl);
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return null;
  return (
    <div className={cn('solution-frame relative aspect-[4/3] overflow-hidden', className)}>
      <img
        key={src}
        src={src}
        alt={str(item.imageAlt, str(item.title))}
        width={900}
        height={675}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(src)}
        className={cn('h-full w-full object-cover solution-photo transition-transform duration-[900ms] ease-out', imgClassName)}
      />
    </div>
  );
}
