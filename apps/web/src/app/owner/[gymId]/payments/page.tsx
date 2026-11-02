'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  recordPaymentSchema,
  type RecordPaymentInput,
} from '@gymverse/shared-validation';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';

const methods = ['ALL', 'CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'] as const;

export default function PaymentsPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [method, setMethod] = useState<(typeof methods)[number]>('ALL');
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      gymMemberId: '',
      amount: 0,
      method: 'CASH',
      status: 'COMPLETED',
      referenceNumber: '',
      notes: '',
    },
  });

  const load = useCallback(async () => {
    try {
      const [pay, mem] = await Promise.all([
        api<any[]>(`/gyms/${gymId}/payments`, {
          method: 'GET',
          query: { method: method === 'ALL' ? undefined : method },
        }),
        api<any[]>(`/gyms/${gymId}/members`),
      ]);
      setPayments(pay);
      setMembers(mem);
    } catch (e: any) {
      setError(e.message || 'Failed to load payments');
    }
  }, [gymId, method]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportCsv() {
    const rows = [
      ['receipt', 'member', 'amount', 'method', 'status', 'date'],
      ...payments.map((p) => [
        p.receiptNumber || p.id,
        p.gymMember?.user
          ? `${p.gymMember.user.firstName} ${p.gymMember.user.lastName}`
          : '',
        String(p.amount),
        p.method,
        p.status,
        p.paidAt || p.createdAt || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${gymId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Manual cash / UPI / bank transfer only. No gateways."
        actions={
          <button type="button" className="gv-btn-ghost" onClick={exportCsv}>
            Export CSV
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {methods.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={
              method === m
                ? 'gv-btn-primary !py-1.5 !text-xs'
                : 'gv-btn-ghost !py-1.5 !text-xs'
            }
          >
            {m}
          </button>
        ))}
      </div>
      <ErrorText message={error} />

      <form
        className="gv-card mb-6 grid gap-4 p-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            await api(`/gyms/${gymId}/payments`, {
              method: 'POST',
              body: {
                ...values,
                amount: Number(values.amount),
                referenceNumber: values.referenceNumber || undefined,
                notes: values.notes || undefined,
              },
            });
            form.reset({
              gymMemberId: '',
              amount: 0,
              method: 'CASH',
              status: 'COMPLETED',
              referenceNumber: '',
              notes: '',
            });
            await load();
          } catch (e: any) {
            setError(e.message || 'Failed to record payment');
          }
        })}
      >
        <h2 className="gv-display text-3xl text-white sm:col-span-2">
          Record payment
        </h2>
        <div>
          <label className="gv-label">Member</label>
          <select className="gv-input" {...form.register('gymMemberId')}>
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user
                  ? `${m.user.firstName} ${m.user.lastName}`
                  : m.memberId}{' '}
                ({m.memberId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="gv-label">Amount</label>
          <input
            type="number"
            step="0.01"
            className="gv-input"
            {...form.register('amount', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="gv-label">Method</label>
          <select className="gv-input" {...form.register('method')}>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="gv-label">Status</label>
          <select className="gv-input" {...form.register('status')}>
            <option value="COMPLETED">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
        <div>
          <label className="gv-label">Reference (optional)</label>
          <input className="gv-input" {...form.register('referenceNumber')} />
        </div>
        <div>
          <label className="gv-label">Notes</label>
          <input className="gv-input" {...form.register('notes')} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="gv-btn-primary">
            Save payment
          </button>
        </div>
      </form>

      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">
                  {p.receiptNumber || p.id.slice(0, 10)}
                </td>
                <td>
                  {p.gymMember?.user
                    ? `${p.gymMember.user.firstName} ${p.gymMember.user.lastName}`
                    : '—'}
                </td>
                <td>{formatINR(p.amount)}</td>
                <td>{p.method}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{formatDate(p.paidAt || p.createdAt)}</td>
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
    </div>
  );
}
