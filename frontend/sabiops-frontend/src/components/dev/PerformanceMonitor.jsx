/**
 * Performance Monitor Component for SabiOps Development
 * Shows performance metrics and cache status during development
 */

import React, { useState, useEffect } from 'react';
import { 
  performanceMonitor, 
  apiCache, 
  getMemoryUsage,
  networkMonitor 
} from '../../utils/performanceOptimizations';
import { useGlobalLoading } from '../../hooks/useOptimizedData';

export const PerformanceMonitor = ({ 
  show = process.env.NODE_ENV === 'development',
  position = 'bottom-right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { loadingStates, isAnyLoading } = useGlobalLoading();

  // Update metrics periodically
  useEffect(() => {
    if (!show || !isOpen) return;

    const updateStats = () => {
      // Performance metrics
      const allMetrics = performanceMonitor.getAllMetrics();
      setMetrics(allMetrics.slice(-10)); // Show last 10 requests

      // Cache stats
      const cacheSize = apiCache.cache.size;
      const cacheKeys = Array.from(apiCache.cache.keys());
      setCacheStats({ size: cacheSize, keys: cacheKeys });

      // Memory usage
      const memory = getMemoryUsage();
      setMemoryUsage(memory);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [show, isOpen]);

  // Network status monitoring
  useEffect(() => {
    if (!show) return;

    const removeListener = networkMonitor.addListener(setIsOnline);
    return removeListener;
  }, [show]);

  if (!show) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAverageResponseTime = () => {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return (total / metrics.length).toFixed(2);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`mb-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all ${
          isAnyLoading() 
            ? 'bg-yellow-500 text-white animate-pulse' 
            : isOnline 
              ? 'bg-green-600 text-white' 
              : 'bg-red-500 text-white'
        }`}
      >
        {isAnyLoading() ? '⏳' : isOnline ? '🚀' : '📡'} PERF
      </button>

      {/* Performance Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto text-xs">
          <div className="space-y-4">
            {/* Network Status */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Network Status</h3>
              <div className={`px-2 py-1 rounded text-white text-center ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Loading States */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Loading States</h3>
              {Object.keys(loadingStates).length === 0 ? (
                <div className="text-gray-500">No active requests</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(loadingStates).map(([key, loading]) => (
                    <div key={key} className="flex justify-between">
                      <span className="truncate">{key}</span>
                      <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                        {loading ? '⏳' : '✅'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Performance ({metrics.length} requests)
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Avg Response:</span>
                  <span className="font-mono">{getAverageResponseTime()}ms</span>
                </div>
                {metrics.slice(-3).map((metric, index) => (
                  <div key={index} className="flex justify-between text-gray-600">
                    <span className="truncate">{metric.key}</span>
                    <span className="font-mono">{(metric.duration || 0).toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cache Stats */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Cache ({cacheStats.size} items)
              </h3>
              <div className="space-y-1">
                {cacheStats.keys.slice(0, 5).map((key, index) => (
                  <div key={index} className="text-gray-600 truncate">
                    {key}
                  </div>
                ))}
                {cacheStats.size > 5 && (
                  <div className="text-gray-500">
                    +{cacheStats.size - 5} more...
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  apiCache.clear();
                  setCacheStats({ size: 0, keys: [] });
                }}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Clear Cache
              </button>
            </div>

            {/* Memory Usage */}
            {memoryUsage && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Memory Usage</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span className="font-mono">{formatBytes(memoryUsage.usedJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-mono">{formatBytes(memoryUsage.totalJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className={`font-mono ${
                      memoryUsage.usagePercentage > 80 ? 'text-red-600' : 
                      memoryUsage.usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {memoryUsage.usagePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  performanceMonitor.clear();
                  setMetrics([]);
                }}
                className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Clear Metrics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;