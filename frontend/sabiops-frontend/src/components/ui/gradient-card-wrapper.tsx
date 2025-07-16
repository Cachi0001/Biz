import React from 'react';

interface GradientCardWrapperProps {
  children: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  padding?: string;
  borderRadius?: string;
  innerBorderRadius?: string;
  innerBackground?: string;
  [key: string]: any;
}

/**
 * GradientCardWrapper - A reusable component that creates gradient borders around content
 * Follows the pattern: gradient wrapper with white inner content
 */
const GradientCardWrapper: React.FC<GradientCardWrapperProps> = ({ 
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
  const outerClasses = [
    gradientDirection,
    gradientFrom,
    gradientTo,
    borderRadius,
    padding,
    className
  ].filter(Boolean).join(' ');

  const innerClasses = [innerBackground, innerBorderRadius].filter(Boolean).join(' ');

  return (
    <div 
      className={outerClasses}
      {...props}
    >
      <div className={innerClasses}>
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
  primary: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-green-100"
      gradientTo="to-green-200"
      {...props}
    />
  ),

  // Secondary blue gradient for charts and analytics
  secondary: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-blue-100"
      gradientTo="to-blue-200"
      {...props}
    />
  ),

  // Accent teal gradient for special sections
  accent: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-green-200"
      gradientTo="to-teal-200"
      {...props}
    />
  ),

  // Warning orange gradient for alerts
  warning: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-orange-100"
      gradientTo="to-orange-200"
      {...props}
    />
  ),

  // Success emerald gradient for positive actions
  success: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-emerald-100"
      gradientTo="to-emerald-200"
      {...props}
    />
  ),

  // Subtle gray gradient for neutral content
  neutral: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-gray-100"
      gradientTo="to-gray-200"
      {...props}
    />
  ),

  // Purple gradient for premium features
  premium: (props: GradientCardWrapperProps) => (
    <GradientCardWrapper
      gradientFrom="from-purple-100"
      gradientTo="to-purple-200"
      {...props}
    />
  )
};

export { GradientCardWrapper, GradientCardVariants };
export default GradientCardWrapper;