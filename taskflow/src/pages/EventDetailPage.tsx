import { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { eventsApi, bookingsApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { formatDateTime, spotsLeft, statusLabel } from '../utils';
import type { Event } from '../types';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: event, isLoading, error } = useApi(
    () => eventsApi.detail(Number(id)),
    [id],
  );

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await eventsApi.book(Number(id));
      setActionSuccess('Booked successfully!');
    } catch (err: any) {
      if (err.status === 409) {
        setActionError('You have already booked this event');
      } else if (err.status === 400) {
        setActionError('This event is currently unavailable for booking');
      } else {
        setActionError('Booking failed, please try again');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Loading failed: {error}</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found</div>;

  const remaining = spotsLeft(event);
  const isOrganizer = user && (user.role === 'organizer' || user.role === 'admin');
  const isOwner = isOrganizer && user.id === event.organizer.id;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        &larr; Back to events
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center">
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">🎉</span>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {event.category.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              event.status === 'published' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
              event.status === 'draft' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : ''
            }`}>
              {statusLabel(event.status)}
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-lg">📍</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Location</div>
                <div>{event.location || 'TBD'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-lg">🕐</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Start time</div>
                <div>{formatDateTime(event.start_time)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-lg">🏁</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">End time</div>
                <div>{formatDateTime(event.end_time)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-lg">👥</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Capacity ({event.current_participants}/{event.max_capacity})
                </div>
                <div className={remaining === 0 ? 'text-red-500' : 'text-green-600'}>
                  {remaining === 0 ? 'Full' : `${remaining} spots left`}
                </div>
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="flex items-center gap-3 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {event.organizer.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-500">Organizer: {event.organizer.name}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Event Details</h2>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {event.status === 'published' && (
          <button
            onClick={handleBook}
            disabled={actionLoading || remaining === 0}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {remaining === 0 ? 'Fully booked' : actionLoading ? 'Processing...' : 'Book Now'}
          </button>
        )}

        {isOwner && (
          <>
            <Link
              to={`/events/${event.id}/edit`}
              className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-700 rounded-xl
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Edit Event
            </Link>
            <Link
              to={`/events/${event.id}/participants`}
              className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-700 rounded-xl
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              View Participants
            </Link>
          </>
        )}
      </div>

      {actionError && (
        <p className="mt-3 text-red-500 text-sm text-center">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="mt-3 text-green-600 text-sm text-center">{actionSuccess}</p>
      )}
    </div>
  );
}
