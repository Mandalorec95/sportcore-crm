import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Payment
  paid: { label: 'Оплачено', className: 'bg-green-100 text-green-800 border-green-200' },
  debt: { label: 'Долг', className: 'bg-red-100 text-red-800 border-red-200' },
  partial: { label: 'Частично', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  pending: { label: 'Ожидание', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  // Medical
  valid: { label: 'Действует', className: 'bg-green-100 text-green-800 border-green-200' },
  expires_soon: { label: 'Истекает', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  expired: { label: 'Истекло', className: 'bg-red-100 text-red-800 border-red-200' },
  not_requested: { label: 'Не запрошено', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  approved: { label: 'Подтверждено', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Отклонено', className: 'bg-red-100 text-red-800 border-red-200' },
  // Attendance
  present: { label: 'Присутствовал', className: 'bg-green-100 text-green-800 border-green-200' },
  absent: { label: 'Отсутствовал', className: 'bg-red-100 text-red-800 border-red-200' },
  sick: { label: 'Болел', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  // Athlete
  active: { label: 'Активный', className: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Неактивный', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  // Churn risk
  low: { label: 'Низкий риск', className: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'Средний риск', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'Высокий риск', className: 'bg-red-100 text-red-800 border-red-200' },
  // Competition readiness
  ready: { label: 'Готов', className: 'bg-green-100 text-green-800 border-green-200' },
  not_ready: { label: 'Не готов', className: 'bg-red-100 text-red-800 border-red-200' },
  // Medal
  gold: { label: '🥇 Золото', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  silver: { label: '🥈 Серебро', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  bronze: { label: '🥉 Бронза', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
