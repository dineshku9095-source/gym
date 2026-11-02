'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@gymverse/shared-validation';
import { Logo } from '@/components/logo';
import { ErrorText } from '@/components/shell';
import { postAuthRedirect, useAuth } from '@/lib/auth';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-ink-900 to-brand-muted/30">
      <div className="px-6 py-6">
        <Logo />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
          Welcome back
        </p>
        <h1 className="gv-display mt-2 text-5xl text-white">Login</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setError(null);
            try {
              const user = await login(values.email, values.password);
              router.push(postAuthRedirect(user));
            } catch (e: any) {
              setError(e.message || 'Login failed');
            }
          })}
        >
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
            <label className="gv-label">Password</label>
            <input
              className="gv-input"
              type="password"
              autoComplete="current-password"
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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink-200">
          New here?{' '}
          <Link href="/register" className="text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
