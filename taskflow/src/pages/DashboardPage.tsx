import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { eventsApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { formatDate, spotsLeft, statusLabel } from '../utils';
import type { Event } from '../types';

const COLUMNS: { id: string; label: string; statuses: string[] }[] = [
  { id: 'draft', label: 'Draft', statuses: ['draft'] },
  { id: 'published', label: 'Published', statuses: ['published'] },
  { id: 'in-progress', label: 'In Progress', statuses: ['published'] },
  { id: 'completed', label: 'Completed', statuses: ['completed'] },
];

function KanbanCard({ event, isDragging }: { event: Event; isDragging?: boolean }) {
  const remaining = spotsLeft(event);

  return (
    <Link
      to={`/events/${event.id}`}
      className={`block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3
                   hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors
                   ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{event.title}</h4>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{event.category.name}</span>
        <span>{remaining === 0 ? 'Full' : `${remaining} spots`}</span>
      </div>
      <div className="text-xs text-gray-400 mt-2">{formatDate(event.start_time)}</div>
    </Link>
  );
}

function SortableCard({ event }: { event: Event }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    data: { event },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
      <KanbanCard event={event} isDragging={isDragging} />
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [updating, setUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { data, isLoading, error } = useApi(
    () => eventsApi.list({ page_size: '100', status: 'draft,published,completed' }),
    [],
  );

  if (!user || user.role === 'user') return <Navigate to="/" replace />;

  const eventsByStatus = (statusFilter: string[]) => {
    if (!data) return [];
    return data.items.filter((e: Event) => statusFilter.includes(e.status));
  };

  const handleDragStart = (e: DragStartEvent) => {
    const event = data?.items.find((ev: Event) => ev.id === e.active.id);
    setActiveEvent(event || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveEvent(null);
    const { active, over } = e;
    if (!over || !data) return;

    const activeEventData = data.items.find((ev: Event) => ev.id === active.id);
    if (!activeEventData) return;

    // Determine target status from the column the card was dropped into
    const overContainer = COLUMNS.find((col) => col.id === over.id);
    let newStatus: string;

    if (overContainer) {
      newStatus = overContainer.statuses[0];
    } else {
      // Dropped into another card's column — find which column it's in
      const overEvent = data.items.find((ev: Event) => ev.id === over.id);
      if (!overEvent) return;
      const overColumn = COLUMNS.find((col) => col.statuses.includes(overEvent.status));
      if (!overColumn) return;
      newStatus = overColumn.statuses[0];
    }

    const statusMap: Record<string, string> = {
      'draft': 'draft',
      'published': 'published',
      'in-progress': 'published',
      'completed': 'completed',
    };

    const mappedStatus = statusMap[newStatus] || newStatus;

    if (mappedStatus === activeEventData.status) return;

    setUpdating(true);
    try {
      await eventsApi.update(activeEventData.id, { status: mappedStatus as 'draft' | 'published' | 'completed' });
      window.location.reload();
    } catch {
      alert('Status update failed');
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Event Board</h1>
        <Link
          to="/events/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Create Event
        </Link>
      </div>

      {isLoading && <div className="text-center py-20 text-gray-500">Loading...</div>}
      {error && <div className="text-center py-20 text-red-500">Failed to load: {error}</div>}

      {data && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const events = eventsByStatus(col.statuses);
              return (
                <div
                  key={col.id}
                  id={col.id}
                  className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 min-h-[200px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {events.length}
                    </span>
                  </div>
                  <SortableContext items={events.map((e: Event) => e.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {events.map((event: Event) => (
                        <SortableCard key={event.id} event={event} />
                      ))}
                    </div>
                  </SortableContext>
                  {events.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">Drag events to this column</p>
                  )}
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeEvent ? (
              <div className="w-64">
                <KanbanCard event={activeEvent} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {updating && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Updating...
        </div>
      )}
    </div>
  );
}
