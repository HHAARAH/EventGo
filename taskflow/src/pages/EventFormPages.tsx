import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsApi, categoriesApi } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useApi } from '../hooks';
import { EventForm } from '../components/events/EventForm';
import type { EventInput } from '../types';

export function CreateEventPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'user') navigate('/');
  }, [user, navigate]);

  if (!user || user.role === 'user') return null;

  const handleSubmit = async (data: EventInput) => {
    const event = await eventsApi.create(data);
    navigate(`/events/${event.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: event, isLoading } = useApi(
    () => eventsApi.detail(Number(id)),
    [id],
  );

  useEffect(() => {
    if (event && user && event.organizer.id !== user.id && user.role !== 'admin') {
      navigate('/');
    }
  }, [event, user, navigate]);

  if (isLoading) return <div className="text-center py-20">Loading...</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found</div>;

  const handleSubmit = async (data: Partial<EventInput>) => {
    await eventsApi.update(event.id, data);
    navigate(`/events/${event.id}`);
  };

  const defaultValues: Partial<EventInput> = {
    title: event.title,
    description: event.description,
    location: event.location,
    start_time: event.start_time.slice(0, 16),
    end_time: event.end_time.slice(0, 16),
    max_capacity: event.max_capacity,
    category_id: event.category.id,
    status: (event.status === 'draft' || event.status === 'published') ? event.status : 'draft',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/events/${id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        ← Back to Event
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm onSubmit={handleSubmit} defaultValues={defaultValues} isEdit />
    </div>
  );
}
