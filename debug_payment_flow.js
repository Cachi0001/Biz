/**
 * Debug script to test the payment verification flow
 * Run this in browser console after a payment to debug issues
 */

// Test the payment verification endpoint directly
async function testPaymentVerification() {
    console.log('🧪 Testing Payment Verification Flow...');
    
    const testData = {
        reference: 'TEST_REF_' + Date.now(),
        plan_id: 'weekly',
        amount: 140000
    };
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('❌ No JWT token found in localStorage');
        return;
    }
    
    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    
    try {
        console.log('📡 Calling /api/subscription/verify-payment...');
        
        const response = await fetch('/api/subscription/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 404) {
            console.error('❌ 404 - Endpoint not found! Backend routes not registered properly.');
            return;
        }
        
        if (response.status === 405) {
            console.error('❌ 405 - Method not allowed! POST method not supported.');
            return;
        }
        
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        try {
            const result = JSON.parse(responseText);
            console.log('✅ Parsed response:', result);
        } catch (e) {
            console.error('❌ Failed to parse JSON response:', e);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🚨 BACKEND SERVER IS NOT RUNNING!');
            console.log('💡 Start your backend server:');
            console.log('   cd Biz/backend/sabiops-backend');
            console.log('   python api/index.py');
        }
    }
}

// Test subscription status endpoint
async function testSubscriptionStatus() {
    console.log('🧪 Testing Subscription Status...');
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/subscription/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Status response:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Current subscription:', result);
        } else {
            const error = await response.text();
            console.error('❌ Status error:', error);
        }
        
    } catch (error) {
        console.error('❌ Status network error:', error);
    }
}

// Test if backend is running
async function testBackendHealth() {
    console.log('🧪 Testing Backend Health...');
    
    try {
        const response = await fetch('/health');
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Backend is running:', result);
            return true;
        } else {
            console.error('❌ Backend health check failed:', response.status);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Backend is not running:', error);
        return false;
    }
}

// Main debug function
async function debugPaymentIssue() {
    console.log('🔍 SabiOps Payment Debug Tool');
    console.log('=' .repeat(50));
    
    // Step 1: Check if backend is running
    const backendRunning = await testBackendHealth();
    
    if (!backendRunning) {
        console.log('🚨 ISSUE FOUND: Backend server is not running!');
        console.log('💡 Solution: Start your backend server');
        return;
    }
    
    // Step 2: Test subscription endpoints
    await testSubscriptionStatus();
    await testPaymentVerification();
    
    console.log('\n📋 Debug Summary:');
    console.log('1. Check browser Network tab during payment');
    console.log('2. Look for failed requests to /api/subscription/verify-payment');
    console.log('3. Check backend console for error logs');
    console.log('4. Verify JWT token is valid');
    
    console.log('\n🔧 Common Solutions:');
    console.log('- Restart backend server');
    console.log('- Check database connection');
    console.log('- Verify Supabase credentials');
    console.log('- Check CORS configuration');
}

// Auto-run debug
debugPaymentIssue();

// Export functions for manual testing
window.debugPayment = {
    testPaymentVerification,
    testSubscriptionStatus,
    testBackendHealth,
    debugPaymentIssue
};

console.log('💡 Available debug functions:');
console.log('- debugPayment.testPaymentVerification()');
console.log('- debugPayment.testSubscriptionStatus()');
console.log('- debugPayment.testBackendHealth()');
console.log('- debugPayment.debugPaymentIssue()');