/**
 * ============================================================================
 * FILE: src/Pages/LoginPage.jsx
 * PURPOSE: Clean, Modern, Focused Login Screen (Pure Email & Password)
 * ============================================================================
 * 
 * Preserves 100% of auth logic:
 * - Controlled email & password state
 * - `login({ email, password })` from AuthContext
 * - Automatic token saving & role-based dashboard redirects
 * - Instant error handling (401, 403, network errors)
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const user = response?.data?.user;

      // Check if user came from a guarded route
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Redirect by role
      switch (user?.role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'TEACHER':
          navigate('/teacher', { replace: true });
          break;
        case 'STUDENT':
          navigate('/student', { replace: true });
          break;
        case 'PARENT':
          navigate('/parent', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
          break;
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pure-auth-container">
      <div className="pure-auth-card">
        {/* Header */}
        <div className="pure-auth-header">
          <div className="pure-auth-icon-wrap">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h1 className="pure-auth-title">Welcome Back</h1>
          <p className="pure-auth-subtitle">Sign in to your account to continue</p>
        </div>

        {/* Error notification alert */}
        {errorMessage && (
          <div className="kims-alert-banner alert-error" role="alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="pure-auth-form" noValidate>
          {/* Email Address */}
          <div className="pure-field-group">
            <label className="pure-field-label" htmlFor="email">
              Email Address
            </label>
            <div className="pure-input-wrapper">
              <i className="fa-solid fa-envelope pure-left-icon"></i>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="pure-input"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password with Show/Hide */}
          <div className="pure-field-group">
            <label className="pure-field-label" htmlFor="password">
              Password
            </label>
            <div className="pure-input-wrapper">
              <i className="fa-solid fa-key pure-left-icon"></i>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="pure-input"
                disabled={isLoading}
              />
              <button
                type="button"
                className="pure-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" className="pure-btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer switch to Register */}
        <div className="pure-auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="pure-link-highlight">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
