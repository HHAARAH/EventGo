import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/useAuthStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: doRegister, isLoading, error, clearError } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    clearError();
    try {
      await doRegister(data.name, data.email, data.password);
      navigate('/');
    } catch {
      setServerError('Registration failed, please check your information or try another email');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign up for EventGo</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                       bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Your name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                       bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                       bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {(serverError || error) && (
          <p className="text-red-500 text-sm text-center">{serverError || error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700
                     disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
