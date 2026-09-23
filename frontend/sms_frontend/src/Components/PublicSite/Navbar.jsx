/**
 * ============================================================================
 * FILE: src/Components/PublicSite/Navbar.jsx
 * PURPOSE: Clean Public Navigation Bar with Page Links & Simple Auth Buttons
 * ============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

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

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Programs', path: '/programs' },
    { label: 'Faculty', path: '/faculty' },
    { label: 'Toppers', path: '/toppers', isSpecial: true, icon: 'fa-trophy' },
    { label: 'Admissions', path: '/admissions' },
    { label: 'Events', path: '/events' },
    { label: 'Notices', path: '/notices' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className="kims-header-wrapper">
      {/* 1. Top Utility Bar (Static on Desktop, Smooth Marquee on Mobile) */}
      <div className="top-utility-bar">
        {/* Desktop View */}
        <div className="top-utility-container desktop-utility">
          <div className="top-utility-contact">
            <span className="utility-item">
              <i className="fa-solid fa-location-dot"></i> Dhoda Road, Dheri Banda, Kohat, KPK
            </span>
            <span className="utility-item">
              <i className="fa-solid fa-phone"></i> +92 333 0299920
            </span>
          </div>
          <div className="top-utility-meta">
            <span className="registration-pill">KP-PSRA Registered & BISE Kohat Affiliated</span>
            <span className="motto-text">"Come to Read, Go to Lead"</span>
          </div>
        </div>

        {/* Mobile Smooth Marquee Ticker */}
        <div className="mobile-marquee-wrapper">
          <div className="mobile-marquee-track">
            <span className="marquee-content">
              <span><i className="fa-solid fa-location-dot text-emerald"></i> Dhoda Road, Dheri Banda, Kohat, KPK</span>
              <span className="marquee-sep">•</span>
              <span><i className="fa-solid fa-phone text-emerald"></i> +92 333 0299920</span>
              <span className="marquee-sep">•</span>
              <span className="registration-pill">KP-PSRA Registered & BISE Kohat</span>
              <span className="marquee-sep">•</span>
              <span className="motto-text">"Come to Read, Go to Lead"</span>
              <span className="marquee-sep">•</span>
            </span>
            {/* Duplicated for seamless continuous loop */}
            <span className="marquee-content" aria-hidden="true">
              <span><i className="fa-solid fa-location-dot text-emerald"></i> Dhoda Road, Dheri Banda, Kohat, KPK</span>
              <span className="marquee-sep">•</span>
              <span><i className="fa-solid fa-phone text-emerald"></i> +92 333 0299920</span>
              <span className="marquee-sep">•</span>
              <span className="registration-pill">KP-PSRA Registered & BISE Kohat</span>
              <span className="marquee-sep">•</span>
              <span className="motto-text">"Come to Read, Go to Lead"</span>
              <span className="marquee-sep">•</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Navigation Bar */}
      <div className="main-navbar">
        <div className="navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-badge">
              <span className="logo-letter">K</span>
            </div>
            <div className="logo-texts">
              <span className="brand-title">KIMS<span className="brand-dot">.</span></span>
              <span className="brand-sub">Kohat Institute</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.isSpecial ? 'special-toppers-link' : ''}`}
              >
                {item.icon && <i className={`fa-solid ${item.icon} text-amber`}></i>}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Action Items: Clean Login & Register Buttons */}
          <div className="desktop-actions">
            {isAuthenticated ? (
              <div className="auth-profile-wrap">
                {user?.role && user.role !== 'PUBLIC_USER' && (
                  <Link to={getDashboardPath(user.role)} className="btn-panel-tag">
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>{user.role} Panel</span>
                  </Link>
                )}
                
                <div className="user-profile-chip" title={user?.email}>
                  <div className="chip-avatar">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="chip-info">
                    <span className="chip-name">{user?.fullName?.split(' ')[0]}</span>
                    <span className="chip-role">{user?.role}</span>
                  </div>
                </div>

                <button onClick={handleLogout} className="btn-action-logout" type="button" title="Logout">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <div className="guest-action-group">
                <Link to="/login" className="btn-auth-login">
                  Login
                </Link>
                <Link to="/register" className="btn-auth-register">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
          </button>
        </div>
      </div>

      {/* 3. Mobile Responsive Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-nav-list">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon && <i className={`fa-solid ${item.icon} text-amber mr-2`}></i>}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <div className="mobile-user-box">
                <p className="mobile-user-greeting">
                  Signed in as <strong>{user?.fullName}</strong> ({user?.role})
                </p>
                {user?.role && user.role !== 'PUBLIC_USER' && (
                  <Link
                    to={getDashboardPath(user.role)}
                    className="btn-drawer-panel"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Open {user.role} Panel →
                  </Link>
                )}
                <button onClick={handleLogout} className="btn-drawer-logout">
                  Logout
                </button>
              </div>
            ) : (
              <div className="mobile-guest-buttons">
                <Link to="/login" className="btn-drawer-login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn-drawer-register" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
