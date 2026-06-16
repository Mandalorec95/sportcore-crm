'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { NotificationListener } from '@/components/NotificationListener';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function MainLayout({ children, allowedRoles }: MainLayoutProps) {
  const { user, loading, logout } = useRequireAuth(allowedRoles);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto md:pl-0 pt-14 md:pt-0">
        {children}
      </main>
      <NotificationListener user={user} />
    </div>
  );
}
