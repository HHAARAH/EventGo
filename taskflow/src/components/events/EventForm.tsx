import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoriesApi } from '../../api/client';
import { useApi } from '../../hooks';
import type { EventInput, Category } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Please enter event title'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().min(1, 'Please select start time'),
  end_time: z.string().min(1, 'Please select end time'),
  max_capacity: z.coerce.number().min(1, 'At least 1 person').max(99999),
  category_id: z.coerce.number().min(1, 'Please select category'),
  status: z.string().optional(),
});

interface Props {
  onSubmit: (data: EventInput) => Promise<void>;
  defaultValues?: Partial<EventInput>;
  isEdit?: boolean;
}

export function EventForm({ onSubmit, defaultValues, isEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: categories } = useApi(() => categoriesApi.list(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      location: defaultValues?.location || '',
      start_time: defaultValues?.start_time || '',
      end_time: defaultValues?.end_time || '',
      max_capacity: defaultValues?.max_capacity || 50,
      category_id: defaultValues?.category_id || ('' as unknown as number),
      status: defaultValues?.status || 'draft',
    },
  });

  const doSubmit: SubmitHandler<Record<string, unknown>> = async (formData) => {
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        title: formData.title as string,
        description: (formData.description as string) || undefined,
        location: (formData.location as string) || undefined,
        start_time: formData.start_time as string,
        end_time: formData.end_time as string,
        max_capacity: Number(formData.max_capacity),
        category_id: Number(formData.category_id),
        status: (formData.status as EventInput['status']) || 'draft',
      });
    } catch {
      setError('Submission failed, please retry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium mb-1">Event Title *</label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Event Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            {...register('location')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Capacity *</label>
          <input
            type="number"
            {...register('max_capacity')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.max_capacity && <p className="text-red-500 text-sm mt-1">{errors.max_capacity.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time *</label>
          <input
            type="datetime-local"
            {...register('start_time')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time *</label>
          <input
            type="datetime-local"
            {...register('end_time')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            {...register('category_id')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Category</option>
            {categories?.map((c: Category) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
      >
        {loading ? 'Submitting...' : isEdit ? 'Save Changes' : 'Create Event'}
      </button>
    </form>
  );
}
