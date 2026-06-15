'use client';

import Link from 'next/link';
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/athletes', label: 'Спортсмены', icon: Users, roles: ['admin', 'coach'] },
  { href: '/groups', label: 'Группы', icon: UsersRound, roles: ['admin', 'coach'] },
  { href: '/attendance', label: 'Посещаемость', icon: CalendarCheck, roles: ['admin', 'coach'] },
  { href: '/payments', label: 'Оплаты', icon: CreditCard, roles: ['admin'] },
  { href: '/documents', label: 'Документы', icon: FileText, roles: ['admin', 'coach'] },
  { href: '/competitions', label: 'Соревнования', icon: Trophy, roles: ['admin', 'coach'] },
  { href: '/notifications', label: 'Уведомления', icon: Bell, roles: ['admin', 'coach'] },
  { href: '/api-keys', label: 'API / Интеграции', icon: Key, roles: ['admin'] },
];

const roleLabel: Record<string, string> = {
  admin: 'Администратор',
  coach: 'Тренер',
  parent: 'Родитель',
};

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <Activity className="h-7 w-7 text-blue-400" />
        <div>
          <div className="font-bold text-base leading-tight">SportPass CRM</div>
          <div className="text-gray-400 text-xs">Детские спортклубы</div>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="text-sm font-medium text-white truncate">{user.fullName}</div>
        <div className="text-xs text-gray-400">{roleLabel[user.role] || user.role}</div>
        <div className="text-xs text-gray-500 truncate">{user.email}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
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
    </div>
  );
}
