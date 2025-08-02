import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Mobile-friendly button group that arranges buttons side by side
 * If odd number of buttons, the last one is centered
 */
export const MobileButtonGroup = ({ children, className, ...props }) => {
  const buttons = React.Children.toArray(children);
  const isOdd = buttons.length % 2 === 1;
  
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {/* Paired buttons */}
      <div className="grid grid-cols-2 gap-3">
        {buttons.slice(0, isOdd ? buttons.length - 1 : buttons.length).map((button, index) => (
          <div key={index} className="w-full">
            {React.cloneElement(button, {
              className: cn(
                button.props.className,
                "w-full h-11 text-sm font-medium"
              )
            })}
          </div>
        ))}
      </div>
      
      {/* Last button centered if odd */}
      {isOdd && (
        <div className="flex justify-center">
          <div className="w-1/2">
            {React.cloneElement(buttons[buttons.length - 1], {
              className: cn(
                buttons[buttons.length - 1].props.className,
                "w-full h-11 text-sm font-medium"
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Mobile-friendly card with improved spacing
 */
export const MobileCard = ({ children, className, compact = false, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        compact ? "p-3" : "p-4",
        "hover:shadow-md transition-all duration-200 hover:border-green-300",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Mobile-friendly grid that automatically handles 2x2 layout
 */
export const MobileGrid = ({ children, className, ...props }) => {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Mobile-friendly form field with proper spacing
 */
export const MobileFormField = ({ label, children, required = false, className, ...props }) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="w-full">
        {React.cloneElement(children, {
          className: cn(
            children.props.className,
            "w-full h-11 text-base px-3 rounded-md border border-gray-300",
            "focus:ring-2 focus:ring-green-500 focus:border-green-500",
            "transition-colors duration-200"
          )
        })}
      </div>
    </div>
  );
};

/**
 * Mobile-friendly stats card
 */
export const MobileStatsCard = ({ title, value, icon: Icon, color = "blue", className, ...props }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600", 
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600"
  };

  return (
    <MobileCard compact className={cn("", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex-shrink-0 ml-2">
            <Icon className={cn("h-6 w-6", colorClasses[color])} />
          </div>
        )}
      </div>
    </MobileCard>
  );
};

/**
 * Mobile-friendly section header
 */
export const MobileSectionHeader = ({ title, subtitle, children, className, ...props }) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4", className)} {...props}>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Responsive container with proper mobile padding
 */
export const MobileContainer = ({ children, className, ...props }) => {
  return (
    <div className={cn("px-4 sm:px-6 lg:px-8", className)} {...props}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default {
  MobileButtonGroup,
  MobileCard,
  MobileGrid,
  MobileFormField,
  MobileStatsCard,
  MobileSectionHeader,
  MobileContainer
};
