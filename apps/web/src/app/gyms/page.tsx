'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { api } from '@/lib/api';

type Gym = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  images?: Array<{ url: string }>;
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<Gym[]>('/gyms', {
          method: 'GET',
          query: { q: q || undefined, city: city || undefined },
          token: null,
        });
        if (!cancelled) setGyms(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load gyms');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, city]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    gyms.forEach((g) => {
      if (g.city) set.add(g.city);
    });
    return Array.from(set).sort();
  }, [gyms]);

  return (
    <div className="min-h-screen bg-ink">
      <PublicNav />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
          Discover
        </p>
        <h1 className="gv-display mt-3 text-6xl text-white sm:text-7xl">
          Find your gym.
        </h1>

        <div className="mt-8 flex flex-col gap-3 rounded-md border border-white/15 bg-ink-800 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              className="gv-input !border-0 !bg-transparent pl-10"
              placeholder="Search gyms…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="gv-input sm:max-w-[180px]"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="mt-8 text-sm text-red-400">{error}</p>
        ) : null}
        {loading ? (
          <p className="mt-8 text-sm text-ink-200">Loading gyms…</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {gyms.map((gym) => {
              const img =
                gym.coverUrl ||
                gym.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
              return (
                <Link
                  key={gym.id}
                  href={`/gyms/${gym.slug}`}
                  className="group overflow-hidden rounded-md border border-white/10 bg-ink-800 transition hover:border-brand/60"
                >
                  <div
                    className="h-48 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${img})` }}
                  />
                  <div className="p-5">
                    <h2 className="gv-display text-3xl text-white">
                      {gym.name}
                    </h2>
                    <p className="mt-1 text-sm text-ink-200">
                      {gym.city || '—'}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-white/70">
                      {gym.description || 'Premium training space.'}
                    </p>
                  </div>
                </Link>
              );
            })}
            {!gyms.length ? (
              <p className="text-sm text-ink-200">No gyms matched your search.</p>
            ) : null}
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
