import React, { useState } from 'react';
import BulletproofInput from './BulletproofInput';

/**
 * Test component to verify BulletproofInput functionality
 */
const BulletproofInputTest = () => {
  const [testValue, setTestValue] = useState('');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">BulletproofInput Test</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Test Input:</label>
        <BulletproofInput
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
          placeholder="Type here to test focus stability..."
          className="w-full"
          componentName="TestInput"
          debounceMs={300}
        />
      </div>
      <div className="text-sm text-gray-600">
        Current value: "{testValue}"
      </div>
    </div>
  );
};

export default BulletproofInputTest; 