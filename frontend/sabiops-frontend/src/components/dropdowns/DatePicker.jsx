// Reusable DatePicker Component - Mobile-Friendly
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

const DatePicker = ({
  value = null,
  onChange,
  placeholder = "Select date",
  disabled = false,
  required = false,
  className = "",
  style = {},
  dateFormat = "yyyy-MM-dd",
  displayFormat = "MMM dd, yyyy",
  minDate = null,
  maxDate = null,
  debugLabel = "",
  onError = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize date from value prop
  useEffect(() => {
    if (value) {
      let date = null;
      
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string') {
        // Try to parse the date string
        date = parse(value, dateFormat, new Date());
        if (!isValid(date)) {
          // Try common date formats
          const commonFormats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd'];
          for (const fmt of commonFormats) {
            date = parse(value, fmt, new Date());
            if (isValid(date)) break;
          }
        }
      }
      
      if (date && isValid(date)) {
        setSelectedDate(date);
        setInputValue(format(date, displayFormat));
        setCurrentMonth(date);
      } else {
        console.warn('Invalid date value provided:', value);
        if (onError) {
          onError(new Error(`Invalid date value: ${value}`));
        }
      }
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [value, dateFormat, displayFormat, onError]);

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setInputValue(format(date, displayFormat));
    setIsOpen(false);
    
    if (onChange) {
      // Return date in the specified format
      const formattedDate = format(date, dateFormat);
      onChange(formattedDate, date);
    }

    if (debugLabel) {
      console.log(`[${debugLabel}] Date selected:`, format(date, dateFormat));
    }
  };

  // Handle input change (manual typing)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Try to parse the typed date
    const date = parse(value, displayFormat, new Date());
    if (isValid(date)) {
      setSelectedDate(date);
      setCurrentMonth(date);
      
      if (onChange) {
        const formattedDate = format(date, dateFormat);
        onChange(formattedDate, date);
      }
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    if (selectedDate) {
      // Ensure input shows the properly formatted date
      setInputValue(format(selectedDate, displayFormat));
    } else if (inputValue.trim() === '') {
      setInputValue('');
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = isDateDisabled(date);
      
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Get input classes
  const getInputClasses = () => {
    const baseClasses = "w-full px-3 py-2 border rounded-md bg-white transition-colors";
    const stateClasses = disabled 
      ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
      : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500";
    
    return `${baseClasses} ${stateClasses} ${className}`;
  };

  // Get calendar position classes for mobile
  const getCalendarClasses = () => {
    const baseClasses = "absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg";
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, position the calendar to fit within viewport
      return `${baseClasses} left-0 right-0 mx-2`;
    } else {
      // On desktop, normal positioning
      return `${baseClasses} w-80`;
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="relative" ref={dropdownRef} style={style}>
      {debugLabel && (
        <div className="text-xs text-gray-500 mb-1">
          Debug: {debugLabel} | Selected: {selectedDate ? format(selectedDate, dateFormat) : 'None'}
        </div>
      )}
      
      {/* Date Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={getInputClasses()}
          readOnly={false} // Allow manual typing
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            tabIndex={-1}
          >
            <Calendar className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={getCalendarClasses()}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90 text-gray-600" />
            </button>
            
            <div className="font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayInfo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => !dayInfo.isDisabled && handleDateSelect(dayInfo.date)}
                  disabled={dayInfo.isDisabled}
                  className={`
                    w-8 h-8 text-sm rounded transition-colors
                    ${dayInfo.isCurrentMonth 
                      ? dayInfo.isSelected
                        ? 'bg-blue-600 text-white'
                        : dayInfo.isToday
                          ? 'bg-blue-100 text-blue-600 font-medium'
                          : dayInfo.isDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-900 hover:bg-gray-100'
                      : 'text-gray-300'
                    }
                  `}
                >
                  {dayInfo.day}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-3 flex justify-between">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                setInputValue('');
                setIsOpen(false);
                if (onChange) {
                  onChange('', null);
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;