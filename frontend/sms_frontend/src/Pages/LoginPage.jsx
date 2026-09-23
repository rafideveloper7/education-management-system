/**
 * ============================================================================
 * FILE: src/Pages/LoginPage.jsx
 * PURPOSE: User Login Screen
 * ============================================================================
 * 
 * STEP-BY-STEP BREAKDOWN:
 * 1. Collects email and password from user via controlled input fields.
 * 2. On submit, calls `login({ email, password })` from AuthContext.
 * 3. Shows informative spinner during API request.
 * 4. Displays clear error messages if backend returns 401 or invalid credentials.
 * 5. On success, redirects the user based on their assigned role:
 *    - ADMIN    -> /admin
 *    - TEACHER  -> /teacher
 *    - STUDENT  -> /student
 *    - PARENT   -> /parent
 *    - Other    -> /
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
    // Clear error banner when user starts typing again
    if (errorMessage) setErrorMessage('');
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic frontend checks before sending network request
    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);

      // Call login function in AuthContext
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const user = response?.data?.user;

      // Smart Redirect based on role or original intended page
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

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
      // Backend error message (e.g. "Invalid email or password" or "This account is disabled")
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your Education Management account</p>
        </div>

        {/* Error notification alert */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="e.g. teacher@school.edu"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Submit button with loading spinner */}
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="auth-footer">
          Don't have an account yet?
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
