'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell';

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      section="Member"
      homeHref="/member"
      nav={[
        { href: '/member', label: 'Overview' },
        { href: '/member/profile', label: 'Profile' },
        { href: '/gyms', label: 'Find gyms' },
      ]}
    >
      {children}
    </AppShell>
  );
}
