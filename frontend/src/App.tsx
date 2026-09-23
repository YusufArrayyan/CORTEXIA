import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssessment from './pages/student/StudentAssessment';
import StudentProgress from './pages/student/StudentProgress';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherAssessments from './pages/teacher/TeacherAssessments';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Student Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/assessment" 
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAssessment />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/progress" 
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentProgress />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher Routes */}
      <Route 
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/students" 
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherStudents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/assessments" 
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherAssessments />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminSettings />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
