import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Database, Settings } from 'lucide-react';
import DataIntegrityPanel from './DataIntegrityPanel';

const DataIntegrityWidget = ({ onDataSync, compact = false }) => {
  const [showPanel, setShowPanel] = useState(false);

  if (compact) {
    // Compact version for dashboard or sidebar
    return (
      <div className="space-y-2">
        <Button
          onClick={() => setShowPanel(!showPanel)}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <Database className="h-4 w-4 mr-2" />
          Data Integrity
        </Button>
        
        {showPanel && (
          <div className="mt-4">
            <DataIntegrityPanel onDataSync={onDataSync} />
          </div>
        )}
      </div>
    );
  }

  // Full version for dedicated pages
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            System Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Use these tools to maintain data consistency and fix any synchronization issues.
            </p>
            
            <Button
              onClick={() => setShowPanel(!showPanel)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="h-4 w-4 mr-2" />
              {showPanel ? 'Hide' : 'Show'} Data Integrity Panel
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showPanel && (
        <DataIntegrityPanel onDataSync={onDataSync} />
      )}
    </div>
  );
};

export default DataIntegrityWidget;