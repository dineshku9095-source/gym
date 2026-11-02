'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '@gymverse/shared-validation';
import { z } from 'zod';
import { PageHeader, ErrorText } from '@/components/shell';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

type ProfileInput = z.infer<typeof updateProfileSchema>;
type PasswordInput = z.infer<typeof changePasswordSchema>;

export default function MemberProfilePage() {
  const { user, refresh } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Update your details and password."
      />
      <ErrorText message={error} />
      {msg ? <p className="mb-4 text-sm text-emerald-400">{msg}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="gv-card space-y-4 p-5"
          onSubmit={profileForm.handleSubmit(async (values) => {
            setError(null);
            setMsg(null);
            try {
              await api('/users/me', { method: 'PATCH', body: values });
              await refresh();
              setMsg('Profile updated.');
            } catch (e: any) {
              setError(e.message || 'Update failed');
            }
          })}
        >
          <h2 className="gv-display text-3xl text-white">Details</h2>
          <div>
            <label className="gv-label">First name</label>
            <input className="gv-input" {...profileForm.register('firstName')} />
          </div>
          <div>
            <label className="gv-label">Last name</label>
            <input className="gv-input" {...profileForm.register('lastName')} />
          </div>
          <div>
            <label className="gv-label">Phone</label>
            <input className="gv-input" {...profileForm.register('phone')} />
          </div>
          <div>
            <label className="gv-label">Email</label>
            <input className="gv-input" value={user?.email || ''} disabled />
          </div>
          <button type="submit" className="gv-btn-primary">
            Save profile
          </button>
        </form>

        <form
          className="gv-card space-y-4 p-5"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            setError(null);
            setMsg(null);
            try {
              await api('/users/me/password', {
                method: 'POST',
                body: values,
              });
              passwordForm.reset();
              setMsg('Password changed.');
            } catch (e: any) {
              setError(e.message || 'Password change failed');
            }
          })}
        >
          <h2 className="gv-display text-3xl text-white">Password</h2>
          <div>
            <label className="gv-label">Current password</label>
            <input
              type="password"
              className="gv-input"
              {...passwordForm.register('currentPassword')}
            />
          </div>
          <div>
            <label className="gv-label">New password</label>
            <input
              type="password"
              className="gv-input"
              {...passwordForm.register('newPassword')}
            />
            {passwordForm.formState.errors.newPassword ? (
              <p className="mt-1 text-xs text-red-400">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>
          <button type="submit" className="gv-btn-primary">
            Change password
          </button>
        </form>
      </div>
    </div>
  );
}
