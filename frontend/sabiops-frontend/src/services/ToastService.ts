/**
 * ToastService - Singleton service for managing toast notifications
 * Features: Queueing, auto-dismiss, max concurrent toasts, brand colors
 */

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  action?: {
    label: string;
    callback: () => void;
  };
  clickAction?: {
    url: string;
    params?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  timestamp: number;
}

type ToastListener = (toasts: ToastData[]) => void;

class ToastService {
  private static instance: ToastService;
  private toasts: ToastData[] = [];
  private listeners: Set<ToastListener> = new Set();
  private queue: ToastData[] = [];
  private isProcessingQueue = false;

  // Configuration
  private readonly MAX_CONCURRENT_TOASTS = 4;
  private readonly DEFAULT_DURATIONS = {
    success: 4000,
    info: 5000,
    warning: 6000,
    error: 8000,
  };

  private readonly BRAND_COLORS = {
    success: {
      primary: '#28a745', // Brand green
      secondary: '#22c55e',
      background: 'hsl(142 76% 36%)',
    },
    error: {
      primary: '#ef4444',
      secondary: '#dc2626',
      background: 'hsl(0 84% 60%)',
    },
    warning: {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: 'hsl(45 93% 47%)',
    },
    info: {
      primary: '#3b82f6',
      secondary: '#2563eb',
      background: 'hsl(217 91% 60%)',
    },
  };

  private constructor() {
    this.startQueueProcessor();
  }

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Subscribe to toast updates
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current toasts
   */
  getToasts(): ToastData[] {
    return [...this.toasts];
  }

  /**
   * Get brand colors for toast types
   */
  getBrandColors() {
    return this.BRAND_COLORS;
  }

  /**
   * Add a toast notification
   */
  addToast(toastData: Omit<ToastData, 'id' | 'timestamp'>): string {
    const toast: ToastData = {
      id: this.generateId(),
      timestamp: Date.now(),
      duration: this.DEFAULT_DURATIONS[toastData.type],
      dismissible: true,
      position: 'top-right',
      ...toastData,
    };

    // If we're at max capacity, queue the toast
    if (this.toasts.length >= this.MAX_CONCURRENT_TOASTS) {
      this.queue.push(toast);
      return toast.id;
    }

    this.showToast(toast);
    return toast.id;
  }

  /**
   * Remove a specific toast
   */
  removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
    this.processQueue();
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts = [];
    this.queue = [];
    this.notifyListeners();
  }

  /**
   * Success toast helper
   */
  success(message: string, options?: Partial<Omit<ToastData, 'id' | 'timestamp' | 'type' | 'message'>>): string {
    return this.addToast({
      type: 'success',
      message,
      ...options,
    });
  }

  /**
   * Error toast helper
   */
  error(message: string, options?: Partial<Omit<ToastData, 'id' | 'timestamp' | 'type' | 'message'>>): string {
    return this.addToast({
      type: 'error',
      message,
      ...options,
    });
  }

  /**
   * Warning toast helper
   */
  warning(message: string, options?: Partial<Omit<ToastData, 'id' | 'timestamp' | 'type' | 'message'>>): string {
    return this.addToast({
      type: 'warning',
      message,
      ...options,
    });
  }

  /**
   * Info toast helper
   */
  info(message: string, options?: Partial<Omit<ToastData, 'id' | 'timestamp' | 'type' | 'message'>>): string {
    return this.addToast({
      type: 'info',
      message,
      ...options,
    });
  }

  /**
   * Show loading toast (infinite duration)
   */
  loading(message: string, options?: Partial<Omit<ToastData, 'id' | 'timestamp' | 'type' | 'message' | 'duration'>>): string {
    return this.addToast({
      type: 'info',
      message,
      duration: 0, // Infinite
      dismissible: false,
      ...options,
    });
  }

  /**
   * Update an existing toast
   */
  updateToast(id: string, updates: Partial<Omit<ToastData, 'id' | 'timestamp'>>): void {
    const toastIndex = this.toasts.findIndex(toast => toast.id === id);
    if (toastIndex !== -1) {
      this.toasts[toastIndex] = { 
        ...this.toasts[toastIndex], 
        ...updates,
        id: this.toasts[toastIndex].id, // Ensure id is preserved
        timestamp: this.toasts[toastIndex].timestamp // Ensure timestamp is preserved
      };
      this.notifyListeners();
    }
  }

  /**
   * Batch operations for performance
   */
  batch(operations: (() => void)[]): void {
    operations.forEach(op => op());
    this.notifyListeners();
  }

  private showToast(toast: ToastData): void {
    this.toasts.unshift(toast); // Add to beginning for newest first

    // Set up auto-dismiss
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }

    this.notifyListeners();
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.toasts.length < this.MAX_CONCURRENT_TOASTS) {
      const nextToast = this.queue.shift();
      if (nextToast) {
        this.showToast(nextToast);
      }
    }
  }

  private startQueueProcessor(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    setInterval(() => {
      this.processQueue();
      this.cleanupExpiredToasts();
    }, 100);
  }

  private cleanupExpiredToasts(): void {
    const now = Date.now();
    const initialLength = this.toasts.length;
    
    this.toasts = this.toasts.filter(toast => {
      // Remove toasts older than 30 seconds (safety cleanup)
      if (now - toast.timestamp > 30000) {
        return false;
      }
      return true;
    });

    // If we removed any toasts, notify listeners and process queue
    if (this.toasts.length !== initialLength) {
      this.notifyListeners();
      this.processQueue();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.toasts]);
      } catch (error) {
        console.error('Error in toast listener:', error);
      }
    });
  }

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus() {
    return {
      activeToasts: this.toasts.length,
      queuedToasts: this.queue.length,
      maxConcurrent: this.MAX_CONCURRENT_TOASTS,
      listeners: this.listeners.size,
    };
  }
}

// Export singleton instance
export const toastService = ToastService.getInstance();

// Convenience exports for direct use
export const showSuccessToast = (message: string, options?: Parameters<typeof toastService.success>[1]) =>
  toastService.success(message, options);

export const showErrorToast = (message: string, options?: Parameters<typeof toastService.error>[1]) =>
  toastService.error(message, options);

export const showWarningToast = (message: string, options?: Parameters<typeof toastService.warning>[1]) =>
  toastService.warning(message, options);

export const showInfoToast = (message: string, options?: Parameters<typeof toastService.info>[1]) =>
  toastService.info(message, options);

export const showLoadingToast = (message: string, options?: Parameters<typeof toastService.loading>[1]) =>
  toastService.loading(message, options);

export default toastService;
