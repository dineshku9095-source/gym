'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@gymverse/shared-validation';
import { Logo } from '@/components/logo';
import { ErrorText } from '@/components/shell';
import { postAuthRedirect, useAuth } from '@/lib/auth';
import { useState } from 'react';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-ink-900 to-brand-muted/30">
      <div className="px-6 py-6">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
          Join Gymverse
        </p>
        <h1 className="gv-display mt-2 text-5xl text-white">Create account</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setError(null);
            try {
              const user = await registerUser(values);
              router.push(postAuthRedirect(user));
            } catch (e: any) {
              setError(e.message || 'Registration failed');
            }
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="gv-label">First name</label>
              <input className="gv-input" {...register('firstName')} />
              {errors.firstName ? (
                <p className="mt-1 text-xs text-red-400">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="gv-label">Last name</label>
              <input className="gv-input" {...register('lastName')} />
              {errors.lastName ? (
                <p className="mt-1 text-xs text-red-400">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <label className="gv-label">Email</label>
            <input
              className="gv-input"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="gv-label">Phone (optional)</label>
            <input className="gv-input" {...register('phone')} />
          </div>
          <div>
            <label className="gv-label">Password</label>
            <input
              className="gv-input"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-400">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <ErrorText message={error} />
          <button
            type="submit"
            className="gv-btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink-200">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
