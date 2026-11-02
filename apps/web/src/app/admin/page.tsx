'use client';

import { useEffect, useState } from 'react';
import { PageHeader, KpiCard, ErrorText, EmptyState } from '@/components/shell';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [dash, setDash] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, a] = await Promise.all([
          api<any>('/admin/dashboard'),
          api<any[]>('/admin/activity'),
        ]);
        if (cancelled) return;
        setDash(d);
        setActivity(a);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load admin dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        subtitle="Super-admin KPIs across all gyms."
      />
      <ErrorText message={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total gyms" value={dash?.totalGyms ?? '—'} />
        <KpiCard label="Pending approval" value={dash?.pendingGyms ?? '—'} />
        <KpiCard label="Approved" value={dash?.approvedGyms ?? '—'} />
        <KpiCard label="Suspended" value={dash?.suspendedGyms ?? '—'} />
        <KpiCard label="Users" value={dash?.totalUsers ?? '—'} />
        <KpiCard
          label="Active memberships"
          value={dash?.activeMemberships ?? '—'}
        />
        <KpiCard label="Open tickets" value={dash?.openTickets ?? '—'} />
        <KpiCard
          label="Revenue MTD"
          value={dash ? formatINR(dash.revenueMtd ?? dash.revenueMTD ?? 0) : '—'}
        />
      </div>

      <div className="gv-card mt-6 overflow-x-auto p-5">
        <h2 className="gv-display text-3xl text-white">Recent activity</h2>
        <table className="gv-table mt-4">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
              <th>Gym</th>
            </tr>
          </thead>
          <tbody>
            {activity.slice(0, 20).map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.action}</td>
                <td className="text-xs text-ink-200">
                  {row.entityType}
                  {row.entityId ? ` #${String(row.entityId).slice(0, 8)}` : ''}
                </td>
                <td>
                  {row.actor?.email ||
                    (row.actor
                      ? `${row.actor.firstName || ''} ${row.actor.lastName || ''}`.trim()
                      : '—')}
                </td>
                <td>{row.gym?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!activity.length ? (
          <div className="mt-3">
            <EmptyState message="No recent activity." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
