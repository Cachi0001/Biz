import React from 'react';
import { cn } from '../../lib/utils';

const GradientCard = ({ 
  children, 
  gradientFrom = 'from-green-100', 
  gradientTo = 'to-green-200',
  className = '',
  innerClassName = ''
}) => {
  return (
    <div className={cn(
      `bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl p-1`,
      className
    )}>
      <div className={cn('bg-white rounded-lg', innerClassName)}>
        {children}
      </div>
    </div>
  );
};

export { GradientCard };
export default GradientCard;