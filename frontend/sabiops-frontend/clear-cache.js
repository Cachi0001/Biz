// Simple script to clear localStorage and sessionStorage
if (typeof window !== 'undefined') {
  console.log('Clearing cache...');
  localStorage.clear();
  sessionStorage.clear();
  console.log('Cache cleared');
  
  // Also clear any IndexedDB cache if present
  if ('indexedDB' in window) {
    indexedDB.deleteDatabase('performance-cache');
    indexedDB.deleteDatabase('sabiops-cache');
  }
}
