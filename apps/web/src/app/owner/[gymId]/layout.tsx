'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/shell';

export default function OwnerGymLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ gymId: string }>();
  const base = `/owner/${params.gymId}`;

  return (
    <AppShell
      section="Owner / Staff"
      homeHref="/owner"
      nav={[
        { href: '/owner', label: 'Gyms' },
        { href: base, label: 'Dashboard' },
        { href: `${base}/members`, label: 'Members' },
        { href: `${base}/memberships`, label: 'Memberships' },
        { href: `${base}/plans`, label: 'Plans' },
        { href: `${base}/attendance`, label: 'Attendance' },
        { href: `${base}/payments`, label: 'Payments' },
        { href: `${base}/staff`, label: 'Staff' },
        { href: `${base}/reports`, label: 'Reports' },
        { href: `${base}/settings`, label: 'Settings' },
      ]}
    >
      {children}
    </AppShell>
  );
}
