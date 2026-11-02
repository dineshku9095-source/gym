'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Logo } from './logo';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string };

export function AppShell({
  title,
  section,
  nav,
  children,
  homeHref = '/',
}: {
  title?: string;
  section: string;
  nav: NavItem[];
  children: ReactNode;
  homeHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen bg-ink">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-black">
        <div className="border-b border-white/10 px-4 py-5">
          <Logo href={homeHref} />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
            {section}
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== homeHref && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative block rounded-sm px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white',
                  active && 'bg-white/5 text-white',
                )}
              >
                {active && (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-brand" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
          className="flex items-center gap-2 border-t border-white/10 px-4 py-4 text-sm text-white/70 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 sm:px-8">
        {title ? (
          <h1 className="gv-display mb-6 text-5xl text-white">{title}</h1>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="gv-display text-5xl text-white sm:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-ink-200">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function KpiCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="gv-card p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-ink-200">{label}</p>
      <p className="mt-3 font-display text-4xl text-white">{value}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-ink-200">{message}</p>;
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return <p className="text-sm text-ink-200">{label}</p>;
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-sm border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
      {message}
    </p>
  );
}
