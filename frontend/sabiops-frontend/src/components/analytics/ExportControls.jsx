import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Download, FileText, Image, Share2, Loader2 } from 'lucide-react';
import analyticsExportService from '../../services/analyticsExportService';
import { useAuth } from '../../contexts/AuthContext';

const ExportControls = ({ analyticsData, timePeriod, onExportStart, onExportComplete }) => {
  const { subscription } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  // Check if user can export (paid users only)
  const canExport = subscription?.plan !== 'free' && !subscription?.is_trial;

  const handleExport = async (type) => {
    if (!canExport) {
      alert('Data export is available for paid subscribers only. Please upgrade your plan.');
      return;
    }

    if (!analyticsData) {
      alert('No analytics data available to export.');
      return;
    }

    setExporting(true);
    setExportType(type);
    onExportStart?.(type);

    try {
      let result;
      
      switch (type) {
        case 'csv':
          result = await analyticsExportService.exportToCSV(
            analyticsData, 
            'analytics_data', 
            timePeriod
          );
          break;
          
        case 'report':
          result = await analyticsExportService.exportFullReport(
            analyticsData, 
            timePeriod
          );
          break;
          
        case 'chart':
          // Export the main analytics chart
          result = await analyticsExportService.exportChartAsImage(
            'analytics-main-chart', 
            'analytics_chart'
          );
          break;
          
        case 'share':
          result = analyticsExportService.generateShareableLink(
            analyticsData, 
            timePeriod
          );
          if (result.success) {
            // Copy to clipboard
            await navigator.clipboard.writeText(result.shareUrl);
            alert('Shareable link copied to clipboard!');
          }
          break;
          
        default:
          throw new Error('Unknown export type');
      }

      if (result.success) {
        onExportComplete?.(type, result);
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
      onExportComplete?.(type, { success: false, error: error.message });
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  const exportOptions = [
    {
      id: 'csv',
      label: 'Export CSV',
      icon: FileText,
      description: 'Download analytics data as CSV file',
      disabled: !canExport
    },
    {
      id: 'report',
      label: 'Export Report(Recommended for best format)',
      icon: Download,
      description: 'Download comprehensive HTML report',
      disabled: !canExport
    },
    {
      id: 'chart',
      label: 'Export Chart',
      icon: Image,
      description: 'Download chart as PNG image',
      disabled: !canExport
    },
    {
      id: 'share',
      label: 'Share Link',
      icon: Share2,
      description: 'Generate shareable analytics link',
      disabled: false // Available for all users
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Export & Share(Use Export Report for best format)</h3>
            {!canExport && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Paid Feature
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isExporting = exporting && exportType === option.id;
              
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(option.id)}
                  disabled={option.disabled || exporting}
                  className={`
                    flex items-center space-x-1 text-xs
                    ${option.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-green-50 border-green-200'
                    }
                  `}
                  title={option.description}
                >
                  {isExporting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Export Status */}
        {exporting && (
          <div className="mt-3 text-xs text-gray-600 flex items-center space-x-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Exporting {exportType}... Please wait.</span>
          </div>
        )}
        
        {/* Upgrade Notice for Free Users */}
        {!canExport && (
          <div className="mt-3 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <strong>Upgrade to unlock data export:</strong> CSV downloads and comprehensive reports are available for paid subscribers.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportControls;