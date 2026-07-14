const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom request wrapper for fetch API
 * @param {string} endpoint - The API endpoint relative to the base VITE_API_URL
 * @param {Object} options - Request configuration options
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  // Automatically attach Bearer token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type header if sending JSON data
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Extract structured backend error message if available
      const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
      const errorDetails = data?.error?.details || null;
      const errorCode = data?.error?.code || 'UNKNOWN_ERROR';
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = errorCode;
      error.details = errorDetails;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's already a formatted API error, propagate it
    if (error.status) {
      throw error;
    }
    
    // Otherwise, it's a network or uncaught browser error
    const networkError = new Error(error.message || 'Network error occurred. Please check your connection.');
    networkError.status = 500;
    networkError.code = 'NETWORK_ERROR';
    networkError.details = null;
    throw networkError;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};
