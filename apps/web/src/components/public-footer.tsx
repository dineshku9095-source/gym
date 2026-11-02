import Link from 'next/link';
import { Logo } from './logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-200">
            Multi-gym management for owners, staff, and members. Discover gyms,
            track memberships, attendance, and manual payments — no gateway
            required.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Platform
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/gyms" className="hover:text-white">
                Explore gyms
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Staff login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Support
          </h3>
          <p className="mt-4 text-sm text-white/80">support@gymverse.app</p>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-right text-xs text-ink-300 sm:px-6">
        Manual payments only · Member ID check-in · Tenant-isolated
      </div>
    </footer>
  );
}
