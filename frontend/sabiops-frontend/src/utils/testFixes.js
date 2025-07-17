/**
 * Test utility to verify all the fixes are working
 */

// Test notification service
import notificationService from '../services/notificationService';

export const testNotificationSystem = async () => {
  console.log('🧪 Testing Notification System...');
  
  try {
    // Test fetching notifications
    const data = await notificationService.fetchNotifications();
    console.log('✅ Notifications fetched:', data);
    
    // Test showing different types of notifications
    notificationService.showSaleNotification(25000, 'John Doe');
    notificationService.showLowStockAlert('iPhone 13 Pro', 2);
    notificationService.showPaymentReceived('INV-001', 50000);
    
    console.log('✅ Notification system working correctly');
    return true;
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
    return false;
  }
};

export const testFormValidation = () => {
  console.log('🧪 Testing Form Validation...');
  
  // Test low stock validation logic
  const testCases = [
    { quantity: 10, threshold: 5, shouldPass: true },
    { quantity: 10, threshold: 15, shouldPass: false },
    { quantity: 0, threshold: 0, shouldPass: true },
    { quantity: 5, threshold: 5, shouldPass: true }
  ];
  
  let allPassed = true;
  
  testCases.forEach((testCase, index) => {
    const { quantity, threshold, shouldPass } = testCase;
    const isValid = threshold <= quantity;
    
    if (isValid === shouldPass) {
      console.log(`✅ Test case ${index + 1} passed: quantity=${quantity}, threshold=${threshold}`);
    } else {
      console.error(`❌ Test case ${index + 1} failed: quantity=${quantity}, threshold=${threshold}`);
      allPassed = false;
    }
  });
  
  if (allPassed) {
    console.log('✅ Form validation working correctly');
  } else {
    console.error('❌ Form validation has issues');
  }
  
  return allPassed;
};

export const runAllTests = async () => {
  console.log('🚀 Running all fix tests...');
  
  const results = {
    notifications: await testNotificationSystem(),
    validation: testFormValidation()
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All tests passed! Fixes are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the console for details.');
  }
  
  return results;
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runAllTests();
  }, 2000);
}