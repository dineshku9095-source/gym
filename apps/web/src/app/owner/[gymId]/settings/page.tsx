'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PageHeader, ErrorText } from '@/components/shell';
import { api } from '@/lib/api';

type GymForm = {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  coverUrl?: string;
  timezone?: string;
};

export default function OwnerSettingsPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const form = useForm<GymForm>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const gym = await api<any>(`/gyms/${gymId}`);
        if (cancelled) return;
        form.reset({
          name: gym.name || '',
          description: gym.description || '',
          address: gym.address || '',
          city: gym.city || '',
          phone: gym.phone || '',
          email: gym.email || '',
          coverUrl: gym.coverUrl || '',
          timezone: gym.timezone || 'Asia/Kolkata',
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load gym');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gymId, form]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Gym profile — cover URL is editable as text (no Cloudinary uploader)."
      />
      <ErrorText message={error} />
      {msg ? <p className="mb-4 text-sm text-emerald-400">{msg}</p> : null}

      <form
        className="gv-card grid max-w-3xl gap-4 p-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          setMsg(null);
          try {
            await api(`/gyms/${gymId}`, {
              method: 'PATCH',
              body: {
                ...values,
                coverUrl: values.coverUrl || undefined,
                email: values.email || undefined,
              },
            });
            setMsg('Gym settings saved.');
          } catch (e: any) {
            setError(e.message || 'Save failed');
          }
        })}
      >
        <div className="sm:col-span-2">
          <label className="gv-label">Name</label>
          <input className="gv-input" {...form.register('name')} />
        </div>
        <div className="sm:col-span-2">
          <label className="gv-label">Description</label>
          <textarea
            className="gv-input min-h-[100px]"
            {...form.register('description')}
          />
        </div>
        <div>
          <label className="gv-label">City</label>
          <input className="gv-input" {...form.register('city')} />
        </div>
        <div>
          <label className="gv-label">Timezone</label>
          <input className="gv-input" {...form.register('timezone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="gv-label">Address</label>
          <input className="gv-input" {...form.register('address')} />
        </div>
        <div>
          <label className="gv-label">Phone</label>
          <input className="gv-input" {...form.register('phone')} />
        </div>
        <div>
          <label className="gv-label">Email</label>
          <input className="gv-input" {...form.register('email')} />
        </div>
        <div className="sm:col-span-2">
          <label className="gv-label">Cover image URL</label>
          <input className="gv-input" {...form.register('coverUrl')} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="gv-btn-primary">
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
