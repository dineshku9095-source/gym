'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPlanSchema,
  type CreatePlanInput,
} from '@gymverse/shared-validation';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function PlansPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: '',
      durationDays: 30,
      price: 2499,
      currency: 'INR',
      isActive: true,
    },
  });

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>(`/gyms/${gymId}/plans`);
      setPlans(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load plans');
    }
  }, [gymId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Plans"
        subtitle="Membership plan catalog for this gym."
      />
      <ErrorText message={error} />

      <form
        className="gv-card mb-6 grid gap-4 p-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            await api(`/gyms/${gymId}/plans`, {
              method: 'POST',
              body: {
                ...values,
                durationDays: Number(values.durationDays),
                price: Number(values.price),
              },
            });
            form.reset({
              name: '',
              durationDays: 30,
              price: 2499,
              currency: 'INR',
              isActive: true,
            });
            await load();
          } catch (e: any) {
            setError(e.message || 'Failed to create plan');
          }
        })}
      >
        <h2 className="gv-display text-3xl text-white sm:col-span-2">
          Create plan
        </h2>
        <div>
          <label className="gv-label">Name</label>
          <input className="gv-input" {...form.register('name')} />
        </div>
        <div>
          <label className="gv-label">Duration (days)</label>
          <input
            type="number"
            className="gv-input"
            {...form.register('durationDays', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="gv-label">Price</label>
          <input
            type="number"
            className="gv-input"
            {...form.register('price', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="gv-label">Description</label>
          <input className="gv-input" {...form.register('description')} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="gv-btn-primary">
            Save plan
          </button>
        </div>
      </form>

      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.durationDays}d</td>
                <td>{formatINR(p.price)}</td>
                <td>{p.isActive ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!plans.length ? (
          <div className="mt-3">
            <EmptyState message="No plans yet." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
