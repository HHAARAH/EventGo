import { useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { bookingsApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { formatDateTime, statusLabel } from '../utils';
import type { Booking } from '../types';

export function BookingsPage() {
  const { user } = useAuthStore();
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error } = useApi(
    () => bookingsApi.my({ page_size: '50' }),
    [refreshKey],
    !user,
  );

  if (!user) return <Navigate to="/login" replace />;

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.detail?.detail || err?.message || 'Cancellation failed, please try again');
    } finally {
      setCancelling(null);
    }
  };

  const items = data ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {isLoading && <div className="text-center py-10 text-gray-500">Loading...</div>}
      {error && <div className="text-center py-10 text-red-500">Loading failed: {error}</div>}

      {items.length === 0 && !isLoading && !error && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No bookings yet</p>
          <Link to="/" className="text-indigo-600 hover:underline">Browse Events</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((booking: Booking) => (
            <div key={booking.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    to={`/events/${booking.event.id}`}
                    className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {booking.event.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span>🕐 {formatDateTime(booking.event.start_time)}</span>
                    <span>📍 {booking.event.location || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                    }`}>
                      {statusLabel(booking.status)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Booked on {formatDateTime(booking.booked_at)}
                    </span>
                  </div>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelling === booking.id}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 dark:border-red-900 rounded-lg
                               hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                  >
                    {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
