'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  CalendarCheck,
  CreditCard,
  FileText,
  Trophy,
  Bell,
  Key,
  LogOut,
  Activity,
  UserCog,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { User } from '@/lib/auth';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Панель управления', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/athletes', label: 'Спортсмены', icon: Users, roles: ['admin', 'coach'] },
  { href: '/groups', label: 'Группы', icon: UsersRound, roles: ['admin', 'coach'] },
  { href: '/attendance', label: 'Посещаемость', icon: CalendarCheck, roles: ['admin', 'coach'] },
  { href: '/payments', label: 'Оплаты', icon: CreditCard, roles: ['admin'] },
  { href: '/documents', label: 'Документы', icon: FileText, roles: ['admin', 'coach'] },
  { href: '/competitions', label: 'Соревнования', icon: Trophy, roles: ['admin', 'coach'] },
  { href: '/notifications', label: 'Уведомления', icon: Bell, roles: ['admin', 'coach'] },
  { href: '/users', label: 'Участники', icon: ShieldCheck, roles: ['admin'] },
  { href: '/api-keys', label: 'API / Интеграции', icon: Key, roles: ['admin'] },
  { href: '/admin-profile', label: 'Мой профиль', icon: UserCog, roles: ['admin', 'coach'] },
];

const roleLabel: Record<string, string> = {
  admin: 'Администратор',
  coach: 'Тренер',
  parent: 'Родитель',
};

interface SidebarContentProps {
  user: User;
  onLogout: () => void;
  pathname: string;
  onCloseMobile: () => void;
}

function SidebarContent({ user, onLogout, pathname, onCloseMobile }: SidebarContentProps) {
  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <Activity className="h-7 w-7 text-blue-400 flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-base leading-tight">SportPass CRM</div>
          <div className="text-gray-400 text-xs">Детские спортклубы</div>
        </div>
        <button
          className="md:hidden ml-auto text-gray-400 hover:text-white"
          onClick={onCloseMobile}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="text-sm font-medium text-white truncate">{user.fullName}</div>
        <div className="text-xs text-gray-400">{roleLabel[user.role] ?? user.role}</div>
        <div className="text-xs text-gray-500 truncate">{user.email}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </>
  );
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'md:hidden fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent user={user} onLogout={onLogout} pathname={pathname} onCloseMobile={closeMobile} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 min-h-screen bg-gray-900 text-white">
        <SidebarContent user={user} onLogout={onLogout} pathname={pathname} onCloseMobile={closeMobile} />
      </div>
    </>
  );
}
