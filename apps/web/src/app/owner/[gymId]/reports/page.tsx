'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader, ErrorText, EmptyState, KpiCard } from '@/components/shell';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function ReportsPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [revenue, setRevenue] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rev, att] = await Promise.all([
          api<any>(`/gyms/${gymId}/reports/revenue`, {
            method: 'GET',
            query: { days: 30 },
          }),
          api<any>(`/gyms/${gymId}/reports/attendance`, {
            method: 'GET',
            query: { days: 30 },
          }),
        ]);
        if (cancelled) return;
        setRevenue(rev);
        setAttendance(att);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load reports');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gymId]);

  const revTotal =
    revenue?.total ??
    revenue?.sum ??
    (Array.isArray(revenue?.series)
      ? revenue.series.reduce(
          (s: number, r: any) => s + Number(r.amount || r.total || 0),
          0,
        )
      : 0);
  const attTotal =
    attendance?.total ??
    attendance?.count ??
    (Array.isArray(attendance?.series)
      ? attendance.series.reduce(
          (s: number, r: any) => s + Number(r.count || r.total || 0),
          0,
        )
      : Array.isArray(attendance)
        ? attendance.length
        : 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Last 30 days — revenue and attendance."
      />
      <ErrorText message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Revenue (30d)" value={formatINR(revTotal)} />
        <KpiCard label="Check-ins (30d)" value={attTotal} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="gv-card p-5">
          <h2 className="gv-display text-3xl text-white">Revenue series</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(revenue?.series || revenue?.days || []).map(
              (row: any, i: number) => (
                <li
                  key={i}
                  className="flex justify-between border-b border-white/5 pb-2"
                >
                  <span className="text-ink-200">
                    {row.date || row.day || row.label}
                  </span>
                  <span>{formatINR(row.amount || row.total || 0)}</span>
                </li>
              ),
            )}
          </ul>
          {!(revenue?.series || revenue?.days)?.length ? (
            <div className="mt-3">
              <EmptyState message="No revenue data." />
            </div>
          ) : null}
        </div>
        <div className="gv-card p-5">
          <h2 className="gv-display text-3xl text-white">Attendance series</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(attendance?.series || attendance?.days || []).map(
              (row: any, i: number) => (
                <li
                  key={i}
                  className="flex justify-between border-b border-white/5 pb-2"
                >
                  <span className="text-ink-200">
                    {row.date || row.day || row.label}
                  </span>
                  <span>{row.count || row.total || 0}</span>
                </li>
              ),
            )}
          </ul>
          {!(attendance?.series || attendance?.days)?.length ? (
            <div className="mt-3">
              <EmptyState message="No attendance data." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
