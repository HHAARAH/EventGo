import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="font-medium">
              {user.role === 'admin' ? 'Admin' : user.role === 'organizer' ? 'Organizer' : 'User'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Registered</span>
            <span>{new Date(user.created_at).toLocaleDateString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
