# Testing the Onboarding Flow (Mock Data)

This guide shows you how to test the complete onboarding system **before backend integration**.

---

## Prerequisites

1. Start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser to `http://localhost:8080`

3. Open browser DevTools (F12) - you'll need the Console

---

## Test Scenario 1: Sales Department User (Complete Flow)

This simulates a new sales user going through the entire onboarding.

### Step 1: Setup Mock User

Open browser console and run:

```javascript
// Import the auth store
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();

// Create a mock sales user who just completed basic onboarding
store.setUser({
  id: 1,
  email: 'sales@hahahaproduction.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'employee',
  department: 'sales',
  setup_completed: true,  // Just finished onboarding
  profile_picture: null,  // No picture yet
});

// Clear tour completion flag
localStorage.removeItem('onboarding-tour-completed');
localStorage.removeItem('setup-progress-dismissed');

// Reload to trigger tour
location.reload();
```

### Step 2: Expected Behavior

After reload, you should see:

1. **Product Tour Starts Automatically**
   - Welcome tooltip appears on Dashboard
   - Shows "Welcome to HaHaHa Production!"
   - Shows step counter "1 of 6" (or similar)

2. **Tour Flow**:
   - Step 1: Dashboard nav highlighted
   - Step 2: Profile menu highlighted
   - Step 3: CRM nav highlighted (sales-specific!)
   - Step 4: Analytics nav highlighted
   - Step 5: Contracts nav highlighted
   - Step 6: Entities nav highlighted

3. **Navigate Through Tour**:
   - Click "Next" to go through each step
   - Click "Back" to go back
   - Click "Skip Tour" to exit early
   - Click "Finish" on last step

### Step 3: Test Setup Progress Card

After tour finishes (or skip it), navigate to Dashboard:

```
http://localhost:8080/
```

**You should see** a "Get Started" card with:
- Progress bar showing 2/5 tasks completed (40%)
- ✅ Complete your profile
- ✅ Join the Sales department
- ⭕ Add your first client (pending)
- ⭕ Create a campaign (pending)
- ⭕ Upload a contract template (pending)

### Step 4: Test Task Actions

Click the action buttons:

1. **"Add Client"** button → Should navigate to `/crm?tab=clients`
2. **"New Campaign"** button → Should navigate to `/crm?tab=campaigns`
3. **"Import Template"** button → Should navigate to `/templates/import`

### Step 5: Simulate Task Completion

In console, update mock stats to complete a task:

```javascript
// Import the setup progress hook (need to do this from React component)
// For now, just verify the task completion logic

// The tasks check these stats:
// - clients_count > 0
// - campaigns_count > 0
// - templates_count > 0

// When you actually create data in the app, the progress should update
```

### Step 6: Test Dismissal

Click the "X" button in top-right of setup card.

**Expected:** Card disappears and doesn't show again (even after refresh).

To reset:
```javascript
localStorage.removeItem('setup-progress-dismissed');
location.reload();
```

---

## Test Scenario 2: Digital Department User

### Setup Digital User

```javascript
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();

store.setUser({
  id: 2,
  email: 'digital@hahahaproduction.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'employee',
  department: 'digital',
  setup_completed: true,
  profile_picture: 'https://i.pravatar.cc/150?img=5',
});

localStorage.removeItem('onboarding-tour-completed');
localStorage.removeItem('setup-progress-dismissed');
location.reload();
```

### Expected Tour Differences

Digital department tour includes:
- Dashboard
- Profile menu
- **Catalog nav** (instead of Analytics)
- **Works nav** (digital-specific!)
- **Recordings nav** (digital-specific!)
- CRM nav

### Expected Setup Tasks

Setup card shows **different tasks**:
- ✅ Complete your profile (already has picture)
- ✅ Join the Digital department
- ⭕ Add your first musical work
- ⭕ Add your first recording
- ⭕ Add an artist to CRM

Progress: **2/5 tasks (40%)**

---

## Test Scenario 3: Admin User

### Setup Admin User

```javascript
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();

store.setUser({
  id: 3,
  email: 'admin@hahahaproduction.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'administrator',
  department: null,  // Admins may not have department
  setup_completed: true,
  profile_picture: null,
});

localStorage.removeItem('onboarding-tour-completed');
location.reload();
```

### Expected Tour Differences

Admin tour includes:
- Dashboard
- Profile menu
- **Users nav** (admin-specific!)
- **Roles nav** (admin-specific!)
- **Settings nav** (admin-specific!)

