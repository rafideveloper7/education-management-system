/**
 * ============================================================================
 * FILE: src/services/api.js
 * PURPOSE: Axios Instance with Request & Response Interceptors
 * ============================================================================
 * 
 * WHY AXIOS INSTEAD OF FETCH?
 * 1. Automatic JSON stringify & parse (no need for JSON.stringify or response.json()).
 * 2. Interceptors: Automatically injects JWT Bearer token into every outgoing request.
 * 3. Unified Error Handling: Backend error messages (like 400, 401, 409) are
 *    cleanly extracted from error.response.data.message.
 */

import axios from 'axios';

// 1. Create a custom Axios instance with default configurations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR:
 * Runs right BEFORE any request leaves the browser.
 * It checks localStorage for an access token and attaches it to the Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR:
 * Runs right AFTER a response comes back from the server.
 * If backend returned an error status (e.g. 400 Zod error, 401 Invalid credentials, 409 Conflict),
 * this formats the error message cleanly so components get a clear error string.
 */
api.interceptors.response.use(
  (response) => {
    // Return the response data directly (e.g. response.data contains { success: true, data: ... })
    return response.data;
  },
  (error) => {
    // Extract clean error message from backend if available
    const serverMessage = error.response?.data?.message;
    const fallbackMessage = error.message === 'Network Error'
      ? 'Cannot connect to backend server. Make sure server is running on port 5000.'
      : (error.message || 'An unexpected error occurred');

    const customError = new Error(serverMessage || fallbackMessage);
    customError.status = error.response?.status;
    customError.data = error.response?.data;

    return Promise.reject(customError);
  }
);

export default api;
