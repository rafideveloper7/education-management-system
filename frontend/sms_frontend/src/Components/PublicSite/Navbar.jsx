/**
 * ============================================================================
 * FILE: src/Components/PublicSite/Navbar.jsx
 * PURPOSE: Public Header & Navigation Bar
 * ============================================================================
 * 
 * Demonstrates:
 * - Reactive links based on authentication state (Guest vs Logged In)
 * - Displaying current user's name & role badge
 * - One-click Logout with automatic redirection
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Helper to determine dashboard path based on user role
  const getDashboardPath = (role) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      default:
        return '/';
    }
  };

  return (
    <header className="public-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">EduManagement</span>
        </Link>

        {/* Navigation Actions */}
        <nav className="navbar-nav">
          <Link to="/" className="nav-link">Home</Link>

          {isAuthenticated ? (
            <div className="nav-auth-group">
              {/* Show Panel Link if assigned to a specific role */}
              {user?.role && user.role !== 'PUBLIC_USER' && (
                <Link to={getDashboardPath(user.role)} className="nav-link nav-panel-btn">
                  {user.role} Panel
                </Link>
              )}

              {/* User profile pill */}
              <div className="user-badge" title={user?.email}>
                <span className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</span>
                <span className="user-name">{user?.fullName}</span>
                <span className="role-tag">{user?.role}</span>
              </div>

              {/* Logout button */}
              <button onClick={handleLogout} className="btn-logout" type="button">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth-group">
              <Link to="/login" className="btn-link">Sign In</Link>
              <Link to="/register" className="btn-primary-small">Create Account</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
