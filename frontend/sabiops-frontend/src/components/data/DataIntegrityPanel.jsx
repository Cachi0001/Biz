import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database,
  TrendingUp,
  Package,
  Users,
  FileText,
  DollarSign,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { handleApiError, showToast } from '../../utils/errorHandling';
import { formatNaira } from '../../utils/formatting';
import DataIntegrityService from '../../services/DataIntegrityService';

const DataIntegrityPanel = ({ onDataSync }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  // Data consistency checks configuration
  const consistencyChecks = [
    {
      id: 'inventory_sync',
      name: 'Inventory Synchronization',
      description: 'Verify product quantities match sales records',
      icon: Package,
      endpoint: '/api/data-integrity/inventory-sync',
      critical: true
    },
    {
      id: 'transaction_integrity',
      name: 'Transaction Integrity',
      description: 'Ensure all sales and expenses have transaction records',
      icon: DollarSign,
      endpoint: '/api/data-integrity/transaction-integrity',
      critical: true
    },
    {
      id: 'customer_stats',
      name: 'Customer Statistics',
      description: 'Recalculate customer total purchases and last purchase dates',
      icon: Users,
      endpoint: '/api/data-integrity/customer-stats',
      critical: false
    },
    {
      id: 'invoice_status',
      name: 'Invoice Status Sync',
      description: 'Verify invoice statuses match payment records',
      icon: FileText,
      endpoint: '/api/data-integrity/invoice-status',
      critical: false
    },
    {
      id: 'dashboard_metrics',
      name: 'Dashboard Metrics',
      description: 'Recalculate all dashboard summary statistics',
      icon: TrendingUp,
      endpoint: '/api/data-integrity/dashboard-metrics',
      critical: false
    },
    {
      id: 'orphaned_records',
      name: 'Orphaned Records',
      description: 'Find and handle records with missing relationships',
      icon: Database,
      endpoint: '/api/data-integrity/orphaned-records',
      critical: false
    }
  ];

  // Run individual consistency check using the service
  const runSingleCheck = async (check) => {
    const checkId = check.id.replace('_', '-'); // Convert to API format
    return await DataIntegrityService.runSingleCheck(checkId);
  };

  // Run all consistency checks
  const runAllChecks = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    const checkResults = [];
    const totalChecks = consistencyChecks.length;

    try {
      for (let i = 0; i < consistencyChecks.length; i++) {
        const check = consistencyChecks[i];
        setProgress(((i + 1) / totalChecks) * 100);
        
        const result = await runSingleCheck(check);
        checkResults.push(result);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults(checkResults);
      setLastRun(new Date());
      
      // Show summary toast
      const successCount = checkResults.filter(r => r.status === 'success').length;
      const errorCount = checkResults.filter(r => r.status === 'error').length;
      const totalFixed = checkResults.reduce((sum, r) => sum + r.fixed_count, 0);
      
      if (errorCount === 0) {
        showToast('success', `All ${successCount} checks completed successfully. ${totalFixed} issues fixed.`);
      } else {
        showToast('error', `${successCount} checks passed, ${errorCount} failed. ${totalFixed} issues fixed.`);
      }

      // Trigger data refresh in parent components
      if (onDataSync) {
        onDataSync();
      }

    } catch (error) {
      showToast('error', handleApiError(error, 'Failed to run data integrity checks'));
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  // Get status color for check result
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Data Integrity Panel
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Run manual data consistency checks and synchronization
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastRun && (
              <span className="text-xs text-gray-500">
                Last run: {lastRun.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={runAllChecks}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run All Checks
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running consistency checks...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Available Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Available Checks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {consistencyChecks.map((check) => {
              const Icon = check.icon;
              const result = results?.find(r => r.id === check.id);
              
              return (
                <div
                  key={check.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm text-gray-900">
                            {check.name}
                          </h5>
                          {check.critical && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {check.description}
                        </p>
                        
                        {/* Show result if available */}
                        {result && (
                          <div className="mt-2 space-y-1">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${getStatusColor(result.status)}`}>
                              {getStatusIcon(result.status)}
                              {result.status === 'success' ? 'Passed' : 'Failed'}
                            </div>
                            
                            {result.issues_found > 0 && (
                              <p className="text-xs text-gray-600">
                                Found {result.issues_found} issues, fixed {result.fixed_count}
                              </p>
                            )}
                            
                            {result.message && (
                              <p className="text-xs text-gray-600">
                                {result.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results Summary */}
        {results && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Results Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-xs text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.reduce((sum, r) => sum + r.issues_found, 0)}
                </div>
                <div className="text-xs text-gray-600">Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.reduce((sum, r) => sum + r.fixed_count, 0)}
                </div>
                <div className="text-xs text-gray-600">Issues Fixed</div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-medium text-blue-900 text-sm mb-2">Usage Instructions</h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Run checks regularly to maintain data consistency</li>
            <li>• Critical checks should be run after bulk data operations</li>
            <li>• Results are automatically applied to fix inconsistencies</li>
            <li>• Dashboard and reports will refresh after successful runs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataIntegrityPanel;