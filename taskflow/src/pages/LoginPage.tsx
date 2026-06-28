import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/useAuthStore';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
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
      await login(data.email, data.password);
      navigate('/');
    } catch {
      setServerError('Login failed, please check your email and password');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Login to EventGo</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            placeholder="Enter password"
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
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
