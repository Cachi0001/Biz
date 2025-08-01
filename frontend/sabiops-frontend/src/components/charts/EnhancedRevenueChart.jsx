import React from 'react';

const EnhancedRevenueChart = ({ revenueData = [], expenseData = [] }) => {
  console.log('[ENHANCED CHART] Revenue data:', revenueData);
  console.log('[ENHANCED CHART] Expense data:', expenseData);

  // Combine and normalize data
  const combinedData = [];
  const maxLength = Math.max(revenueData.length, expenseData.length);
  
  for (let i = 0; i < maxLength; i++) {
    const revenue = revenueData[i] || { label: '', value: 0 };
    const expense = expenseData[i] || { label: '', value: 0 };
    
    combinedData.push({
      label: revenue.label || expense.label || `Period ${i + 1}`,
      revenue: revenue.value || 0,
      expense: expense.value || 0
    });
  }

  const maxValue = Math.max(
    ...combinedData.map(item => Math.max(item.revenue, item.expense)),
    1
  );
  
  if (combinedData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Revenue vs Expenses</h3>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Revenue</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span>Expenses</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between h-48 space-x-1">
        {combinedData.map((item, index) => {
          const revenueHeight = (item.revenue / maxValue) * 100;
          const expenseHeight = (item.expense / maxValue) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0">
              <div className="flex items-end w-full space-x-1 h-full">
                {/* Revenue Bar */}
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div 
                    className="bg-green-500 rounded-t w-full min-h-[2px] transition-all duration-300 hover:bg-green-600"
                    style={{ height: `${revenueHeight}%` }}
                    title={`Revenue: ₦${item.revenue?.toLocaleString() || 0}`}
                  />
                </div>
                
                {/* Expense Bar */}
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div 
                    className="bg-orange-500 rounded-t w-full min-h-[2px] transition-all duration-300 hover:bg-orange-600"
                    style={{ height: `${expenseHeight}%` }}
                    title={`Expenses: ₦${item.expense?.toLocaleString() || 0}`}
                  />
                </div>
              </div>
              
              <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">
                {item.label}
              </span>
              
              {/* Values below */}
              <div className="text-xs text-gray-500 mt-1 text-center">
                <div className="text-green-600">₦{(item.revenue / 1000).toFixed(0)}k</div>
                <div className="text-orange-600">₦{(item.expense / 1000).toFixed(0)}k</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-gray-600">Total Revenue: </span>
            <span className="font-semibold text-green-600">
              ₦{combinedData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Expenses: </span>
            <span className="font-semibold text-orange-600">
              ₦{combinedData.reduce((sum, item) => sum + item.expense, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Net Profit: </span>
            <span className={`font-semibold ${
              combinedData.reduce((sum, item) => sum + (item.revenue - item.expense), 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              ₦{combinedData.reduce((sum, item) => sum + (item.revenue - item.expense), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRevenueChart;