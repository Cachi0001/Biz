import React from 'react';
import { AlertCircle } from 'lucide-react';

const RequiredFieldIndicator = ({ className = '', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <AlertCircle 
      className={`text-red-500 ${sizeClasses[size]} ${className}`}
      aria-label="Required field"
    />
  );
};

export default RequiredFieldIndicator; 