// Test script to verify environment configuration
import { ENV_CONFIG } from '../config/environment.js';

export const runEnvironmentTests = async () => {
  console.log('🧪 Running Environment Configuration Tests...');
  console.log('='.repeat(50));
  
  // Test 1: Environment Detection
  console.log('1. Environment Detection:');
  console.log(`   Current URL: ${window.location.href}`);
  console.log(`   Detected Environment: ${ENV_CONFIG.environment}`);
  console.log(`   API Base URL: ${ENV_CONFIG.apiBaseUrl}`);
  console.log(`   Is Production: ${ENV_CONFIG.isProduction}`);
  console.log(`   Is Preview: ${ENV_CONFIG.isPreview}`);
  console.log(`   Is Development: ${ENV_CONFIG.isDevelopment}`);
  
  // Test 2: Backend Connectivity
  console.log('\n2. Backend Connectivity Test:');
  try {
    const response = await fetch(`${ENV_CONFIG.apiBaseUrl.replace('/api', '')}/health`);
    const data = await response.json();
    console.log('   ✅ Backend Health Check: SUCCESS');
    console.log(`   Backend Status: ${data.status}`);
    console.log(`   Backend Mode: ${data.mode}`);
    console.log(`   Supabase Connected: ${data.supabase_connected}`);
  } catch (error) {
    console.log('   ❌ Backend Health Check: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: CORS Configuration
  console.log('\n3. CORS Configuration Test:');
  try {
    const response = await fetch(`${ENV_CONFIG.apiBaseUrl.replace('/api', '')}/debug/cors`);
    const data = await response.json();
    console.log('   ✅ CORS Debug: SUCCESS');
    console.log(`   Origin Header: ${data.origin}`);
    console.log(`   Vercel Environment: ${data.vercel_env}`);
    console.log(`   Allowed Origins: ${data.allowed_origins.length} configured`);
  } catch (error) {
    console.log('   ❌ CORS Debug: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: API Authentication Test
  console.log('\n4. API Authentication Test:');
  try {
    const response = await fetch(`${ENV_CONFIG.apiBaseUrl}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      console.log('   ✅ Auth Endpoint: ACCESSIBLE (401 expected without token)');
    } else {
      console.log(`   ⚠️  Auth Endpoint: Unexpected status ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Auth Endpoint: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Environment Tests Complete!');
  
  return {
    environment: ENV_CONFIG.environment,
    apiUrl: ENV_CONFIG.apiBaseUrl,
    timestamp: new Date().toISOString()
  };
};

// Auto-run tests if in development or preview
if (ENV_CONFIG.isDevelopment || ENV_CONFIG.isPreview) {
  // Run tests after a short delay to ensure DOM is ready
  setTimeout(() => {
    runEnvironmentTests();
  }, 1000);
}