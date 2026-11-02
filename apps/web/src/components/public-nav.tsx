'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './logo';
import { useAuth } from '@/lib/auth';

const links = [
  { href: '/', label: 'Home' },
  { href: '/gyms', label: 'Explore' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#benefits', label: 'Benefits' },
];

export function PublicNav() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <Link
              href={
                user.platformRole === 'SUPER_ADMIN'
                  ? '/admin'
                  : user.staffAssignments?.length
                    ? `/owner/${user.staffAssignments[0].gymId}`
                    : '/member'
              }
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80 hover:text-white"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80 hover:text-white"
            >
              Login
            </Link>
          )}
          <Link href="/register" className="gv-btn-primary !py-2 !text-xs">
            Join Now <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
