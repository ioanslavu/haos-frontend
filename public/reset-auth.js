/**
 * AUTH RESET UTILITY
 *
 * Run this in browser console to restore normal authentication:
 *
 * const script = document.createElement('script');
 * script.src = '/reset-auth.js';
 * document.head.appendChild(script);
 */

(function() {
  'use strict';

  console.log('🔄 Resetting authentication state...');

  // Clear all onboarding-related localStorage
  localStorage.removeItem('onboarding-tour-completed');
  localStorage.removeItem('setup-progress-dismissed');

  // Clear any mock auth data
  localStorage.removeItem('auth-storage');

  // Clear all localStorage (nuclear option)
  // localStorage.clear();

  console.log('✅ Auth state cleared!');
  console.log('🔄 Reloading page...');

  setTimeout(() => {
    location.href = '/auth/login';
  }, 500);
})();
