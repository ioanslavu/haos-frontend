/**
 * ONBOARDING TEST HELPERS - Vite Compatible
 *
 * Load this file in console to get testing utilities.
 *
 * USAGE:
 * const script = document.createElement('script');
 * script.src = '/onboarding-test-helpers.js';
 * document.head.appendChild(script);
 */

(function() {
  'use strict';

  console.log('🔧 Loading Onboarding Test Helpers...');

  // ======================
  // DIRECT METHODS (No imports needed)
  // ======================

  /**
   * Create a user and save to localStorage
   * This mimics what the auth store does
   */
  function createMockUser(userData) {
    const user = {
      id: userData.id || 1,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: `${userData.first_name} ${userData.last_name}`,
      role: userData.role || 'employee',
      department: userData.department || null,
      setup_completed: userData.setup_completed ?? false,
      profile_picture: userData.profile_picture || null,
      ...userData,
    };

    // Save to localStorage (this is how Zustand persist works)
    const authState = {
      state: {
        user: user,
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorage.setItem('auth-storage', JSON.stringify(authState));

    return user;
  }

  // ======================
  // TEST USER SETUPS
  // ======================

  window.testSalesUser = () => {
    console.log('🧪 Setting up SALES user...');

    const user = createMockUser({
      id: 1,
      email: 'sales.test@hahahaproduction.com',
      first_name: 'Sales',
      last_name: 'Tester',
      role: 'employee',
      department: 'sales',
      setup_completed: true,
      profile_picture: null,
    });

    localStorage.removeItem('onboarding-tour-completed');
    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ Sales user configured!');
    console.log('📋 User:', user);
    console.log('🔄 Reloading page to start tour...');

    setTimeout(() => location.reload(), 1000);
  };

  window.testDigitalUser = () => {
    console.log('🧪 Setting up DIGITAL user...');

    const user = createMockUser({
      id: 2,
      email: 'digital.test@hahahaproduction.com',
      first_name: 'Digital',
      last_name: 'Tester',
      role: 'employee',
      department: 'digital',
      setup_completed: true,
      profile_picture: 'https://i.pravatar.cc/150?img=5',
    });

    localStorage.removeItem('onboarding-tour-completed');
    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ Digital user configured!');
    console.log('📋 User:', user);
    console.log('🔄 Reloading page to start tour...');

    setTimeout(() => location.reload(), 1000);
  };

  window.testAdminUser = () => {
    console.log('🧪 Setting up ADMIN user...');

    const user = createMockUser({
      id: 3,
      email: 'admin.test@hahahaproduction.com',
      first_name: 'Admin',
      last_name: 'Tester',
      role: 'administrator',
      department: null,
      setup_completed: true,
      profile_picture: null,
    });

    localStorage.removeItem('onboarding-tour-completed');
    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ Admin user configured!');
    console.log('📋 User:', user);
    console.log('🔄 Reloading page to start tour...');

    setTimeout(() => location.reload(), 1000);
  };

  window.testNewUser = () => {
    console.log('🧪 Setting up NEW user (incomplete onboarding)...');

    const user = createMockUser({
      id: 4,
      email: 'newuser@hahahaproduction.com',
      first_name: '',  // Empty - needs to fill form
      last_name: '',
      role: 'employee',
      department: null,
      setup_completed: false,  // NOT completed yet
      profile_picture: null,
    });

    localStorage.removeItem('onboarding-tour-completed');
    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ New user configured!');
    console.log('📋 User:', user);
    console.log('💡 User needs to complete onboarding first at /onboarding');
    console.log('🔄 Navigate to /onboarding...');

    setTimeout(() => window.location.href = '/onboarding', 1000);
  };

  // ======================
  // ONBOARDING RESET
  // ======================

  window.resetOnboarding = () => {
    console.log('🔄 Resetting onboarding state...');

    localStorage.removeItem('onboarding-tour-completed');
    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ Onboarding state cleared!');
    console.log('💡 Reload page to restart tour: location.reload()');
  };

  window.restartTour = () => {
    console.log('🔄 Restarting tour...');
    localStorage.removeItem('onboarding-tour-completed');
    location.reload();
  };

  // ======================
  // TOUR TARGET VERIFICATION
  // ======================

  window.checkTourTargets = (role = 'sales') => {
    console.log(`🔍 Checking tour targets for: ${role}`);

    const targetSets = {
      sales: [
        'dashboard-nav',
        'profile-menu',
        'crm-nav',
        'contracts-nav',
        'entities-nav',
      ],
      digital: [
        'dashboard-nav',
        'profile-menu',
        'catalog-nav',
        'works-nav',
        'recordings-nav',
        'crm-nav',
      ],
      admin: [
        'dashboard-nav',
        'profile-menu',
        'users-nav',
        'roles-nav',
        'settings-nav',
      ],
    };

    const targets = targetSets[role] || targetSets.sales;
    const results = [];

    targets.forEach(target => {
      const element = document.querySelector(`[data-tour="${target}"]`);
      const found = !!element;
      results.push({ target, found, element });

      if (found) {
        console.log(`✅ ${target}`);
      } else {
        console.error(`❌ ${target} NOT FOUND`);
      }
    });

    const foundCount = results.filter(r => r.found).length;
    const totalCount = results.length;

    console.log(`\n📊 Results: ${foundCount}/${totalCount} targets found`);

    if (foundCount < totalCount) {
      console.log('\n⚠️  Missing targets may be on a different page.');
      console.log('   Try navigating to /catalog for works-nav and recordings-nav');
    }

    return results;
  };

  window.listAllTourTargets = () => {
    console.log('📋 All data-tour elements on this page:');

    const elements = document.querySelectorAll('[data-tour]');

    if (elements.length === 0) {
      console.warn('⚠️  No data-tour elements found on this page');
      return [];
    }

    elements.forEach((el, index) => {
      const tourId = el.getAttribute('data-tour');
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent?.trim().substring(0, 50) || '';

      console.log(`${index + 1}. [${tourId}] <${tagName}> "${text}"`);
    });

    console.log(`\n✅ Found ${elements.length} tour targets`);

    return Array.from(elements);
  };

  // ======================
  // SETUP PROGRESS HELPERS
  // ======================

  window.showSetupCard = () => {
    console.log('🔄 Showing setup progress card...');

    // Get current user from localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authState = JSON.parse(authStorage);
      const currentUser = authState.state.user;

      // Set to sales or digital if not already
      if (!['sales', 'digital'].includes(currentUser?.department)) {
        console.warn('⚠️  Current user is not in sales or digital department');
        console.log('💡 Setting department to "sales"...');

        currentUser.department = 'sales';
        authState.state.user = currentUser;
        localStorage.setItem('auth-storage', JSON.stringify(authState));
      }
    }

    localStorage.removeItem('setup-progress-dismissed');

    console.log('✅ Setup card should appear on dashboard');
    console.log('🔄 Navigate to / to see it');

    if (window.location.pathname !== '/') {
      console.log('📍 Navigating to dashboard...');
      setTimeout(() => window.location.href = '/', 500);
    } else {
      location.reload();
    }
  };

  window.hideSetupCard = () => {
    console.log('🔄 Hiding setup card...');
    localStorage.setItem('setup-progress-dismissed', 'true');
    console.log('✅ Setup card dismissed. Reload to confirm: location.reload()');
  };

  // ======================
  // CURRENT STATE INSPECTION
  // ======================

  window.checkOnboardingState = () => {
    console.log('📊 Current Onboarding State\n');

    const authStorage = localStorage.getItem('auth-storage');
    let user = null;

    if (authStorage) {
      try {
        const authState = JSON.parse(authStorage);
        user = authState.state.user;
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }

    const tourCompleted = localStorage.getItem('onboarding-tour-completed');
    const setupDismissed = localStorage.getItem('setup-progress-dismissed');

    console.log('👤 User Info:');
    if (user) {
      console.log('  - Name:', user?.first_name, user?.last_name);
      console.log('  - Email:', user?.email);
      console.log('  - Role:', user?.role);
      console.log('  - Department:', user?.department || 'None');
      console.log('  - Setup Completed:', user?.setup_completed);
      console.log('  - Has Profile Picture:', !!user?.profile_picture);
    } else {
      console.log('  - No user found in localStorage');
    }

    console.log('\n🎯 Tour State:');
    console.log('  - Tour Completed:', tourCompleted === 'true' ? '✅ Yes' : '❌ No');

    console.log('\n📋 Setup Progress:');
    console.log('  - Card Dismissed:', setupDismissed === 'true' ? '✅ Yes' : '❌ No');
    console.log('  - Eligible for Setup Card:', ['sales', 'digital'].includes(user?.department) ? '✅ Yes' : '❌ No');

    return {
      user,
      tourCompleted: tourCompleted === 'true',
      setupDismissed: setupDismissed === 'true',
    };
  };

  // ======================
  // SIMULATE COMPLETE FLOW
  // ======================

  window.simulateSignupFlow = () => {
    console.log('🎬 Simulating complete signup → onboarding → tour flow...\n');

    console.log('Step 1: New user just signed up');
    testNewUser();
    // Will navigate to /onboarding
  };

  window.completeOnboardingStep = (department = 'sales') => {
    console.log(`✅ Completing onboarding step with department: ${department}...`);

    const authStorage = localStorage.getItem('auth-storage');
    let currentUser = null;

    if (authStorage) {
      try {
        const authState = JSON.parse(authStorage);
        currentUser = authState.state.user;
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }

    const user = createMockUser({
      ...(currentUser || {}),
      first_name: currentUser?.first_name || 'Test',
      last_name: currentUser?.last_name || 'User',
      department: department,
      setup_completed: true,
      profile_picture: currentUser?.profile_picture || 'https://i.pravatar.cc/150?img=1',
    });

    console.log('✅ Onboarding completed!');
    console.log('📋 Updated user:', user);
    console.log('🔄 Navigating to dashboard where tour will start...');

    setTimeout(() => window.location.href = '/', 1000);
  };

  // ======================
  // DIRECT AUTH STORE ACCESS (Advanced)
  // ======================

  window.getCurrentUser = () => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authState = JSON.parse(authStorage);
        return authState.state.user;
      } catch (e) {
        console.error('Error getting user:', e);
        return null;
      }
    }
    return null;
  };

  window.setCurrentUser = (updates) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authState = JSON.parse(authStorage);
        authState.state.user = {
          ...authState.state.user,
          ...updates,
        };
        localStorage.setItem('auth-storage', JSON.stringify(authState));
        console.log('✅ User updated:', authState.state.user);
        console.log('💡 Reload to see changes: location.reload()');
        return authState.state.user;
      } catch (e) {
        console.error('Error updating user:', e);
      }
    } else {
      console.error('No auth storage found');
    }
  };

  // ======================
  // QUICK TIPS
  // ======================

  window.onboardingHelp = () => {
    console.log(`
🎯 ONBOARDING TEST HELPERS

Quick Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST USERS (Skip to specific role):
  testSalesUser()       - Test as sales department user
  testDigitalUser()     - Test as digital department user
  testAdminUser()       - Test as admin user
  testNewUser()         - Test as brand new user (incomplete)

COMPLETE FLOW (Full signup → onboarding → tour):
  simulateSignupFlow()          - Start from signup
  completeOnboardingStep('sales')  - Complete onboarding

TOUR CONTROLS:
  resetOnboarding()     - Clear all onboarding state
  restartTour()         - Restart the product tour

VERIFICATION:
  checkTourTargets()    - Verify tour targets exist
  listAllTourTargets()  - List all tour elements on page
  checkOnboardingState() - Show current state

SETUP CARD:
  showSetupCard()       - Show setup progress card
  hideSetupCard()       - Hide setup progress card

ADVANCED:
  getCurrentUser()      - Get current user from localStorage
  setCurrentUser({...}) - Update user properties

HELP:
  onboardingHelp()      - Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Examples:

  🎬 Test complete flow:
    > simulateSignupFlow()
    (Fill onboarding form...)
    > completeOnboardingStep('sales')
    (Tour starts!)

  ⚡ Quick test specific role:
    > testSalesUser()

  🔍 Check what's happening:
    > checkOnboardingState()

  🛠️ Update current user:
    > setCurrentUser({ department: 'digital' })
    > location.reload()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Full Documentation:
  - See COMPLETE_FLOW_TESTING.md
  - See ONBOARDING_TESTING.md
  - See ONBOARDING_GUIDE.md
    `);
  };

  // ======================
  // AUTO-LOAD MESSAGE
  // ======================

  console.log('✅ Onboarding test helpers loaded successfully!');
  console.log('💡 Run onboardingHelp() to see available commands');
  console.log('');
  console.log('Quick start:');
  console.log('  > testSalesUser()        - Jump to sales user + tour');
  console.log('  > testDigitalUser()      - Jump to digital user + tour');
  console.log('  > simulateSignupFlow()   - Test complete signup flow');
  console.log('  > onboardingHelp()       - See all commands');

})();
