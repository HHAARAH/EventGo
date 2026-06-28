import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

const links = [
  { path: '/', label: 'Events' },
  { path: '/bookings', label: 'Bookings' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' },
];

export function MobileNav() {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex">
        {links
          .filter((l) => l.path === '/' || user)
          .map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex-1 py-2 text-xs text-center transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-500 dark:text-gray-500'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
