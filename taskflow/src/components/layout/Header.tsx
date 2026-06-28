import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ThemeToggle } from '../ui/ThemeToggle';

const navLinks = [
  { path: '/', label: 'Events', auth: false },
  { path: '/bookings', label: 'My Bookings', auth: true },
  { path: '/notifications', label: 'Notifications', auth: true },
  { path: '/profile', label: 'Profile', auth: true },
];

export function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const showOrganizerLinks = user && (user.role === 'organizer' || user.role === 'admin');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            EventGo
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks
              .filter((link) => !link.auth || user)
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm transition-colors ${
                    location.pathname === link.path
                      ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {showOrganizerLinks && (
                <>
                  <Link
                    to="/dashboard"
                    className="hidden sm:inline-block px-3 py-1.5 text-sm border border-indigo-300 dark:border-indigo-700
                               text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    Board
                  </Link>
                  <Link
                    to="/events/new"
                    className="hidden sm:inline-block px-3 py-1.5 text-sm bg-indigo-600 text-white
                               rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    New Event
                  </Link>
                </>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
