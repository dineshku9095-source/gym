'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isSuperAdmin) {
      router.replace('/member');
    }
  }, [loading, user, isSuperAdmin, router]);

  return (
    <AppShell
      section="Super Admin"
      homeHref="/admin"
      nav={[
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/gyms', label: 'Gyms' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/tickets', label: 'Tickets' },
        { href: '/admin/settings', label: 'Settings' },
      ]}
    >
      {children}
    </AppShell>
  );
}
