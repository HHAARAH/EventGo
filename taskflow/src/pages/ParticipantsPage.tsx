import { useParams, Link, Navigate } from 'react-router-dom';
import { eventsApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { formatDateTime } from '../utils';

export function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: participants, isLoading, error } = useApi(
    () => eventsApi.participants(Number(id)),
    [id],
  );

  if (!user || user.role === 'user') return <Navigate to="/" replace />;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/events/${id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        ← Back to Event
      </Link>
      <h1 className="text-2xl font-bold mb-6">Participants</h1>

      {isLoading && <div className="text-center py-10 text-gray-500">Loading...</div>}
      {error && <div className="text-center py-10 text-red-500">Loading failed: {error}</div>}

      {participants && participants.length === 0 && (
        <div className="text-center py-10 text-gray-500">No participants</div>
      )}

      {participants && participants.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Booking Time</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(p.booked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
