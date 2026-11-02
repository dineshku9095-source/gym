'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';

const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function AdminGymsPage() {
  const [status, setStatus] = useState('ALL');
  const [gyms, setGyms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>('/admin/gyms', {
        method: 'GET',
        query: { status: status === 'ALL' ? undefined : status },
      });
      setGyms(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load gyms');
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setGymStatus(gymId: string, next: string) {
    setError(null);
    try {
      await api(`/admin/gyms/${gymId}/status`, {
        method: 'POST',
        body: { status: next },
      });
      await load();
    } catch (e: any) {
      setError(e.message || 'Status update failed');
    }
  }

  return (
    <div>
      <PageHeader
        title="Gyms"
        subtitle="Approve, reject, suspend, or reactivate gyms."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={
              status === f
                ? 'gv-btn-primary !py-1.5 !text-xs'
                : 'gv-btn-ghost !py-1.5 !text-xs'
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
              <th>Name</th>
              <th>City</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gyms.map((g) => (
              <tr key={g.id}>
                <td>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-ink-200">{g.slug}</div>
                </td>
                <td>{g.city || '—'}</td>
                <td>
                  <StatusBadge status={g.status} />
                </td>
                <td className="space-x-2 whitespace-nowrap text-xs uppercase">
                  {g.status === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        className="text-emerald-400"
                        onClick={() => setGymStatus(g.id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="text-red-400"
                        onClick={() => setGymStatus(g.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {g.status === 'APPROVED' ? (
                    <button
                      type="button"
                      className="text-amber-300"
                      onClick={() => setGymStatus(g.id, 'SUSPENDED')}
                    >
                      Suspend
                    </button>
                  ) : null}
                  {g.status === 'SUSPENDED' || g.status === 'REJECTED' ? (
                    <button
                      type="button"
                      className="text-emerald-400"
                      onClick={() => setGymStatus(g.id, 'APPROVED')}
                    >
                      Reactivate
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!gyms.length ? (
          <div className="mt-3">
            <EmptyState message="No gyms for this filter." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
