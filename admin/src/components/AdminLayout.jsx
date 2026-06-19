import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
