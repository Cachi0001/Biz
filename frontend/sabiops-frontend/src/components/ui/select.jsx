/**
 * Select Component
 * Simple select dropdown component
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Use both mousedown and touchstart for better mobile support
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: handleToggle,
            isOpen,
            selectedValue: value
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            onSelect: handleSelect
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = ({ children, onClick, isOpen, selectedValue, className = '', ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation ${className}`}
      {...props}
    >
      {React.Children.map(children, child => {
        if (child.type === SelectValue) {
          return React.cloneElement(child, { value: selectedValue });
        }
        return child;
      })}
      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectValue = ({ placeholder = 'Select...', value, children }) => {
  // If there's a selected value, display it
  if (value) {
    return <span>{value}</span>;
  }
  
  // If there are children (like in SelectItem), display them
  if (children) {
    return <span>{children}</span>;
  }
  
  // Otherwise show placeholder
  return <span>{placeholder}</span>;
};

export const SelectContent = ({ children, isOpen, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mobile-select-content">
      <div className="py-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, { onSelect });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const SelectItem = ({ children, value, onSelect, className = '' }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(value);
  };

  const handleTouch = (e) => {
    e.preventDefault();
    onSelect(value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchEnd={handleTouch}
      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none touch-manipulation ${className}`}
    >
      {children}
    </button>
  );
};