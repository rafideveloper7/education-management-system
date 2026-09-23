/**
 * ============================================================================
 * FILE: src/services/auth.service.js
 * PURPOSE: Authentication API Service Functions (Powered by Axios)
 * ============================================================================
 * 
 * Each function here maps 1-to-1 with an auth route:
 * 1. registerUser(userData)    -> POST /auth/register
 * 2. loginUser(credentials)    -> POST /auth/login
 * 3. getMe()                   -> GET  /auth/me
 * 4. refreshAccessToken(token) -> POST /auth/refresh
 * 5. logoutUser(token)         -> POST /auth/logout
 * 6. forgotPassword(email)     -> POST /auth/forgot-password
 * 7. resetPassword(payload)    -> POST /auth/reset-password
 */

import api from './api';

/**
 * Register a new public user.
 * 
 * @param {object} payload
 * @param {string} payload.fullName
 * @param {string} payload.email
 * @param {string} payload.password
 * @param {string} payload.confirmPassword
 * @param {string} [payload.phone]
 * @returns {Promise<{success: boolean, data: {user: object, accessToken: string, refreshToken: string}}>}
 */
export async function registerUser(payload) {
  return api.post('/auth/register', payload);
}

/**
 * Login with email and password.
 * 
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{success: boolean, data: {user: object, accessToken: string, refreshToken: string}}>}
 */
export async function loginUser(credentials) {
  return api.post('/auth/login', credentials);
}

/**
 * Fetch the currently authenticated user's profile.
 * Automatically sends Bearer token via api interceptor.
 * 
 * @returns {Promise<{success: boolean, data: {user: object}}>}
 */
export async function getMe() {
  return api.get('/auth/me');
}

/**
 * Request a new access token using an active refresh token.
 * 
 * @param {string} refreshToken
 * @returns {Promise<{success: boolean, data: {user: object, accessToken: string, refreshToken: string}}>}
 */
export async function refreshAccessToken(refreshToken) {
  return api.post('/auth/refresh', { refreshToken });
}

/**
 * Log out user on the server by revoking the refresh token session.
 * 
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export async function logoutUser(refreshToken) {
  return api.post('/auth/logout', { refreshToken });
}

/**
 * Initiate a forgot-password request.
 * 
 * @param {string} email
 * @returns {Promise<{success: boolean, data: {message: string, resetToken?: string}}>}
 */
export async function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email });
}

/**
 * Reset password using reset token.
 * 
 * @param {object} payload
 * @param {string} payload.token
 * @param {string} payload.password
 * @param {string} payload.confirmPassword
 * @returns {Promise<{success: boolean, data: {message: string}}>}
 */
export async function resetPassword(payload) {
  return api.post('/auth/reset-password', payload);
}
