import { cn, paymentLabel } from '@/lib/utils';

const styles: Record<string, string> = {
  ACTIVE: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  PAID: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  COMPLETED: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  PARTIAL: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
  PENDING: 'bg-zinc-800 text-zinc-300 border border-zinc-600',
  REQUESTED: 'bg-zinc-800 text-zinc-300 border border-zinc-600',
  EXPIRED: 'bg-red-950/60 text-red-400 border border-red-800/50',
  CANCELLED: 'bg-zinc-900 text-zinc-400 border border-zinc-700',
  SUSPENDED: 'bg-orange-950/50 text-orange-300 border border-orange-800/40',
  APPROVED: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  REJECTED: 'bg-red-950/60 text-red-400 border border-red-800/50',
  OPEN: 'bg-sky-950/50 text-sky-300 border border-sky-800/40',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = paymentLabel(status);
  return (
    <span
      className={cn(
        'gv-badge',
        styles[status] || styles[label] || 'bg-zinc-800 text-zinc-300',
        className,
      )}
    >
      {label}
    </span>
  );
}
