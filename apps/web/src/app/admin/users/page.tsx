'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>('/admin/users');
      setUsers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Users" subtitle="Platform user directory." />
      <ErrorText message={error} />
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
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>{u.platformRole}</td>
                <td>{u.isActive ? 'Yes' : 'No'}</td>
                <td>
                  {u.platformRole !== 'SUPER_ADMIN' ? (
                    <button
                      type="button"
                      className="text-xs uppercase text-brand"
                      onClick={async () => {
                        try {
                          await api(`/admin/users/${u.id}/active`, {
                            method: 'PATCH',
                            body: { isActive: !u.isActive },
                          });
                          await load();
                        } catch (e: any) {
                          setError(e.message || 'Update failed');
                        }
                      }}
                    >
                      {u.isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? (
          <div className="mt-3">
            <EmptyState message="No users." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
