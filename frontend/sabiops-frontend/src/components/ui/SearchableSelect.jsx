import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, X, Search } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  isSearchable = true,
  isLoading = false,
  isDisabled = false,
  isClearable = false,
  className = "",
  type = "default",
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  
  // Generate unique IDs for accessibility
  const selectId = id || `searchable-select-${Math.random().toString(36).substr(2, 9)}`;
  const listboxId = `${selectId}-listbox`;
  const searchInputId = `${selectId}-search`;

  // Format options to ensure they have value and label properties
  const formattedOptions = options.map(option => {
    if (typeof option === 'string' || typeof option === 'number') {
      return { value: option, label: option };
    }
    return {
      value: option.value || option.id,
      label: option.label || option.name || option.value || option.id,
      ...option
    };
  });

  // Filter options based on search term
  const filteredOptions = formattedOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find the selected option object
  const selectedOption = formattedOptions.find(option => option.value === value) || null;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, filteredOptions]);

  const handleOptionSelect = (option) => {
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
  };

  const handleContainerClick = () => {
    if (!isDisabled) {
      setIsOpen(!isOpen);
      if (isSearchable && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Main control */}
      <div
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-label={ariaLabel || placeholder}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        tabIndex={isDisabled ? -1 : 0}
        className={cn(
          "flex items-center justify-between min-h-[44px] px-3 py-2 border rounded-md bg-background cursor-pointer transition-colors",
          "hover:border-gray-400 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
          isOpen && "ring-2 ring-ring ring-offset-2",
          isDisabled && "opacity-50 cursor-not-allowed bg-muted"
        )}
        onClick={handleContainerClick}
        onKeyDown={(e) => {
          if (isDisabled) return;
          
          switch (e.key) {
            case 'Enter':
            case ' ':
              e.preventDefault();
              setIsOpen(!isOpen);
              if (isSearchable && !isOpen) {
                setTimeout(() => inputRef.current?.focus(), 0);
              }
              break;
            case 'ArrowDown':
              e.preventDefault();
              if (!isOpen) {
                setIsOpen(true);
                setHighlightedIndex(0);
              }
              break;
            case 'ArrowUp':
              e.preventDefault();
              if (!isOpen) {
                setIsOpen(true);
                setHighlightedIndex(filteredOptions.length - 1);
              }
              break;
            case 'Escape':
              if (isOpen) {
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
              }
              break;
          }
        }}
      >
        <div className="flex-1 flex items-center min-w-0">
          {isSearchable && isOpen ? (
            <input
              ref={inputRef}
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              className="w-full bg-transparent outline-none text-sm"
              placeholder={selectedOption ? selectedOption.label : placeholder}
              disabled={isDisabled}
              aria-label={`Search ${ariaLabel || placeholder}`}
              aria-autocomplete="list"
              aria-controls={listboxId}
              role="searchbox"
            />
          ) : (
            <span 
              className={cn(
                "text-sm truncate",
                selectedOption ? "text-foreground" : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {isClearable && selectedOption && !isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground" />
          ) : (
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          )}
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={`${ariaLabel || placeholder} options`}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div 
              className="p-3 text-center text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div 
              className="p-3 text-center text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {searchTerm ? `No options found for "${searchTerm}"` : "No options found"}
            </div>
          ) : (
            <div className="py-1">
              {filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-label={option.label}
                  tabIndex={-1}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer transition-colors focus:outline-none",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    option.value === value && "bg-accent text-accent-foreground font-medium"
                  )}
                  onClick={() => handleOptionSelect(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOptionSelect(option);
                    }
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;