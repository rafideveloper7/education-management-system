/**
 * ============================================================================
 * FILE: src/Pages/RegisterPage.jsx
 * PURPOSE: Clean, Modern, Focused Public Registration Screen
 * ============================================================================
 * 
 * Preserves 100% of auth logic:
 * - Controlled input states
 * - Zod schema contract matching
 * - `register()` via AuthContext
 * - Automatic session storage & redirection
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

    if (errorMessage) setErrorMessage('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Client-side quick validation
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

      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pure-auth-container">
      <div className="pure-auth-card pure-card-register">
        {/* Header */}
        <div className="pure-auth-header">
          <div className="pure-auth-icon-wrap">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h1 className="pure-auth-title">Create Account</h1>
          <p className="pure-auth-subtitle">Fill in the details below to register</p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="kims-alert-banner alert-error" role="alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="pure-auth-form" noValidate>
          {/* Full Name */}
          <div className="pure-field-group">
            <label className="pure-field-label" htmlFor="fullName">
              Full Name *
            </label>
            <div className="pure-input-wrapper">
              <i className="fa-solid fa-user pure-left-icon"></i>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. Shahid Khan"
                value={formData.fullName}
                onChange={handleChange}
                className="pure-input"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.fullName && <span className="pure-field-error">{fieldErrors.fullName}</span>}
          </div>

          {/* Email Address */}
          <div className="pure-field-group">
            <label className="pure-field-label" htmlFor="email">
              Email Address *
            </label>
            <div className="pure-input-wrapper">
              <i className="fa-solid fa-envelope pure-left-icon"></i>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="pure-input"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && <span className="pure-field-error">{fieldErrors.email}</span>}
          </div>

          {/* Phone Number (Optional) */}
          <div className="pure-field-group">
            <label className="pure-field-label" htmlFor="phone">
              Mobile Number <span className="label-optional">(Optional)</span>
            </label>
            <div className="pure-input-wrapper">
              <i className="fa-solid fa-phone pure-left-icon"></i>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="0333 1234567"
                value={formData.phone}
                onChange={handleChange}
                className="pure-input"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Fields Row */}
          <div className="pure-two-col">
            <div className="pure-field-group">
              <label className="pure-field-label" htmlFor="password">
                Password * (Min 8 chars)
              </label>
              <div className="pure-input-wrapper">
                <i className="fa-solid fa-key pure-left-icon"></i>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
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
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {fieldErrors.password && <span className="pure-field-error">{fieldErrors.password}</span>}
            </div>

            <div className="pure-field-group">
              <label className="pure-field-label" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <div className="pure-input-wrapper">
                <i className="fa-solid fa-key pure-left-icon"></i>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pure-input"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <span className="pure-field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="pure-btn-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer switch to Login */}
        <div className="pure-auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="pure-link-highlight">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
