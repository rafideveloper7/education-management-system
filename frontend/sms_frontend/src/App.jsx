/**
 * ============================================================================
 * FILE: src/App.jsx
 * PURPOSE: Root Application Component & Router Configuration
 * ============================================================================
 * 
 * ARCHITECTURE RULES HONORED:
 * 1. Root `src/` files and `src/Pages/` drive the Public Website (Home, Login, Register).
 * 2. Dedicated Panels (`src/Panels/Admin`, `Teacher`, `Student`, `Parent`) have isolated UI
 *    and are guarded by <ProtectedRoute>.
 * 3. <AuthProvider> wraps everything to supply unified authentication state globally.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './Components/PublicSite/Navbar';
import ProtectedRoute from './Components/ProtectedRoute';

// Public Pages
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';

// Panel Entry Dashboards (Completely separate folders with separate UI)
import AdminDashboard from './Panels/Admin/AdminDashboard';
import TeacherDashboard from './Panels/Teacher/TeacherDashboard';
import StudentDashboard from './Panels/Student/StudentDashboard';
import ParentDashboard from './Panels/Parent/ParentDashboard';

import './App.css';

/**
 * Layout wrapper that shows the Public Navbar on public pages,
 * but allows panels to have their own separate layouts if desired.
 */
function AppContent() {
  const location = useLocation();

  // Hide the public website navbar when inside isolated dashboard panels
  const isPanelRoute = ['/admin', '/teacher', '/student', '/parent'].some(prefix =>
    location.pathname.startsWith(prefix)
  );

  return (
    <div className="app-container">
      {!isPanelRoute && <Navbar />}

      <main className="main-content">
        <Routes>
          {/* Public Website Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Panel (Isolated UI, restricted to ADMIN) */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Teacher Panel (Isolated UI, restricted to TEACHER) */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Panel (Isolated UI, restricted to STUDENT) */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Parent Panel (Isolated UI, restricted to PARENT) */}
          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRoles={['PARENT']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}