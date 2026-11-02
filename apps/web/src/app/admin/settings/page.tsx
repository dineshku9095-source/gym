'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, ErrorText, EmptyState } from '@/components/shell';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const form = useForm<{ key: string; value: string }>({
    defaultValues: { key: '', value: '' },
  });

  const load = useCallback(async () => {
    try {
      const data = await api<any[]>('/admin/settings');
      setSettings(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Platform key/value settings (JSON values supported)."
      />
      <ErrorText message={error} />
      {msg ? <p className="mb-4 text-sm text-emerald-400">{msg}</p> : null}

      <form
        className="gv-card mb-6 grid gap-4 p-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          setMsg(null);
          let parsed: unknown = values.value;
          try {
            parsed = JSON.parse(values.value);
          } catch {
            // keep as string
          }
          try {
            await api('/admin/settings', {
              method: 'POST',
              body: { key: values.key, value: parsed },
            });
            form.reset({ key: '', value: '' });
            setMsg('Setting saved.');
            await load();
          } catch (e: any) {
            setError(e.message || 'Save failed');
          }
        })}
      >
        <div>
          <label className="gv-label">Key</label>
          <input
            className="gv-input"
            {...form.register('key', { required: true })}
          />
        </div>
        <div>
          <label className="gv-label">Value (JSON or string)</label>
          <input
            className="gv-input"
            {...form.register('value', { required: true })}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="gv-btn-primary">
            Save setting
          </button>
        </div>
      </form>

      <div className="gv-card overflow-x-auto p-5">
        <table className="gv-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id || s.key}>
                <td className="font-mono text-xs">{s.key}</td>
                <td className="font-mono text-xs text-ink-200">
                  {typeof s.value === 'string'
                    ? s.value
                    : JSON.stringify(s.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!settings.length ? (
          <div className="mt-3">
            <EmptyState message="No settings yet." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
