import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { cn } from '../../lib/utils';

const MobileDateInput = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className,
  disabled = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (onChange) {
      const dateString = date.toISOString().split('T')[0];
      onChange({ target: { value: dateString } });
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
          className="w-full max-w-xs p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
          style={{
            minWidth: '100%',
            maxWidth: '100vw',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'auto',
            zIndex: 9999
          }}
        >
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="max-w-full"
          />
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