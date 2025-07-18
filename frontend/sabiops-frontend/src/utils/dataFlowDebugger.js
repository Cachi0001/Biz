/**
 * Data Flow Debugger - Utility for testing and debugging data updates
 * Helps verify that events are being dispatched and received correctly
 */

class DataFlowDebugger {
  constructor() {
    this.events = [];
    this.listeners = new Map();
    this.isListening = false;
  }

  /**
   * Start listening to all data update events
   */
  startListening() {
    if (this.isListening) return;
    
    const eventTypes = [
      'salesUpdated',
      'expenseUpdated', 
      'invoiceUpdated',
      'customerUpdated',
      'productUpdated',
      'dataUpdated'
    ];

    eventTypes.forEach(eventType => {
      const handler = (event) => {
        this.logEvent(eventType, event.detail);
      };
      
      window.addEventListener(eventType, handler);
      this.listeners.set(eventType, handler);
    });

    this.isListening = true;
    console.log('[DataFlowDebugger] Started listening to data update events');
  }

  /**
   * Stop listening to events
   */
  stopListening() {
    if (!this.isListening) return;

    this.listeners.forEach((handler, eventType) => {
      window.removeEventListener(eventType, handler);
    });

    this.listeners.clear();
    this.isListening = false;
    console.log('[DataFlowDebugger] Stopped listening to data update events');
  }

  /**
   * Log an event
   */
  logEvent(eventType, detail) {
    const event = {
      type: eventType,
      detail,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    };

    this.events.push(event);
    console.log(`[DataFlowDebugger] Event: ${eventType}`, event);

    // Keep only last 50 events
    if (this.events.length > 50) {
      this.events = this.events.slice(-50);
    }
  }

  /**
   * Get all logged events
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType) {
    return this.events.filter(event => event.type === eventType);
  }

  /**
   * Clear all logged events
   */
  clearEvents() {
    this.events = [];
    console.log('[DataFlowDebugger] Events cleared');
  }

  /**
   * Test event dispatching
   */
  testEventDispatch(eventType, testData = {}) {
    const detail = {
      ...testData,
      test: true,
      timestamp: new Date().toISOString()
    };

    console.log(`[DataFlowDebugger] Testing event dispatch: ${eventType}`, detail);
    window.dispatchEvent(new CustomEvent(eventType, { detail }));
  }

  /**
   * Generate a summary report
   */
  generateReport() {
    const report = {
      totalEvents: this.events.length,
      eventTypes: {},
      recentEvents: this.events.slice(-10),
      isListening: this.isListening
    };

    this.events.forEach(event => {
      if (!report.eventTypes[event.type]) {
        report.eventTypes[event.type] = 0;
      }
      report.eventTypes[event.type]++;
    });

    console.log('[DataFlowDebugger] Report:', report);
    return report;
  }

  /**
   * Test the complete data flow
   */
  async testDataFlow() {
    console.log('[DataFlowDebugger] Starting data flow test...');
    
    // Test each event type
    const testEvents = [
      { type: 'salesUpdated', data: { sale: { id: 'test-1', amount: 100 } } },
      { type: 'expenseUpdated', data: { expense: { id: 'test-2', amount: 50 } } },
      { type: 'dataUpdated', data: { type: 'test', action: 'created' } }
    ];

    for (const testEvent of testEvents) {
      this.testEventDispatch(testEvent.type, testEvent.data);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    console.log('[DataFlowDebugger] Data flow test completed');
    return this.generateReport();
  }
}

// Create global instance
const dataFlowDebugger = new DataFlowDebugger();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.dataFlowDebugger = dataFlowDebugger;
}

export default dataFlowDebugger;