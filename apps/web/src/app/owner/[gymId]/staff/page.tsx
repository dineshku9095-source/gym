'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { api } from '@/lib/api';

type StaffForm = { email: string; role: string };

export default function StaffPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [staff, setStaff] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<StaffForm>({
    defaultValues: { email: '', role: 'RECEPTIONIST' },
  });

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>(`/gyms/${gymId}/staff`);
      setStaff(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load staff');
    }
  }, [gymId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Invite managers, receptionists, and trainers by email."
      />
      <ErrorText message={error} />

      <form
        className="gv-card mb-6 grid gap-4 p-5 sm:grid-cols-3"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            await api(`/gyms/${gymId}/staff`, {
              method: 'POST',
              body: values,
            });
            form.reset({ email: '', role: 'RECEPTIONIST' });
            await load();
          } catch (e: any) {
            setError(e.message || 'Failed to add staff');
          }
        })}
      >
        <div className="sm:col-span-3">
          <h2 className="gv-display text-3xl text-white">Add staff</h2>
        </div>
        <div>
          <label className="gv-label">Email</label>
          <input
            type="email"
            className="gv-input"
            {...form.register('email', { required: true })}
          />
        </div>
        <div>
          <label className="gv-label">Role</label>
          <select className="gv-input" {...form.register('role')}>
            <option value="MANAGER">Manager</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="TRAINER">Trainer</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="gv-btn-primary w-full">
            Add
          </button>
        </div>
      </form>

      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.user
                    ? `${s.user.firstName} ${s.user.lastName}`
                    : '—'}
                </td>
                <td>{s.user?.email || '—'}</td>
                <td>{s.role}</td>
                <td>{s.isActive ? 'Yes' : 'No'}</td>
                <td>
                  {s.isActive && s.role !== 'OWNER' ? (
                    <button
                      type="button"
                      className="text-xs uppercase text-red-400"
                      onClick={async () => {
                        try {
                          await api(
                            `/gyms/${gymId}/staff/${s.id}/deactivate`,
                            { method: 'PATCH', body: {} },
                          );
                          await load();
                        } catch (e: any) {
                          setError(e.message || 'Deactivate failed');
                        }
                      }}
                    >
                      Deactivate
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!staff.length ? (
          <div className="mt-3">
            <EmptyState message="No staff assignments." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
