// Run this in browser console to clear all caches

console.log('🧹 Clearing all caches...');

// Clear all service worker caches
if ('caches' in window) {
  caches.keys().then(names => {
    console.log('Found caches:', names);
    return Promise.all(names.map(name => {
      console.log('Deleting cache:', name);
      return caches.delete(name);
    }));
  }).then(() => {
    console.log('✅ All caches cleared');
  }).catch(err => {
    console.error('Error clearing caches:', err);
  });
}

// Unregister service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('Unregistering service worker:', registration);
      registration.unregister();
    });
  });
}

// Clear localStorage (except auth tokens if you want to stay logged in)
// Uncomment the next line if you want to clear auth too:
// localStorage.clear();
const authKeys = ['access_token', 'refresh_token'];
Object.keys(localStorage).forEach(key => {
  if (!authKeys.includes(key)) {
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
sessionStorage.clear();

console.log('✅ Browser storage cleared');
console.log('🔄 Reloading page...');

// Hard reload
setTimeout(() => {
  window.location.reload(true);
}, 500);

