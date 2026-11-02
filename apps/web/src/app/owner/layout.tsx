'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoadingBlock } from '@/components/shell';

export default function OwnerRootLayout({ children }: { children: ReactNode }) {
  const { user, loading, isStaff, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isStaff && !isSuperAdmin) {
      router.replace('/member');
    }
  }, [loading, user, isStaff, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink p-8">
        <LoadingBlock />
      </div>
    );
  }

  return <>{children}</>;
}
