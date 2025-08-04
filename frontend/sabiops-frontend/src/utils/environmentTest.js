// Environment Testing Utility
import { ENV_CONFIG } from '../config/environment.js';
import { healthCheck } from '../services/api.js';

export const testEnvironmentConfiguration = async () => {
  console.log('=== Environment Configuration Test ===');
  console.log('Current URL:', window.location.href);
  console.log('Environment Config:', ENV_CONFIG);
  
  try {
    console.log('Testing backend connectivity...');
    const healthResponse = await healthCheck();
    console.log('✅ Backend health check successful:', healthResponse);
    
    return {
      success: true,
      environment: ENV_CONFIG.environment,
      apiUrl: ENV_CONFIG.apiBaseUrl,
      backendHealth: healthResponse
    };
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    
    return {
      success: false,
      environment: ENV_CONFIG.environment,
      apiUrl: ENV_CONFIG.apiBaseUrl,
      error: error.message,
      details: error.response?.data || 'No response data'
    };
  }
};

// Auto-run test in development
if (ENV_CONFIG.isDevelopment) {
  testEnvironmentConfiguration().then(result => {
    console.log('Environment test result:', result);
  });
}