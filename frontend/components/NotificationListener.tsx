'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotifications } from '@/lib/api';
import type { User } from '@/lib/auth';

interface Person {
  id: string;
  fullName?: string;
  role?: string;
}

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  recipientId?: string;
  recipient?: Person | null;
  link?: string | null;
}

function getTone(type?: string) {
  if (type === 'success') return 'success';
  if (type === 'danger' || type === 'payment_debt') return 'danger';
  return 'warning';
}

export function NotificationListener({ user }: { user: User }) {
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: Boolean(user?.id),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!notifications.length) {
      initialized.current = true;
      return;
    }

    const incomingNotifications = notifications.filter((notification) => {
      const recipientId = notification.recipientId ?? notification.recipient?.id;
      return recipientId === user.id;
    });

    if (!initialized.current) {
      incomingNotifications.forEach((notification) => seenNotificationIds.current.add(notification.id));
      initialized.current = true;
      return;
    }

    incomingNotifications.forEach((notification) => {
      if (seenNotificationIds.current.has(notification.id)) return;
      seenNotificationIds.current.add(notification.id);
      if (notification.isRead) return;

      const tone = getTone(notification.type);
      const title = notification.title || 'Новое уведомление';
      const description = notification.message || '';
      const options = {
        description,
        action: notification.link
          ? {
              label: 'Открыть',
              onClick: () => {
                window.location.href = notification.link || '/notifications';
              },
            }
          : undefined,
      };

      if (tone === 'success') toast.success(title, options);
      else if (tone === 'danger') toast.error(title, options);
      else toast.warning(title, options);
    });
  }, [notifications, user.id]);

  return null;
}