### Expected Setup Behavior

**No setup card appears** because:
- Setup tasks are only for digital/sales departments
- Admins don't have the setup checklist

---

## Test Scenario 4: User Without Department

### Setup User Without Department

```javascript
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();

store.setUser({
  id: 4,
  email: 'user@hahahaproduction.com',
  first_name: 'Regular',
  last_name: 'User',
  role: 'employee',
  department: null,  // No department yet
  setup_completed: true,
  profile_picture: null,
});

localStorage.removeItem('onboarding-tour-completed');
location.reload();
```

### Expected Behavior

1. **Tour shows:** Default/basic tour (Dashboard, Profile, Contracts, Catalog)
2. **No setup card:** Because department is null

---

## Test Scenario 5: Existing User (No Tour)

### Setup Existing User

```javascript
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();

store.setUser({
  id: 5,
  email: 'existing@hahahaproduction.com',
  first_name: 'Existing',
  last_name: 'User',
  role: 'employee',
  department: 'sales',
  setup_completed: true,
  profile_picture: 'https://i.pravatar.cc/150?img=8',
});

// DO NOT clear tour completion - simulate existing user
// localStorage.removeItem('onboarding-tour-completed'); // SKIP THIS
localStorage.removeItem('setup-progress-dismissed');
location.reload();
```

### Expected Behavior

1. **No tour starts** - User has already completed tour
2. **Setup card appears** - Shows tasks for sales department
3. Progress based on existing data

---

## Manual Tour Testing

### Restart Tour Anytime

You can add a button to manually restart the tour for testing:

1. Open any page component
2. Add this temporarily:

```tsx
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

export default function MyPage() {
  const { startTour, resetTour } = useOnboardingTour();

  return (
    <div>
      {/* Your normal content */}

      {/* TEST BUTTON - Remove before production */}
      <Button
        onClick={resetTour}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
      >
        🔄 Restart Tour
      </Button>
    </div>
  );
}
```

Or use browser console:

```javascript
// Clear and restart
localStorage.removeItem('onboarding-tour-completed');
location.reload();
```

---

## Verify Tour Targets

### Check that all tour targets exist:

Run this in console on Dashboard page:

```javascript
// Sales tour targets
const salesTargets = [
  'dashboard-nav',
  'profile-menu',
  'crm-nav',
  'analytics-nav',
  'contracts-nav',
  'entities-nav',
];

salesTargets.forEach(target => {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (element) {
    console.log(`✅ ${target} found`);
  } else {
    console.error(`❌ ${target} NOT FOUND!`);
  }
});
```

### Check digital tour targets:

```javascript
const digitalTargets = [
  'dashboard-nav',
  'profile-menu',
  'catalog-nav',
  'works-nav',
  'recordings-nav',
  'crm-nav',
];

digitalTargets.forEach(target => {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (element) {
    console.log(`✅ ${target} found`);
  } else {
    console.error(`❌ ${target} NOT FOUND!`);
  }
});
```

**Note:** `works-nav` and `recordings-nav` only exist on the `/catalog` page, not on dashboard!

---

## Test Setup Progress Mock Data

### Current Mock Implementation

Open `src/hooks/useSetupProgress.ts` and look at the mock data:

```typescript
const mockStats: SetupStats = {
  has_profile_picture: !!user.profile_picture,
  has_department: !!user.department,
  setup_completed: user.setup_completed || false,
  clients_count: 0,      // ← All start at 0
  artists_count: 0,
  campaigns_count: 0,
  works_count: 0,
  recordings_count: 0,
  releases_count: 0,
  contracts_count: 0,
  templates_count: 0,
};
```

### Simulate Completed Tasks

To test what happens when tasks complete, **temporarily modify** the mock data:

```typescript
// In src/hooks/useSetupProgress.ts, line ~50
const mockStats: SetupStats = {
  has_profile_picture: true,      // Completed
  has_department: true,            // Completed
  setup_completed: true,           // Completed
  clients_count: 3,                // 🔥 SIMULATE: User has clients
  campaigns_count: 1,              // 🔥 SIMULATE: User has campaign
  templates_count: 0,              // Still pending
  artists_count: 2,                // 🔥 SIMULATE: User has artists
  works_count: 0,
  recordings_count: 0,
  releases_count: 0,
  contracts_count: 0,
};
```

**Reload page** → Setup card should show:
- Progress: 4/5 tasks (80%)
- ✅ Complete profile
- ✅ Join department
- ✅ Add first client (NOW COMPLETE!)
- ✅ Create campaign (NOW COMPLETE!)
- ⭕ Upload template (still pending)

