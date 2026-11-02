import Link from 'next/link';
import {
  ArrowUpRight,
  ClipboardList,
  Crown,
  Dumbbell,
  Play,
  Zap,
} from 'lucide-react';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';

const features = [
  { icon: Dumbbell, label: 'Active gyms across cities' },
  { icon: ClipboardList, label: 'Manual Member ID check-in' },
  { icon: Crown, label: 'Owner & staff dashboards' },
  { icon: Zap, label: 'Expiry reminders that actually fire' },
];

const steps = [
  {
    n: '01',
    title: 'Discover',
    body: 'Browse approved gyms by city and find the right floor.',
  },
  {
    n: '02',
    title: 'Join',
    body: 'Request a plan and receive a unique digital Member ID.',
  },
  {
    n: '03',
    title: 'Train',
    body: 'Staff check you in by Member ID — no QR, no biometrics.',
  },
];

const benefits = [
  'Tenant-isolated multi-gym data',
  'Manual cash / UPI / bank ledger',
  'Membership lifecycle with audit trail',
  'Owner KPIs from live database rows',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink">
      <PublicNav />
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-hero-gym bg-cover bg-center">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
          <div className="anim-fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
              Multi-gym platform
            </p>
            <h1 className="gv-display mt-4 max-w-xl text-6xl text-white sm:text-7xl lg:text-8xl">
              Your fitness journey starts here.
            </h1>
            <div className="anim-underline mt-3 h-1.5 w-40 bg-brand" />
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
              Discover gyms. Join with a digital Member ID. Owners run
              memberships, attendance, and cash/UPI payments — without payment
              gateways.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/gyms" className="gv-btn-primary">
                Explore Gyms <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="gv-btn-ghost">
                Join Now <Play className="h-4 w-4 fill-current" />
              </Link>
            </div>
          </div>
          <div className="anim-fade-up-delay space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-md border border-white/10 bg-black/55 px-4 py-4 backdrop-blur-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
            How it works
          </p>
          <h2 className="gv-display mt-3 text-5xl text-white">
            Three steps. Zero gateways.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="border-t-2 border-brand pt-6">
                <p className="font-display text-4xl text-white/30">{s.n}</p>
                <h3 className="gv-display mt-2 text-3xl text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-200">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
              Benefits
            </p>
            <h2 className="gv-display mt-3 text-5xl text-white">
              Built for real gym floors.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-200">
              Gymverse keeps owners, staff, and members on one dark, focused
              stack — with tenant isolation and manual payment workflows.
            </p>
          </div>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 border-b border-white/10 pb-4 text-sm font-medium uppercase tracking-wide text-white"
              >
                <span className="h-2 w-2 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-gradient-to-r from-black via-ink-800 to-brand-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="gv-display text-5xl text-white">
              Ready to run your gym?
            </h2>
            <p className="mt-3 text-sm text-white/75">
              Create an account, claim a gym, or join as a member today.
            </p>
          </div>
          <Link href="/register" className="gv-btn-primary">
            Get started <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
