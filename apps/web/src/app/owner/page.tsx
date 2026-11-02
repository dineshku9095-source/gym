'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, LoadingBlock } from '@/components/shell';
import { useAuth } from '@/lib/auth';

export default function OwnerIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.staffAssignments?.length === 1) {
      router.replace(`/owner/${user.staffAssignments[0].gymId}`);
    }
  }, [user, loading, router]);

  if (loading) return <LoadingBlock />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader
        title="Your gyms"
        subtitle="Select a gym to open the owner/staff console."
      />
      <div className="space-y-3">
        {(user?.staffAssignments || []).map((s) => (
          <Link
            key={s.gymId}
            href={`/owner/${s.gymId}`}
            className="gv-card block p-5 transition hover:border-brand/50"
          >
            <p className="gv-display text-3xl text-white">
              {s.gymName || s.gymId}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-200">
              {s.role}
              {s.gymStatus ? ` · ${s.gymStatus}` : ''}
            </p>
          </Link>
        ))}
        {!user?.staffAssignments?.length ? (
          <p className="text-sm text-ink-200">
            You are not assigned to any gym staff role.{' '}
            <Link href="/member" className="text-brand">
              Go to member portal
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
