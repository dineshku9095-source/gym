import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  href = '/',
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand text-white">
        <Dumbbell className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="font-display text-2xl tracking-wide text-white">
        GYMVERSE
      </span>
    </Link>
  );
}
