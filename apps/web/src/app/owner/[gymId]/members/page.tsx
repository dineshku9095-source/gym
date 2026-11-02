'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api, getToken } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MembersPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<any[]>(`/gyms/${gymId}/members`);
        if (!cancelled) setMembers(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load members');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gymId]);

  async function exportCsv() {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
      /\/$/,
      '',
    );
    const token = getToken();
    const res = await fetch(`${base}/api/gyms/${gymId}/members/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${gymId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="Gym members with digital Member IDs."
        actions={
          <button type="button" className="gv-btn-ghost" onClick={exportCsv}>
            Export CSV
          </button>
        }
      />
      <ErrorText message={error} />
      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Member ID</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const active = m.memberships?.find(
                (x: any) => x.status === 'ACTIVE',
              );
              return (
                <tr key={m.id}>
                  <td>
                    {m.user
                      ? `${m.user.firstName} ${m.user.lastName}`
                      : '—'}
                  </td>
                  <td className="font-mono text-xs">{m.memberId}</td>
                  <td>
                    <StatusBadge status={active?.status || 'PENDING'} />
                  </td>
                  <td>{formatDate(m.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!members.length ? (
          <div className="mt-3">
            <EmptyState message="No members yet." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
