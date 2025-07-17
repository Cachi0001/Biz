/**
 * Optimized Image Component for SabiOps
 * Provides lazy loading, optimization, and fallback handling
 */

import React, { useState, useRef, useEffect } from 'react';
import { optimizeImageUrl } from '../../utils/performanceOptimizations';

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/placeholder-image.png',
  lazy = true,
  quality = 80,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(lazy ? null : src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, isInView]);

  // Set image source when in view
  useEffect(() => {
    if (isInView && src && !imageSrc) {
      const optimizedSrc = optimizeImageUrl(src, width, height, quality);
      setImageSrc(optimizedSrc);
    }
  }, [isInView, src, imageSrc, width, height, quality]);

  const handleLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback image
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    
    if (onError) {
      onError(e);
    }
  };

  // Placeholder while loading or not in view
  if (!isInView || isLoading) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
        {...props}
      >
        {!isInView && lazy && (
          <div className="text-gray-400 text-xs">Loading...</div>
        )}
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
        style={{ width, height }}
        {...props}
      >
        <div className="text-gray-400 text-xs text-center">
          <div>Image</div>
          <div>Not Found</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  );
};

// Avatar component with optimized image
export const OptimizedAvatar = ({
  src,
  alt,
  size = 40,
  fallbackInitials,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`bg-green-600 text-white flex items-center justify-center rounded-full font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        {...props}
      >
        {fallbackInitials || '?'}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      quality={90}
      {...props}
    />
  );
};

// Product image component
export const ProductImage = ({
  src,
  alt,
  size = 'medium',
  className = '',
  ...props
}) => {
  const sizes = {
    small: { width: 80, height: 80 },
    medium: { width: 200, height: 200 },
    large: { width: 400, height: 400 }
  };

  const { width, height } = sizes[size] || sizes.medium;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover rounded-lg ${className}`}
      fallbackSrc="/product-placeholder.png"
      {...props}
    />
  );
};

export default {
  OptimizedImage,
  OptimizedAvatar,
  ProductImage
};