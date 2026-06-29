import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { notificationsApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { formatDateTime } from '../utils';
import type { Notification } from '../types';

export function NotificationsPage() {
  const { user } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error } = useApi(
    () => notificationsApi.list({ page_size: '50' }),
    [refreshKey],
    !user,
  );

  if (!user) return <Navigate to="/login" replace />;

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    setRefreshKey((k) => k + 1);
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead();
    setRefreshKey((k) => k + 1);
  };

  const items = data ?? [];
  const unreadCount = items.filter((n: Notification) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notification Center</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Loading...</div>}
      {error && <div className="text-center py-10 text-red-500">Loading failed: {error}</div>}

      {items.length === 0 && !isLoading && !error && (
        <div className="text-center py-16 text-gray-500">No notifications</div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((n: Notification) => (
            <div
              key={n.id}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-4 transition-colors cursor-pointer ${
                n.is_read
                  ? 'border-gray-200 dark:border-gray-800'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20'
              }`}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{n.content}</p>
                  <span className="text-xs text-gray-400 mt-2 inline-block">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
