/**
 * ONBOARDING TEST HELPERS
 *
 * Quick functions to test onboarding flow in browser console.
 *
 * USAGE:
 * 1. Open browser console (F12)
 * 2. Paste this entire file
 * 3. Run test functions:
 *
 * testSalesUser();     // Test sales department flow
 * testDigitalUser();   // Test digital department flow
 * testAdminUser();     // Test admin flow
 * resetOnboarding();   // Clear all onboarding state
 * checkTourTargets();  // Verify all tour targets exist
 */

// ======================
// TEST USER SETUPS
// ======================

window.testSalesUser = async () => {
  console.log('🧪 Setting up SALES user...');

  const { useAuthStore } = await import('/src/stores/authStore.js');
  const store = useAuthStore.getState();

  store.setUser({
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
  console.log('📋 User:', store.user);
  console.log('🔄 Reloading page to start tour...');

  setTimeout(() => location.reload(), 1000);
};

window.testDigitalUser = async () => {
  console.log('🧪 Setting up DIGITAL user...');

  const { useAuthStore } = await import('/src/stores/authStore.js');
  const store = useAuthStore.getState();

  store.setUser({
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
  console.log('📋 User:', store.user);
  console.log('🔄 Reloading page to start tour...');

  setTimeout(() => location.reload(), 1000);
};

window.testAdminUser = async () => {
  console.log('🧪 Setting up ADMIN user...');

  const { useAuthStore } = await import('/src/stores/authStore.js');
  const store = useAuthStore.getState();

  store.setUser({
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
  console.log('📋 User:', store.user);
  console.log('🔄 Reloading page to start tour...');

  setTimeout(() => location.reload(), 1000);
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
      'analytics-nav',
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

window.showSetupCard = async () => {
  console.log('🔄 Showing setup progress card...');

  const { useAuthStore } = await import('/src/stores/authStore.js');
  const store = useAuthStore.getState();

  // Set to sales or digital
  if (!['sales', 'digital'].includes(store.user?.department)) {
    console.warn('⚠️  Current user is not in sales or digital department');
    console.log('💡 Setting department to "sales"...');

    store.setUser({
      ...store.user,
      department: 'sales',
    });
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

window.checkOnboardingState = async () => {
  console.log('📊 Current Onboarding State\n');

  const { useAuthStore } = await import('/src/stores/authStore.js');
  const user = useAuthStore.getState().user;

  const tourCompleted = localStorage.getItem('onboarding-tour-completed');
  const setupDismissed = localStorage.getItem('setup-progress-dismissed');

  console.log('👤 User Info:');
  console.log('  - Name:', user?.first_name, user?.last_name);
  console.log('  - Email:', user?.email);
  console.log('  - Role:', user?.role);
  console.log('  - Department:', user?.department || 'None');
  console.log('  - Setup Completed:', user?.setup_completed);
  console.log('  - Has Profile Picture:', !!user?.profile_picture);

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
// QUICK TIPS
// ======================

window.onboardingHelp = () => {
  console.log(`
🎯 ONBOARDING TEST HELPERS

Quick Commands:
  testSalesUser()       - Test as sales department user
  testDigitalUser()     - Test as digital department user
  testAdminUser()       - Test as admin user

  resetOnboarding()     - Clear all onboarding state
  restartTour()         - Restart the product tour

  checkTourTargets()    - Verify tour targets exist
  listAllTourTargets()  - List all tour elements on page

  showSetupCard()       - Show setup progress card
  hideSetupCard()       - Hide setup progress card

  checkOnboardingState() - Show current state

  onboardingHelp()      - Show this help message

Examples:
  > testSalesUser()
  > checkTourTargets('digital')
  > checkOnboardingState()

📚 Full Documentation:
  - See ONBOARDING_TESTING.md
  - See ONBOARDING_GUIDE.md
  `);
};

// Auto-run help on load
console.log('✅ Onboarding test helpers loaded!');
console.log('💡 Run onboardingHelp() to see available commands');
