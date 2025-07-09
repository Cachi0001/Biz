import React from 'react';

const RevenueChart = ({ data = [] }) => {
  console.log('[REVENUE CHART] Received data:', data);

  // Simple bar chart using CSS
  const maxValue = Math.max(...data.map(item => item.value || 0), 1);
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500 text-sm">No revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Revenue Chart</h3>
      <div className="flex items-end justify-between h-40 space-x-2">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${height}%` }}
                title={`${item.label}: ₦${item.value?.toLocaleString() || 0}`}
              />
              <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueChart;

