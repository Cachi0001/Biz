import { useEffect } from 'react';

const useDebugRenders = (componentName) => {
  useEffect(() => {
    console.log(`${componentName} rendered`);
  });
};

export default useDebugRenders; 