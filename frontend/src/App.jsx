import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Attendance from './pages/Attendance';
import Recruitment from './pages/Recruitment';
import Evaluations from './pages/Evaluations';
import Contracts from './pages/Contracts';
import Trainings from './pages/Trainings';
import Documents from './pages/Documents';
import Administration from './pages/Administration';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeePortal from './pages/EmployeePortal';
import Careers from './pages/Careers';
import Disciplinary from './pages/Disciplinary';
import AdminAssessments from './pages/AdminAssessments';
import CandidateTest from './pages/CandidateTest';
import AuditLogs from './pages/AuditLogs';
import ForcePasswordChange from './pages/ForcePasswordChange';
import AttendanceTerminal from './pages/AttendanceTerminal';

const ProtectedRoute = ({ children, role, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  const allowedRoles = roles || (role ? [role] : null);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'assistant') return <Navigate to="/" />;
    if (user.role === 'employee') return <Navigate to="/portal" />;
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/force-password-change" element={<ForcePasswordChange />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/test/:id" element={<CandidateTest />} />
            <Route path="/terminal" element={<AttendanceTerminal />} />

            <Route path="/" element={<ProtectedRoute roles={['admin', 'assistant']}><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="evaluations" element={<Evaluations />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="trainings" element={<Trainings />} />
              <Route path="documents" element={<Documents />} />
              <Route path="administration" element={<Administration />} />
              <Route path="audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
              <Route path="assessments" element={<AdminAssessments />} />
              <Route path="disciplinary" element={<Disciplinary />} />
              <Route path="reports" element={<Reports />} />
              <Route path="accounting" element={<Accounting />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="/portal" element={<ProtectedRoute role="employee"><EmployeePortal /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
