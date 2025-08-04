// Virtual scrolling component for large dropdown datasets
import React, { useState, useRef, useCallback, useMemo } from 'react';

const VirtualizedDropdown = ({
  items = [],
  renderItem,
  itemHeight = 40,
  containerHeight = 200,
  overscan = 5,
  onSelect,
  searchTerm = '',
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(
      filteredItems.length,
      start + visibleCount + overscan * 2
    );
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, filteredItems.length]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Handle item selection
  const handleItemClick = useCallback((item, index) => {
    if (onSelect) {
      onSelect(item, index);
    }
  }, [onSelect]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return filteredItems.slice(visibleRange.start, visibleRange.end);
  }, [filteredItems, visibleRange]);

  // Total height of all items
  const totalHeight = filteredItems.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  if (filteredItems.length === 0) {
    return (
      <div className={`p-3 text-center text-gray-500 ${className}`}>
        {searchTerm ? `No items found matching "${searchTerm}"` : 'No items available'}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={item.id || actualIndex}
                style={{ height: itemHeight }}
                onClick={() => handleItemClick(item, actualIndex)}
                className="cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {renderItem ? renderItem(item, actualIndex) : (
                  <div className="px-3 py-2 flex items-center">
                    <span className="truncate">{item.name || item.label || 'Unknown Item'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedDropdown;