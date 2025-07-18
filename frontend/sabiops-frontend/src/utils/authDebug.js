// Authentication Debugging Utilities
import { getAuthToken } from '../services/api';

export const debugAuthState = () => {
  const token = getAuthToken();
  const debugInfo = {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
    localStorage: {
      token: localStorage.getItem('token'),
      keys: Object.keys(localStorage)
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('[AUTH DEBUG] Current authentication state:', debugInfo);
  return debugInfo;
};

export const debugApiRequest = (url, method, headers, data) => {
  const debugInfo = {
    url,
    method,
    headers: {
      ...headers,
      Authorization: headers.Authorization ? 
        `${headers.Authorization.substring(0, 20)}...` : 'Missing'
    },
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    timestamp: new Date().toISOString()
  };
  
  console.log('[API DEBUG] Request details:', debugInfo);
  return debugInfo;
};

export const validateToken = (token) => {
  if (!token) {
    return { valid: false, reason: 'Token is null or undefined' };
  }
  
  if (typeof token !== 'string') {
    return { valid: false, reason: 'Token is not a string' };
  }
  
  if (token.length < 10) {
    return { valid: false, reason: 'Token is too short' };
  }
  
  if (!token.startsWith('Bearer ') && !token.includes('.')) {
    return { valid: false, reason: 'Token format appears invalid (not JWT or Bearer)' };
  }
  
  return { valid: true, reason: 'Token format appears valid' };
};

export const testAuthHeaders = async () => {
  const token = getAuthToken();
  const validation = validateToken(token);
  
  console.log('[AUTH TEST] Token validation:', validation);
  
  // Test if axios interceptor is working
  const testHeaders = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    testHeaders.Authorization = `Bearer ${token}`;
  }
  
  console.log('[AUTH TEST] Headers that would be sent:', {
    ...testHeaders,
    Authorization: testHeaders.Authorization ? 
      `${testHeaders.Authorization.substring(0, 20)}...` : 'Missing'
  });
  
  return {
    token: validation,
    headers: testHeaders
  };
};