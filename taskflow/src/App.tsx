import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingsPage } from './pages/BookingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CreateEventPage, EditEventPage } from './pages/EventFormPages';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EditEventPage />} />
          <Route path="/events/:id/participants" element={<ParticipantsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
