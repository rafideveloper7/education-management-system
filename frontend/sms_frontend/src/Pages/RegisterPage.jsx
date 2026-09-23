/**
 * ============================================================================
 * FILE: src/Pages/RegisterPage.jsx
 * PURPOSE: New User Registration Screen
 * ============================================================================
 * 
 * STEP-BY-STEP BREAKDOWN:
 * 1. Collects fullName, email, phone, password, confirmPassword.
 * 2. Matches backend Zod schema validation:
 *    - fullName: min 2 chars
 *    - email: valid email pattern
 *    - password: min 8 chars
 *    - confirmPassword: must match password
 * 3. Sends data to `register()` in AuthContext (POST /api/v1/auth/register).
 * 4. Displays real-time validation and backend errors (e.g. duplicate email).
 * 5. Automatically logs user in upon registration and routes to homepage or panel.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form inputs state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset error banners when user makes corrections
    if (errorMessage) setErrorMessage('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Client-side quick validation before API call
  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);

      // Call register in AuthContext
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // On success, redirect to home page
      navigate('/', { replace: true });
    } catch (err) {
      // Backend error (e.g., "An account with this email already exists")
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Education Management Platform</p>
        </div>

        {/* Global error banner */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          {/* Phone Number (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone Number <span style={{ opacity: 0.6, fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g. +1 234 567 8900"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password * (Min 8 characters)
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 8 characters"
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
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
