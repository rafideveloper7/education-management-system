/**
 * ============================================================================
 * FILE: src/Components/ProtectedRoute.jsx
 * PURPOSE: Role-Based Route Guard
 * ============================================================================
 * 
 * WHY THIS IS CRUCIAL:
 * Prevents unauthenticated users from opening protected routes (e.g. `/admin`, `/teacher`).
 * 
 * HOW IT WORKS:
 * 1. Checks `isLoading`: while checking authentication status from localStorage/API,
 *    displays a subtle loading screen so we don't prematurely redirect.
 * 2. Checks `isAuthenticated`: if not logged in, redirects user to `/login` and remembers
 *    which page they tried to visit (via `location.state.from`).
 * 3. Checks `allowedRoles`: if this route is restricted to `ADMIN` and current user
 *    is `STUDENT`, redirects them to home page or unauthorized notice.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // If auth is still checking tokens on refresh, show brief loader
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--accent)' }}></div>
      </div>
    );
  }

  // If user is not logged in, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is restricted to specific roles (e.g. ['ADMIN']) and user does not match
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text)', margin: '12px 0 24px' }}>
          Your account role (<strong>{user?.role}</strong>) does not have permission to view this panel.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  // If all checks pass, render the protected component
  return children;
}
