import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, categoriesApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi, useDebounce } from '../hooks';
import { formatDateTime, spotsLeft, statusLabel } from '../utils';
import type { Event, Category } from '../types';

export function HomePage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);

  const { data: categories } = useApi(() => categoriesApi.list(), []);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { page: String(page), page_size: '12' };
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (selectedCategory) params.category = selectedCategory;
    return params;
  }, [page, debouncedKeyword, selectedCategory]);

  const { data, isLoading, error } = useApi(() => eventsApi.list(queryParams), [JSON.stringify(queryParams)]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="Search events..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="">All Categories</option>
          {categories?.map((c: Category) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading && (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      )}
      {error && (
        <div className="text-center py-20">
          <p className="text-red-500 mb-2">Loading failed</p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Make sure EventGo backend is running and VITE_API_BASE is set correctly</p>
        </div>
      )}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {debouncedKeyword || selectedCategory ? 'No matching events found' : 'No events yet'}
        </div>
      )}

      {/* Event Cards Grid */}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((event: Event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                           rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700
                           transition-all duration-200"
              >
                {/* Cover Image */}
                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center overflow-hidden">
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🎉</span>
                  )}
                </div>

                <div className="p-4">
                  {/* Category Badge */}
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 mb-2">
                    {event.category.name}
                  </span>

                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1 line-clamp-2">
                    {event.title}
                  </h3>

                  <div className="space-y-1 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span>📍</span> {event.location || 'TBD'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🕐</span> {formatDateTime(event.start_time)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>👥</span> {event.current_participants}/{event.max_capacity}
                      {spotsLeft(event) === 0 && (
                        <span className="text-red-500 font-medium text-xs ml-1">Full</span>
                      )}
                    </div>
                  </div>

                  {/* Status & Organizer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.status === 'published' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                      event.status === 'draft' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' :
                      event.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' :
                      'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    }`}>
                      {statusLabel(event.status)}
                    </span>
                    <span className="text-xs text-gray-400">{event.organizer.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg
                           disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg
                           disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
