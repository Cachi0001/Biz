import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { cn } from '../../lib/utils';
import { Input } from './input';

// Simple error boundary for calendar component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Calendar component error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-center text-sm text-muted-foreground">Calendar unavailable</div>;
    }

    return this.props.children;
  }
}

const MobileDateInput = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className,
  disabled = false,
  useNativeInput = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        } else {
          setSelectedDate(null);
        }
      } catch (error) {
        console.warn('Invalid date value:', value);
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date) => {
    if (!date) return;
    
    setSelectedDate(date);
    if (onChange) {
      const dateString = date.toISOString().split('T')[0];
      onChange({ target: { value: dateString } });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    setIsOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fallback to native date input if there are issues with the calendar
  if (useNativeInput || hasError) {
    return (
      <Input
        ref={inputRef}
        type="date"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("h-12 text-base", className)}
        disabled={disabled}
        {...props}
      />
    );
  }

  return (
    <div className="relative w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12 text-base",
              !selectedDate && "text-muted-foreground",
              className
            )}
            style={{ width: '100%' }}
            disabled={disabled}
            {...props}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 mobile-datepicker-content" 
          align="start"
          side="bottom"
          sideOffset={4}
          style={{
            zIndex: 9999
          }}
        >
          <div className="p-3">
            <ErrorBoundary onError={() => setHasError(true)}>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="max-w-full"
              />
            </ErrorBoundary>
            {selectedDate && (
              <div className="mt-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="w-full"
                >
                  Clear Date
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Hidden native input for form compatibility */}
      <input
        ref={inputRef}
        type="hidden"
        value={value || ''}
        onChange={onChange}
        {...props}
      />
    </div>
  );
};

export default MobileDateInput; 