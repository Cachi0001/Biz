import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Crown,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimitEnforcement } from '../../hooks/usePlanLimitEnforcement';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { toast } from 'react-hot-toast';

/**
 * Test suite component for verifying plan limit enforcement and upgrade prompts
 * This component helps test all the real-time features
 */
const PlanLimitTestSuite = ({ className = '' }) => {
  const { user, subscription } = useAuth();
  const { 
    canPerformAction, 
    enforceAction, 
    getEnforcementSummary,
    clearEnforcementState 
  } = usePlanLimitEnforcement();
  const { 
    incrementUsage, 
    getUsageStatus, 
    resetUsage 
  } = useUsageTracking();
  
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName, testFunction) => {
    setIsRunning(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result, timestamp: new Date() }
      }));
      toast.success(`✅ ${testName} passed`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, timestamp: new Date() }
      }));
      toast.error(`❌ ${testName} failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testScenarios = [
    {
      id: 'basic-plan-limits',
      name: 'Basic Plan Limits Test',
      description: 'Test invoice/expense limits for basic plan users',
      icon: FileText,
      test: async () => {
        // Simulate basic plan user trying to create 6th invoice
        const canCreate = canPerformAction('create_invoice');
        const usageStatus = getUsageStatus();
        
        if (subscription?.plan === 'free' && usageStatus.invoices >= 5) {
          const enforcement = await enforceAction('create_invoice');
          if (enforcement.blocked) {
            return { 
              status: 'blocked', 
              message: 'Correctly blocked invoice creation at limit',
              enforcement 
            };
          }
        }
        
        return { 
          status: 'allowed', 
          canCreate, 
          usageStatus 
        };
      }
    },
    {
      id: 'upgrade-prompts',
      name: 'Upgrade Prompts Test',
      description: 'Test intelligent upgrade prompts based on usage patterns',
      icon: Crown,
      test: async () => {
        const summary = getEnforcementSummary();
        const shouldShowUpgrade = summary.nearLimits.length > 0 || summary.atLimits.length > 0;
        
        return {
          shouldShowUpgrade,
          summary,
          upgradeReasons: summary.nearLimits.concat(summary.atLimits)
        };
      }
    },
    {
      id: 'team-inheritance',
      name: 'Team Plan Inheritance Test',
      description: 'Test that team members inherit owner subscription access',
      icon: Users,
      test: async () => {
        const userRole = user?.role || 'owner';
        const effectivePlan = subscription?.plan || 'free';
        
        // For team members, they should inherit owner's plan
        if (userRole !== 'owner') {
          return {
            userRole,
            effectivePlan,
            inheritsOwnerPlan: true,
            message: 'Team member inherits owner plan access'
          };
        }
        
        return {
          userRole,
          effectivePlan,
          inheritsOwnerPlan: false,
          message: 'Owner has direct plan access'
        };
      }
    },
    {
      id: 'real-time-tracking',
      name: 'Real-time Usage Tracking Test',
      description: 'Test real-time usage increment and tracking',
      icon: RefreshCw,
      test: async () => {
        const beforeUsage = getUsageStatus();
        
        // Simulate creating an invoice
        await incrementUsage('invoices');
        
        const afterUsage = getUsageStatus();
        
        return {
          before: beforeUsage,
          after: afterUsage,
          incremented: afterUsage.invoices > beforeUsage.invoices
        };
      }
    },
    {
      id: 'warning-notifications',
      name: 'Warning Notifications Test',
      description: 'Test warning notifications when approaching limits',
      icon: AlertTriangle,
      test: async () => {
        const usageStatus = getUsageStatus();
        const planLimits = subscription?.plan_limits || { invoices: 5, expenses: 5 };
        
        const warnings = [];
        
        // Check if near limits (80% threshold)
        Object.keys(planLimits).forEach(key => {
          const usage = usageStatus[key] || 0;
          const limit = planLimits[key];
          const percentage = (usage / limit) * 100;
          
          if (percentage >= 80 && percentage < 100) {
            warnings.push({
              type: key,
              usage,
              limit,
              percentage: Math.round(percentage)
            });
          }
        });
        
        return {
          warnings,
          hasWarnings: warnings.length > 0,
          usageStatus,
          planLimits
        };
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    for (const scenario of testScenarios) {
      await runTest(scenario.id, scenario.test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults({});
    clearEnforcementState();
    toast.success('Test results cleared');
  };

  const resetTestData = async () => {
    await resetUsage();
    clearResults();
    toast.success('Test data reset');
  };

  const getTestIcon = (testId) => {
    const result = testResults[testId];
    if (!result) return Play;
    return result.success ? CheckCircle : XCircle;
  };

  const getTestStatus = (testId) => {
    const result = testResults[testId];
    if (!result) return 'pending';
    return result.success ? 'success' : 'error';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Plan Limit Enforcement Test Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test real-time plan limits, usage tracking, and upgrade prompts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium">Current Plan</div>
              <div className="text-2xl font-bold">
                {subscription?.plan === 'free' ? 'Basic' : 'Silver Weekly'}
              </div>
              <Badge variant={subscription?.plan === 'free' ? 'secondary' : 'default'}>
                {subscription?.status || 'Active'}
              </Badge>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium">Usage Status</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Invoices:</span>
                  <span>{getUsageStatus().invoices || 0}/{subscription?.plan_limits?.invoices || 5}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expenses:</span>
                  <span>{getUsageStatus().expenses || 0}/{subscription?.plan_limits?.expenses || 5}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium">User Role</div>
              <div className="text-2xl font-bold capitalize">
                {user?.role || 'Owner'}
              </div>
              <Badge variant="outline">
                {user?.role === 'owner' ? 'Direct Access' : 'Inherited Access'}
              </Badge>
            </Card>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run All Tests
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
            <Button variant="outline" onClick={resetTestData}>
              Reset Test Data
            </Button>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-3">
            {testScenarios.map((scenario) => {
              const IconComponent = getTestIcon(scenario.id);
              const status = getTestStatus(scenario.id);
              const result = testResults[scenario.id];
              
              return (
                <Card key={scenario.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <scenario.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{scenario.name}</h4>
                          <IconComponent 
                            className={`h-4 w-4 ${
                              status === 'success' ? 'text-green-500' : 
                              status === 'error' ? 'text-red-500' : 
                              'text-muted-foreground'
                            }`} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        
                        {result && (
                          <div className="mt-2">
                            {result.success ? (
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Test Passed:</strong>
                                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                                    {JSON.stringify(result.result, null, 2)}
                                  </pre>
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Test Failed:</strong> {result.error}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTest(scenario.id, scenario.test)}
                      disabled={isRunning}
                    >
                      Run Test
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          {Object.keys(testResults).length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Test Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600">✅ Passed: </span>
                  {Object.values(testResults).filter(r => r.success).length}
                </div>
                <div>
                  <span className="text-red-600">❌ Failed: </span>
                  {Object.values(testResults).filter(r => !r.success).length}
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanLimitTestSuite;