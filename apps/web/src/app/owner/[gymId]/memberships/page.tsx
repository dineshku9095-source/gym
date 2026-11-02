'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';

const filters = ['ALL', 'REQUESTED', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'];

export default function MembershipsPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [status, setStatus] = useState('ALL');
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<any[]>(`/gyms/${gymId}/memberships`, {
        method: 'GET',
        query: { status: status === 'ALL' ? undefined : status },
      });
      setRows(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load memberships');
    }
  }, [gymId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: 'activate' | 'cancel' | 'renew') {
    setBusy(`${action}:${id}`);
    setError(null);
    try {
      await api(`/gyms/${gymId}/memberships/${id}/${action}`, {
        method: 'POST',
        body: action === 'cancel' ? { note: 'Cancelled by staff' } : {},
      });
      await load();
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Memberships"
        subtitle="Lifecycle management — history is preserved."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={
              status === f ? 'gv-btn-primary !py-1.5 !text-xs' : 'gv-btn-ghost !py-1.5 !text-xs'
            }
          >
            {f}
          </button>
        ))}
      </div>
      <ErrorText message={error} />
      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Dates</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.gymMember?.user
                    ? `${m.gymMember.user.firstName} ${m.gymMember.user.lastName}`
                    : m.gymMember?.memberId || '—'}
                </td>
                <td>{m.plan?.name || '—'}</td>
                <td>
                  <StatusBadge status={m.status} />
                </td>
                <td className="text-xs text-ink-200">
                  {formatDate(m.startDate)} → {formatDate(m.endDate)}
                </td>
                <td>
                  {formatINR(Number(m.amountDue) - Number(m.amountPaid))}
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  {m.status === 'REQUESTED' ? (
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase text-brand"
                      disabled={busy === `activate:${m.id}`}
                      onClick={() => act(m.id, 'activate')}
                    >
                      Activate
                    </button>
                  ) : null}
                  {m.status === 'ACTIVE' || m.status === 'EXPIRED' ? (
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase text-white/70 hover:text-white"
                      disabled={busy === `renew:${m.id}`}
                      onClick={() => act(m.id, 'renew')}
                    >
                      Renew
                    </button>
                  ) : null}
                  {m.status !== 'CANCELLED' ? (
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase text-red-400"
                      disabled={busy === `cancel:${m.id}`}
                      onClick={() => act(m.id, 'cancel')}
                    >
                      Cancel
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <div className="mt-3">
            <EmptyState message="No memberships for this filter." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
