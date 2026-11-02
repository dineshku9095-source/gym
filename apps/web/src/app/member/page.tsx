'use client';

import { useEffect, useState } from 'react';
import { PageHeader, EmptyState, ErrorText } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { daysLeft, formatDate, formatINR } from '@/lib/utils';

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [c, p, a, n] = await Promise.all([
          api<any[]>('/member/cards'),
          api<any[]>('/member/payments'),
          api<any[]>('/member/attendance'),
          api<any[]>('/notifications'),
        ]);
        if (cancelled) return;
        setCards(c);
        setPayments(p);
        setAttendance(a);
        setNotifications(n);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load member data');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const primary = cards[0];
  const left = daysLeft(primary?.memberships?.[0]?.endDate || primary?.activeMembership?.endDate);

  return (
    <div>
      <PageHeader
        title={`Hey ${user?.firstName || 'athlete'}, train hard.`}
        subtitle="Your membership cards, dues, and check-ins."
      />
      <ErrorText message={error} />

      {primary ? (
        <div className="relative overflow-hidden rounded-md border border-white/10 bg-ink-800 p-6 shadow-glow">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Digital member card
          </p>
          <h2 className="gv-display mt-3 text-4xl text-white sm:text-5xl">
            {primary.gym?.name || 'Gym'}
          </h2>
          <p className="mt-4 font-mono text-3xl tracking-wider text-white">
            {primary.memberId}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-200">
            <StatusBadge
              status={
                primary.memberships?.find((m: any) => m.status === 'ACTIVE')
                  ?.status ||
                primary.memberships?.[0]?.status ||
                'PENDING'
              }
            />
            <span>
              {primary.memberships?.[0]?.plan?.name ||
                primary.activePlan?.name ||
                'Membership'}
            </span>
            <span>
              Expires{' '}
              {formatDate(
                primary.memberships?.[0]?.endDate ||
                  primary.activeMembership?.endDate,
              )}
            </span>
            {left !== null ? <span>{left}d left</span> : null}
          </div>
        </div>
      ) : (
        <div className="gv-card p-6">
          <EmptyState message="No membership cards yet. Explore gyms to request a plan." />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="gv-card p-5">
          <h3 className="gv-display text-2xl text-white">Notifications</h3>
          <div className="mt-4 space-y-3">
            {notifications.length ? (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="border-b border-white/5 pb-3">
                  <p className="text-sm text-white">{n.title || n.subject}</p>
                  <p className="mt-1 text-xs text-ink-200">
                    {n.body || n.message}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No notifications yet." />
            )}
          </div>
        </div>

        <div className="gv-card p-5">
          <h3 className="gv-display text-2xl text-white">Payments</h3>
          <table className="gv-table mt-4">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">
                    {p.receiptNumber || p.id.slice(0, 10)}
                  </td>
                  <td>{formatINR(p.amount)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? (
            <div className="mt-3">
              <EmptyState message="No payments recorded." />
            </div>
          ) : null}
        </div>

        <div className="gv-card p-5">
          <h3 className="gv-display text-2xl text-white">Attendance</h3>
          <table className="gv-table mt-4">
            <thead>
              <tr>
                <th>Gym</th>
                <th>Check-in</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 6).map((a) => (
                <tr key={a.id}>
                  <td>{a.gym?.name || a.gymName || '—'}</td>
                  <td>{formatDate(a.checkedInAt || a.localDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!attendance.length ? (
            <div className="mt-3">
              <EmptyState message="No check-ins yet." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
