import React from 'react';
import { cn } from '../../lib/utils';

/**
 * GradientCardWrapper - A reusable component that creates gradient borders around content
 * Follows the pattern: gradient wrapper with white inner content
 */
const GradientCardWrapper = ({ 
  children, 
  className = '',
  gradientFrom = 'from-green-100',
  gradientTo = 'to-green-200',
  gradientDirection = 'bg-gradient-to-r',
  padding = 'p-1',
  borderRadius = 'rounded-xl',
  innerBorderRadius = 'rounded-lg',
  innerBackground = 'bg-white',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        gradientDirection,
        gradientFrom,
        gradientTo,
        borderRadius,
        padding,
        className
      )}
      {...props}
    >
      <div className={cn(innerBackground, innerBorderRadius)}>
        {children}
      </div>
    </div>
  );
};

/**
 * Predefined gradient card wrapper variants for common use cases
 */
const GradientCardVariants = {
  // Primary green gradient for main dashboard cards
  primary: (props) => (
    <GradientCardWrapper
      gradientFrom="from-green-100"
      gradientTo="to-green-200"
      {...props}
    />
  ),

  // Secondary blue gradient for charts and analytics
  secondary: (props) => (
    <GradientCardWrapper
      gradientFrom="from-blue-100"
      gradientTo="to-blue-200"
      {...props}
    />
  ),

  // Accent teal gradient for special sections
  accent: (props) => (
    <GradientCardWrapper
      gradientFrom="from-green-200"
      gradientTo="to-teal-200"
      {...props}
    />
  ),

  // Warning orange gradient for alerts
  warning: (props) => (
    <GradientCardWrapper
      gradientFrom="from-orange-100"
      gradientTo="to-orange-200"
      {...props}
    />
  ),

  // Success emerald gradient for positive actions
  success: (props) => (
    <GradientCardWrapper
      gradientFrom="from-emerald-100"
      gradientTo="to-emerald-200"
      {...props}
    />
  ),

  // Subtle gray gradient for neutral content
  neutral: (props) => (
    <GradientCardWrapper
      gradientFrom="from-gray-100"
      gradientTo="to-gray-200"
      {...props}
    />
  ),

  // Purple gradient for premium features
  premium: (props) => (
    <GradientCardWrapper
      gradientFrom="from-purple-100"
      gradientTo="to-purple-200"
      {...props}
    />
  )
};

export { GradientCardWrapper, GradientCardVariants };
export default GradientCardWrapper;