'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  KpiCard,
  ErrorText,
  EmptyState,
} from '@/components/shell';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';

export default function OwnerDashboardPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [kpis, setKpis] = useState<any>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dash, att, pay] = await Promise.all([
          api<any>(`/gyms/${gymId}/dashboard`),
          api<any[]>(`/gyms/${gymId}/attendance`),
          api<any[]>(`/gyms/${gymId}/payments`),
        ]);
        if (cancelled) return;
        setKpis(dash);
        setCheckIns(att.slice(0, 8));
        setPayments(pay.slice(0, 8));
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gymId]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live KPIs from your gym database — not placeholders."
      />
      <ErrorText message={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Active members" value={kpis?.activeMembers ?? '—'} />
        <KpiCard label="Check-ins today" value={kpis?.checkInsToday ?? '—'} />
        <KpiCard
          label="Revenue this month"
          value={kpis ? formatINR(kpis.revenueThisMonth) : '—'}
        />
        <KpiCard label="Expiring in 7 days" value={kpis?.expiringSoon ?? '—'} />
        <KpiCard
          label="Outstanding dues"
          value={kpis ? formatINR(kpis.outstandingDues) : '—'}
        />
        <KpiCard
          label="Pending memberships"
          value={kpis?.pendingMemberships ?? '—'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="gv-card p-5">
          <h2 className="gv-display text-3xl text-white">Recent check-ins</h2>
          <table className="gv-table mt-4">
            <thead>
              <tr>
                <th>Member</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.gymMember?.user
                      ? `${a.gymMember.user.firstName} ${a.gymMember.user.lastName}`
                      : a.memberName || '—'}
                  </td>
                  <td>{formatDate(a.checkedInAt || a.localDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!checkIns.length ? (
            <div className="mt-3">
              <EmptyState message="No check-ins yet." />
            </div>
          ) : null}
        </div>
        <div className="gv-card p-5">
          <h2 className="gv-display text-3xl text-white">Recent payments</h2>
          <table className="gv-table mt-4">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.gymMember?.user
                      ? `${p.gymMember.user.firstName} ${p.gymMember.user.lastName}`
                      : p.memberName || '—'}
                  </td>
                  <td>{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? (
            <div className="mt-3">
              <EmptyState message="No payments yet." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
