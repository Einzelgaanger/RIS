import { useAuth } from '@/contexts/AuthContext';
import AdminManagerDashboard from '@/components/dashboard/AdminManagerDashboard';
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'admin' || role === 'manager') {
    return <AdminManagerDashboard />;
  }

  return <ProfessionalDashboard />;
}
