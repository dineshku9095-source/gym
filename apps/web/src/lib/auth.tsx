'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PlatformRole, StaffRole } from '@gymverse/shared-types';
import { api, getToken, setToken } from './api';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  platformRole: PlatformRole;
  staffAssignments: Array<{
    gymId: string;
    role: StaffRole;
    gymSlug?: string;
    gymName?: string;
    gymStatus?: string;
  }>;
  gymMemberships?: Array<{
    id: string;
    memberId: string;
    gymId: string;
    gym?: { id: string; slug: string; name: string };
  }>;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isStaff: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(raw: any): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    phone: raw.phone,
    avatarUrl: raw.avatarUrl,
    platformRole: raw.platformRole,
    staffAssignments: (raw.staffAssignments || []).map((s: any) => ({
      gymId: s.gymId,
      role: s.role,
      gymSlug: s.gymSlug ?? s.gym?.slug,
      gymName: s.gymName ?? s.gym?.name,
      gymStatus: s.gymStatus ?? s.gym?.status,
    })),
    gymMemberships: raw.gymMemberships,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<any>('/auth/me');
      setUser(normalizeUser(me));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    });
    setToken(res.accessToken);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    return normalized;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      const res = await api<{ accessToken: string; user: any }>(
        '/auth/register',
        {
          method: 'POST',
          body: input,
          token: null,
        },
      );
      setToken(res.accessToken);
      const normalized = normalizeUser(res.user);
      setUser(normalized);
      return normalized;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      isStaff: Boolean(user?.staffAssignments?.length),
      isSuperAdmin: user?.platformRole === 'SUPER_ADMIN',
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function postAuthRedirect(user: AuthUser) {
  if (user.platformRole === 'SUPER_ADMIN') return '/admin';
  if (user.staffAssignments?.length) {
    return `/owner/${user.staffAssignments[0].gymId}`;
  }
  return '/member';
}
