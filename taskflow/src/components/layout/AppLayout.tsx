import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
