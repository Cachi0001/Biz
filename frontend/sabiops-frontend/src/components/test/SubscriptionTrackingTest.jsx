import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import subscriptionMonitor from '../../services/subscriptionMonitor';

const SubscriptionTrackingTest = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    // Start monitoring when component mounts
    const unsubscribe = subscriptionMonitor.addListener((status) => {
      console.log('[SubscriptionTrackingTest] Status update received:', status);
      setSubscriptionData(status);
      
      // Add to test results
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: 'monitor_update',
        data: status,
        message: `Real-time update: ${status.days_remaining} days remaining`
      }]);
    });

    setMonitoring(true);

    return () => {
      unsubscribe();
      setMonitoring(false);
    };
  }, []);

  const addTestResult = (type, message, data = null, success = true) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      success
    }]);
  };

  const testRealTimeStatus = async () => {
    setLoading(true);
    try {
      const status = await subscriptionService.getCurrentSubscription();
      setSubscriptionData(status);
      addTestResult('api_call', `Real-time status fetched: ${status.plan_name} - ${status.days_remaining} days`, status);
    } catch (error) {
      addTestResult('api_call', `Failed to fetch real-time status: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const testFeatureAccess = async (feature) => {
    setLoading(true);
    try {
      const access = await subscriptionService.checkFeatureAccess(feature);
      addTestResult('feature_access', 
        `${feature} access: ${access.has_access ? 'ALLOWED' : 'DENIED'} (${access.current_usage}/${access.feature_limit})`, 
        access, 
        access.has_access
      );
    } catch (error) {
      addTestResult('feature_access', `Failed to check ${feature} access: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const createTestSubscription = async (days) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/subscription/create-test-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_id: 'weekly',
          days_from_now: days
        })
      });

      const result = await response.json();
      if (result.success) {
        addTestResult('test_subscription', `Test subscription created with ${days} days remaining`, result.data);
        // Refresh status
        await testRealTimeStatus();
      } else {
        addTestResult('test_subscription', `Failed to create test subscription: ${result.error}`, result, false);
      }
    } catch (error) {
      addTestResult('test_subscription', `Error creating test subscription: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const simulateDayPassage = async (days) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/subscription/simulate-day-passage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          days_to_subtract: days
        })
      });

      const result = await response.json();
      if (result.success) {
        addTestResult('simulation', `Simulated ${days} days passage. New remaining: ${result.data.simulation.days_remaining}`, result.data);
        // Refresh status
        await testRealTimeStatus();
      } else {
        addTestResult('simulation', `Failed to simulate day passage: ${result.error}`, result, false);
      }
    } catch (error) {
      addTestResult('simulation', `Error simulating day passage: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const testExpiration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/subscription/test-expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        addTestResult('expiration', `Expiration test completed. Status: ${result.data.current_status.unified_status}`, result.data);
        // Refresh status
        await testRealTimeStatus();
      } else {
        addTestResult('expiration', `Failed to test expiration: ${result.error}`, result, false);
      }
    } catch (error) {
      addTestResult('expiration', `Error testing expiration: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const resetToFree = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/subscription/reset-to-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        addTestResult('reset', 'Reset to free plan completed', result.data);
        // Refresh status
        await testRealTimeStatus();
      } else {
        addTestResult('reset', `Failed to reset to free: ${result.error}`, result, false);
      }
    } catch (error) {
      addTestResult('reset', `Error resetting to free: ${error.message}`, error, false);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    if (status === 'expired') return 'text-red-600';
    if (status === 'trial') return 'text-blue-600';
    if (status === 'active') return 'text-green-600';
    return 'text-gray-600';
  };

  const getDaysColor = (days) => {
    if (days === null || days === undefined) return 'text-gray-500';
    if (days <= 0) return 'text-red-600';
    if (days <= 3) return 'text-red-500';
    if (days <= 7) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Day Tracking Test</h1>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${monitoring ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            <div className={`w-2 h-2 rounded-full ${monitoring ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            {monitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold">{subscriptionData.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${getStatusColor(subscriptionData.status)}`}>
                  {subscriptionData.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className={`font-semibold ${getDaysColor(subscriptionData.days_remaining)}`}>
                  {subscriptionData.days_remaining !== null ? subscriptionData.days_remaining : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm">
                  {subscriptionData.last_updated ? new Date(subscriptionData.last_updated).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No subscription data available</p>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={testRealTimeStatus} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            
            <Button 
              onClick={() => createTestSubscription(7)} 
              disabled={loading}
              variant="outline"
            >
              Create 7-Day Test
            </Button>
            
            <Button 
              onClick={() => createTestSubscription(3)} 
              disabled={loading}
              variant="outline"
            >
              Create 3-Day Test
            </Button>
            
            <Button 
              onClick={() => simulateDayPassage(1)} 
              disabled={loading}
              variant="outline"
            >
              Simulate 1 Day
            </Button>
            
            <Button 
              onClick={() => simulateDayPassage(3)} 
              disabled={loading}
              variant="outline"
            >
              Simulate 3 Days
            </Button>
            
            <Button 
              onClick={testExpiration} 
              disabled={loading}
              variant="outline"
            >
              Test Expiration
            </Button>
            
            <Button 
              onClick={() => testFeatureAccess('invoices')} 
              disabled={loading}
              variant="outline"
            >
              Test Invoice Access
            </Button>
            
            <Button 
              onClick={resetToFree} 
              disabled={loading}
              variant="destructive"
            >
              Reset to Free
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Results</CardTitle>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run some tests to see results here.</p>
            ) : (
              testResults.slice().reverse().map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${result.success !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-start gap-2">
                    {result.success !== false ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">View Data</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTrackingTest;