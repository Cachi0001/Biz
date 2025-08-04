// Environment configuration utility
export const getEnvironmentConfig = () => {
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;
  
  // Development environment (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      environment: 'development',
      apiBaseUrl: '/api', // Use proxy in development
      backendUrl: 'http://localhost:5000',
      isProduction: false,
      isPreview: false,
      isDevelopment: true
    };
  }
  
  // Dev-feature preview environment
  if (currentUrl.includes('dev-feature') || currentUrl.includes('git-dev-feature')) {
    return {
      environment: 'dev-feature',
      apiBaseUrl: 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api',
      backendUrl: 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app',
      isProduction: false,
      isPreview: true,
      isDevelopment: false
    };
  }
  
  // Production environment
  if (currentUrl.includes('sabiops.vercel.app')) {
    return {
      environment: 'production',
      apiBaseUrl: 'https://sabiops-backend.vercel.app/api',
      backendUrl: 'https://sabiops-backend.vercel.app',
      isProduction: true,
      isPreview: false,
      isDevelopment: false
    };
  }
  
  // Other preview environments - default to dev-feature backend
  if (currentUrl.includes('vercel.app')) {
    return {
      environment: 'preview',
      apiBaseUrl: 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api',
      backendUrl: 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app',
      isProduction: false,
      isPreview: true,
      isDevelopment: false
    };
  }
  
  // Fallback to environment variable or production
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  return {
    environment: import.meta.env.VITE_ENVIRONMENT || 'production',
    apiBaseUrl: envApiUrl || 'https://sabiops-backend.vercel.app/api',
    backendUrl: envApiUrl?.replace('/api', '') || 'https://sabiops-backend.vercel.app',
    isProduction: !envApiUrl || envApiUrl.includes('sabiops-backend.vercel.app'),
    isPreview: false,
    isDevelopment: false
  };
};

// Get current environment configuration
export const ENV_CONFIG = getEnvironmentConfig();

// Log environment configuration for debugging
console.log('[DEBUG] Environment Configuration:', ENV_CONFIG);

export default ENV_CONFIG;