import React from 'react';

const SimpleChart = ({ title, data = [], type = 'bar', height = 200 }) => {
  console.log(`[SIMPLE CHART] ${title} - Received data:`, data);

  if (!data || data.length === 0) {
    return (
      <div className={`h-${height} flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value || 0), 1);

  if (type === 'line') {
    // Simple line chart using SVG
    const width = 300;
    const chartHeight = height - 60;
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = chartHeight - (item.value / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <svg width={width} height={chartHeight + 40} className="mx-auto">
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={points}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = chartHeight - (item.value / maxValue) * chartHeight;
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                <text x={x} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-600">
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Default bar chart
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className={`flex items-end justify-between space-x-2`} style={{ height: `${height - 80}px` }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${barHeight}%` }}
                title={`${item.label}: ${item.value?.toLocaleString() || 0}`}
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

export default SimpleChart;

