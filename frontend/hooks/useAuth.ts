'use client';

import { useState, useEffect } from 'react';
import { User, getUser, clearAuth } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return { user, loading, logout };
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        const defaultPage = user.role === 'parent' ? '/parent' : user.role === 'coach' ? '/athletes' : '/dashboard';
        window.location.href = defaultPage;
      }
    }
  }, [user, loading, allowedRoles]);

  return { user, loading, logout };
}
