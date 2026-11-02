'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>('/admin/tickets');
      setTickets(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Tickets" subtitle="Support tickets across the platform." />
      <ErrorText message={error} />
      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Requester</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="font-medium">{t.subject}</div>
                  <div className="line-clamp-1 text-xs text-ink-200">{t.body}</div>
                </td>
                <td>{t.requester?.email || '—'}</td>
                <td>{t.priority}</td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td className="space-x-2 whitespace-nowrap text-xs uppercase">
                  {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                    <button
                      type="button"
                      className="text-emerald-400"
                      onClick={async () => {
                        try {
                          await api(`/admin/tickets/${t.id}`, {
                            method: 'PATCH',
                            body: { status: 'RESOLVED' },
                          });
                          await load();
                        } catch (e: any) {
                          setError(e.message || 'Update failed');
                        }
                      }}
                    >
                      Resolve
                    </button>
                  ) : null}
                  {t.status !== 'CLOSED' ? (
                    <button
                      type="button"
                      className="text-ink-200 hover:text-white"
                      onClick={async () => {
                        try {
                          await api(`/admin/tickets/${t.id}`, {
                            method: 'PATCH',
                            body: { status: 'CLOSED' },
                          });
                          await load();
                        } catch (e: any) {
                          setError(e.message || 'Update failed');
                        }
                      }}
                    >
                      Close
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tickets.length ? (
          <div className="mt-3">
            <EmptyState message="No tickets." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