### Test 100% Completion

Set all stats to completed values:

```typescript
const mockStats: SetupStats = {
  has_profile_picture: true,
  has_department: true,
  setup_completed: true,
  clients_count: 1,
  campaigns_count: 1,
  templates_count: 1,    // 🔥 NOW COMPLETE
  artists_count: 1,
  works_count: 1,
  recordings_count: 1,
  releases_count: 1,
  contracts_count: 1,
};
```

**Expected:** Setup card **disappears** because all tasks are complete!

---

## Common Testing Issues

### Issue: Tour doesn't start

**Check:**
```javascript
// In console:
localStorage.getItem('onboarding-tour-completed')
// Should be null for new users

// Check user:
const { useAuthStore } = await import('/src/stores/authStore.js');
useAuthStore.getState().user
// Should have setup_completed: true
```

**Fix:**
```javascript
localStorage.removeItem('onboarding-tour-completed');
location.reload();
```

### Issue: Setup card doesn't show

**Check:**
```javascript
// Department must be 'digital' or 'sales'
const { useAuthStore } = await import('/src/stores/authStore.js');
useAuthStore.getState().user.department

// Dismissed flag:
localStorage.getItem('setup-progress-dismissed')
// Should be null
```

**Fix:**
```javascript
// Set department
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();
store.setUser({ ...store.user, department: 'sales' });

// Clear dismissed flag
localStorage.removeItem('setup-progress-dismissed');
location.reload();
```

### Issue: Tour targets not found

**Check:** Are you on the right page?
- Catalog-specific targets (`works-nav`, `recordings-nav`) only exist on `/catalog` page
- Admin targets (`users-nav`, `roles-nav`) only show for admin users

**Debug:**
```javascript
// List all data-tour elements on page
document.querySelectorAll('[data-tour]').forEach(el => {
  console.log(el.getAttribute('data-tour'), el);
});
```

### Issue: Can't see tour tooltip

**Check:** Z-index might be too low.

**Fix:** Open `src/config/onboarding-tours.ts` and increase:
```typescript
export const tourOptions = {
  styles: {
    options: {
      zIndex: 99999,  // ← Increase this
    },
  },
};
```

---

## Quick Testing Checklist

Use this checklist to verify everything works:

### Product Tour
- [ ] Sales user sees sales-specific tour
- [ ] Digital user sees digital-specific tour
- [ ] Admin user sees admin-specific tour
- [ ] Tour auto-starts for new users
- [ ] Tour doesn't show for existing users
- [ ] All targets are found (no errors)
- [ ] Navigation buttons work (Next, Back, Skip)
- [ ] Tour completes and saves state
- [ ] Tour doesn't restart after completion

### Setup Progress
- [ ] Setup card shows for sales department
- [ ] Setup card shows for digital department
- [ ] Setup card doesn't show for admin
- [ ] Setup card doesn't show for users without department
- [ ] Progress percentage calculates correctly
- [ ] Completed tasks show checkmark
- [ ] Pending tasks show circle
- [ ] Action buttons navigate correctly
- [ ] Dismiss button hides card
- [ ] Card stays hidden after dismiss
- [ ] Card hides when all tasks complete

### Integration
- [ ] Tour and setup card work together
- [ ] No console errors
- [ ] Smooth transitions
- [ ] Mobile responsive (test on small screen)

---

## Video Walkthrough Script

Record yourself testing to verify everything:

1. **Open browser in incognito** (clean slate)
2. **Run sales user setup** (console commands)
3. **Reload page** → Tour starts
4. **Complete tour** → Click through all steps
5. **Navigate to dashboard** → See setup card
6. **Click action buttons** → Verify navigation
7. **Dismiss card** → Verify it hides
8. **Repeat for digital user**
9. **Repeat for admin user**
10. **Check for errors** in console

---

## Next Steps: Backend Integration

Once frontend testing is complete, follow these steps:

1. **Create API endpoint** (see ONBOARDING_GUIDE.md)
2. **Replace mock data** in `useSetupProgress.ts`
3. **Test with real data**
4. **Add WebSocket** for real-time updates (optional)

All the code examples are in `ONBOARDING_GUIDE.md`!

---

**Happy Testing!** 🚀

If you find any issues, they're easy to fix - all config is in the two main files:
- `src/config/onboarding-tours.ts`
- `src/config/setup-tasks.ts`
