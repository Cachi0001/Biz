import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

const TimePeriodFilter = ({ currentPeriod, onPeriodChange, loading }) => {
  const periods = [
    { id: 'daily', label: 'Daily', icon: Clock, description: 'Today vs Yesterday' },
    { id: 'weekly', label: 'Weekly', icon: Calendar, description: 'This Week vs Last Week' },
    { id: 'monthly', label: 'Monthly', icon: TrendingUp, description: 'This Month vs Last Month' },
    { id: 'yearly', label: 'Yearly', icon: Calendar, description: 'This Year vs Last Year' }
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Time Period</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => {
              const Icon = period.icon;
              const isActive = currentPeriod === period.id;
              
              return (
                <Button
                  key={period.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPeriodChange(period.id)}
                  disabled={loading}
                  className={`
                    flex items-center space-x-1 text-xs
                    ${isActive 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-white hover:bg-blue-50 text-gray-700 border-blue-200'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={period.description}
                >
                  <Icon className="h-3 w-3" />
                  <span>{period.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Period Description */}
        <div className="mt-2 text-xs text-gray-600">
          {periods.find(p => p.id === currentPeriod)?.description || 'Select a time period to view analytics'}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimePeriodFilter;