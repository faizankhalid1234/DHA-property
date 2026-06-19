import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Customers from './pages/Customers';
import Blocks from './pages/Blocks';
import Transfers from './pages/Transfers';
import Cases from './pages/Cases';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Sales from './pages/Sales';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/blocks" element={<Blocks />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
