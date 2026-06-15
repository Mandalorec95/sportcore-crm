'use client';

import { useEffect } from 'react';
import { getUser, getToken } from '@/lib/auth';

export default function Home() {
  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      window.location.href = '/login';
    } else if (user.role === 'parent') {
      window.location.href = '/parent';
    } else {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}
