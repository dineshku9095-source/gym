'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { memberIdSchema } from '@gymverse/shared-validation';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const verifySchema = z.object({ memberId: memberIdSchema });

export default function AttendancePage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [log, setLog] = useState<any[]>([]);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);

  const form = useForm<{ memberId: string }>({
    resolver: zodResolver(verifySchema),
    defaultValues: { memberId: '' },
  });

  const loadLog = useCallback(async () => {
    try {
      const data = await api<any[]>(`/gyms/${gymId}/attendance`);
      setLog(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load attendance');
    }
  }, [gymId]);

  useEffect(() => {
    void loadLog();
  }, [loadLog]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Manual Member ID entry only — no QR or biometrics."
      />
      <ErrorText message={error} />

      <form
        className="gv-card flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
        onSubmit={form.handleSubmit(async ({ memberId }) => {
          setError(null);
          setWarning(null);
          setVerifyResult(null);
          setOverride(false);
          try {
            const data = await api<any>(`/gyms/${gymId}/attendance/verify`, {
              method: 'GET',
              query: { memberId },
            });
            setVerifyResult(data);
            if (data.alreadyCheckedInToday || data.alreadyCheckedIn) {
              setWarning('Already checked in today.');
            }
          } catch (e: any) {
            setError(e.message || 'Verify failed');
          }
        })}
      >
        <div className="flex-1">
          <label className="gv-label">Member ID</label>
          <input
            className="gv-input uppercase"
            placeholder="GYM-7K92P4"
            {...form.register('memberId')}
          />
          {form.formState.errors.memberId ? (
            <p className="mt-1 text-xs text-red-400">
              {form.formState.errors.memberId.message}
            </p>
          ) : null}
        </div>
        <button type="submit" className="gv-btn-primary">
          Verify
        </button>
      </form>

      {verifyResult ? (
        <div className="gv-card mt-4 space-y-4 p-5">
          <div>
            <h2 className="gv-display text-4xl text-white">
              {verifyResult.gymMember?.user
                ? `${verifyResult.gymMember.user.firstName} ${verifyResult.gymMember.user.lastName}`
                : verifyResult.name || 'Member'}
            </h2>
            <p className="mt-1 font-mono text-sm text-ink-200">
              {verifyResult.gymMember?.memberId ||
                verifyResult.memberId ||
                form.getValues('memberId')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={
                verifyResult.membership?.status ||
                verifyResult.status ||
                'PENDING'
              }
            />
            {verifyResult.membership?.plan?.name || verifyResult.planName ? (
              <span className="gv-badge bg-zinc-800 text-white">
                {verifyResult.membership?.plan?.name || verifyResult.planName}
              </span>
            ) : null}
            {verifyResult.alreadyCheckedInToday ||
            verifyResult.alreadyCheckedIn ? (
              <span className="gv-badge border border-amber-600/50 text-amber-300">
                Already checked in (
                {formatDate(
                  verifyResult.todayCheckIn?.localDate || new Date(),
                )}
                )
              </span>
            ) : null}
          </div>
          {warning ? <p className="text-sm text-amber-300">{warning}</p> : null}
          {(verifyResult.alreadyCheckedInToday ||
            verifyResult.alreadyCheckedIn) && (
            <label className="flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
              />
              Owner/manager override
            </label>
          )}
          <button
            type="button"
            className="gv-btn-primary w-full"
            disabled={
              busy ||
              ((verifyResult.alreadyCheckedInToday ||
                verifyResult.alreadyCheckedIn) &&
                !override)
            }
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await api(`/gyms/${gymId}/attendance/check-in`, {
                  method: 'POST',
                  body: {
                    memberId:
                      verifyResult.gymMember?.memberId ||
                      verifyResult.memberId ||
                      form.getValues('memberId'),
                    overrideReason: override
                      ? 'Owner/manager override from desk'
                      : undefined,
                  },
                });
                setVerifyResult(null);
                setWarning(null);
                form.reset({ memberId: '' });
                await loadLog();
              } catch (e: any) {
                setError(e.message || 'Check-in failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirm check-in
          </button>
        </div>
      ) : null}

      <div className="gv-card mt-6 overflow-x-auto p-5">
        <h2 className="gv-display text-3xl text-white">Today&apos;s log</h2>
        <table className="gv-table mt-4">
          <thead>
            <tr>
              <th>Member</th>
              <th>ID</th>
              <th>Time</th>
              <th>Override</th>
            </tr>
          </thead>
          <tbody>
            {log.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.gymMember?.user
                    ? `${a.gymMember.user.firstName} ${a.gymMember.user.lastName}`
                    : '—'}
                </td>
                <td className="font-mono text-xs">
                  {a.gymMember?.memberId || '—'}
                </td>
                <td>{formatDate(a.checkedInAt || a.localDate)}</td>
                <td>{a.overrideReason ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!log.length ? (
          <div className="mt-3">
            <EmptyState message="No check-ins logged." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
