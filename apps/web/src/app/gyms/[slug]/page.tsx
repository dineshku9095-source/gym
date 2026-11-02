'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatINR } from '@/lib/utils';
import { ErrorText } from '@/components/shell';

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: number | string;
  currency: string;
};

type Gym = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  address?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  facilities?: Array<{ id: string; name: string }>;
  images?: Array<{ url: string }>;
  plans?: Plan[];
};

export default function GymDetailPage() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [gym, setGym] = useState<Gym | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Gym>(`/gyms/by-slug/${params.slug}`, {
          token: null,
        });
        if (!cancelled) setGym(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Gym not found');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  async function requestPlan(planId: string) {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!gym) return;
    setBusy(planId);
    setMsg(null);
    setError(null);
    try {
      await api(`/gyms/${gym.id}/memberships/request`, {
        method: 'POST',
        body: { planId },
      });
      setMsg('Membership requested. Staff will activate after confirmation.');
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  if (error && !gym) {
    return (
      <div className="min-h-screen bg-ink">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-4 py-20">
          <ErrorText message={error} />
          <Link href="/gyms" className="mt-6 inline-block text-sm text-brand">
            ← Back to gyms
          </Link>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-ink">
        <PublicNav />
        <p className="px-6 py-20 text-sm text-ink-200">Loading gym…</p>
      </div>
    );
  }

  const hero =
    gym.coverUrl ||
    gym.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2000&q=80';

  return (
    <div className="min-h-screen bg-ink">
      <PublicNav />
      <section
        className="relative min-h-[42vh] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.35)), url(${hero})`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
            {gym.city || 'Gym'}
          </p>
          <h1 className="gv-display mt-2 text-6xl text-white sm:text-7xl">
            {gym.name}
          </h1>
          {gym.address ? (
            <p className="mt-3 text-sm text-white/75">{gym.address}</p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="gv-display text-4xl text-white">About</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            {gym.description || 'A focused training environment.'}
          </p>
          {gym.facilities?.length ? (
            <>
              <h3 className="gv-display mt-10 text-3xl text-white">
                Facilities
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {gym.facilities.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-sm border border-white/15 px-3 py-1.5 text-xs uppercase tracking-wide text-white/80"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="gv-card p-5">
          <h2 className="gv-display text-3xl text-white">Plans</h2>
          <p className="mt-1 text-xs text-ink-200">
            Request a membership — activation is manual by gym staff.
          </p>
          <ErrorText message={error} />
          {msg ? (
            <p className="mt-3 text-sm text-emerald-400">{msg}</p>
          ) : null}
          <div className="mt-5 space-y-4">
            {(gym.plans || []).map((plan) => (
              <div
                key={plan.id}
                className="rounded-sm border border-white/10 bg-black/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{plan.name}</h3>
                    <p className="mt-1 text-xs text-ink-200">
                      {plan.durationDays} days
                    </p>
                  </div>
                  <p className="font-display text-2xl text-white">
                    {formatINR(plan.price)}
                  </p>
                </div>
                {plan.description ? (
                  <p className="mt-2 text-sm text-white/70">{plan.description}</p>
                ) : null}
                <button
                  type="button"
                  className="gv-btn-primary mt-4 w-full"
                  disabled={busy === plan.id}
                  onClick={() => requestPlan(plan.id)}
                >
                  {busy === plan.id ? 'Requesting…' : 'Request membership'}
                </button>
              </div>
            ))}
            {!gym.plans?.length ? (
              <p className="text-sm text-ink-200">No active plans yet.</p>
            ) : null}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
