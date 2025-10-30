# Complete Signup → Onboarding → Tour Flow Testing

This guide shows you how to test the **entire user journey** from signup to completing onboarding and experiencing the product tour.

---

## Complete User Journey

```
Login/Signup → Profile Setup → Department Selection → Dashboard → Product Tour → Setup Tasks
```

---

## Prerequisites

1. **Start dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser:** `http://localhost:8080`

3. **Load test helpers:**

   Open browser console (F12) and run:
   ```javascript
   const script = document.createElement('script');
   script.src = '/onboarding-test-helpers.js';
   document.head.appendChild(script);
   ```

   You should see:
   ```
   ✅ Onboarding test helpers loaded successfully!
   ```

---

## Method 1: Automated Flow (Recommended)

### Test Complete Flow with One Command

```javascript
// Start the flow
simulateSignupFlow()
```

This will:
1. ✅ Create a new user (incomplete onboarding)
2. ✅ Navigate to `/onboarding`
3. ⏸️ **You manually fill the form**
4. ⏸️ **You manually select department**
5. ✅ Product tour starts automatically
6. ✅ Setup progress card appears

### Follow These Steps:

**After running `simulateSignupFlow()`:**

#### Step 1: You'll be on `/onboarding` page

**Fill the form:**
- First Name: `Test`
- Last Name: `User`
- Profile Picture: (optional - upload one or skip)
- Click **"Continue"** button

**Expected:** Navigate to `/department-selection`

#### Step 2: You'll be on `/department-selection` page

**Choose a department:**
- Click **"Digital"** or **"Sales"** card

**Expected:**
- Request is submitted
- You see "Request Pending" screen

#### Step 3: Manually approve the department

Open console and run:
```javascript
completeOnboardingStep('sales')  // or 'digital'
```

**Expected:**
- Navigate to Dashboard (`/`)
- Product tour starts automatically!
- Tooltip appears on first step

#### Step 4: Complete the tour

- Click **"Next"** through each step
- Or click **"Skip Tour"** to exit
- Or click **"Back"** to go back

**Expected:**
- Tour highlights each navigation item
- Final step shows **"Finish"** button
- After finish, tour is marked complete

#### Step 5: See setup progress card

**On Dashboard:**
- See "Get Started" card
- Shows progress (e.g., 2/5 tasks - 40%)
- Has action buttons for each task

**Click action buttons** to navigate to task pages

---

## Method 2: Manual Step-by-Step (Full Control)

### Step 1: Simulate Fresh Login

Clear all state:
```javascript
localStorage.clear();
sessionStorage.clear();
```

### Step 2: Create New User

```javascript
testNewUser()
```

### Step 3: Navigate to Onboarding

If not already there:
```javascript
window.location.href = '/onboarding'
```

### Step 4: Fill Onboarding Form

**On the page:**
1. Enter first name: `John`
2. Enter last name: `Doe`
3. (Optional) Upload profile picture
4. Click **"Continue"**

### Step 5: Select Department

**On `/department-selection` page:**
1. Click **Digital** or **Sales** card
2. (Optional) Add a message
3. Click **"Submit Request"**

### Step 6: Simulate Approval

In console:
```javascript
completeOnboardingStep('sales')  // Match the department you selected
```

### Step 7: Product Tour Starts

Should automatically start on Dashboard

### Step 8: Complete Tour and Check Setup

Navigate through tour, then check setup card on Dashboard

---

## Method 3: Quick Test (Skip Onboarding Forms)

Jump directly to a completed user:

```javascript
// Sales user with completed onboarding
testSalesUser()

// Digital user with completed onboarding
testDigitalUser()

// Admin user
testAdminUser()
```

**Expected:**
- Page reloads
- Tour starts automatically
- Setup card appears (sales/digital only)

---

## Testing Different Scenarios

### Scenario 1: Sales Department User

```javascript
// Start flow
simulateSignupFlow()

// Fill onboarding form...
// Select "Sales" department...

// Approve department
completeOnboardingStep('sales')
```

**Expected Tour Steps:**
1. Dashboard nav
2. Profile menu
3. CRM nav
4. Analytics nav (sales-specific!)
5. Contracts nav
6. Entities nav

**Expected Setup Tasks:**
- Complete profile ✅
- Join department ✅
- Add first client ⭕
- Create campaign ⭕
- Upload template ⭕

### Scenario 2: Digital Department User

```javascript
simulateSignupFlow()
// ... fill forms ...
completeOnboardingStep('digital')
```

**Expected Tour Steps:**
1. Dashboard nav
2. Profile menu
3. Catalog nav (digital-specific!)
4. Works nav (digital-specific!)
5. Recordings nav (digital-specific!)
6. CRM nav

**Expected Setup Tasks:**
- Complete profile ✅
- Join department ✅
- Add first work ⭕
- Add first recording ⭕
- Add artist to CRM ⭕

### Scenario 3: User Changes Department

```javascript
// Start as sales
testSalesUser()

// Later, change to digital
const { useAuthStore } = await import('/src/stores/authStore.js');
const store = useAuthStore.getState();
store.setUser({ ...store.user, department: 'digital' });

resetOnboarding()
location.reload()
```

**Expected:**
- New tour for digital department
- Different setup tasks

---

## Verify Each Step Works

### ✅ Onboarding Form Page (`/onboarding`)

**Check:**
- [ ] Form fields render correctly
- [ ] First name is required
- [ ] Last name is required
- [ ] Profile picture upload works
- [ ] "Continue" button is enabled when form valid
- [ ] Navigation to department selection works

**Test:**
```javascript
// Navigate to page
window.location.href = '/onboarding'

// Check page elements
document.querySelector('input[name="first_name"]')  // Should exist
document.querySelector('input[name="last_name"]')   // Should exist
document.querySelector('input[type="file"]')        // Should exist
```

### ✅ Department Selection Page (`/department-selection`)

**Check:**
- [ ] Two department cards show (Digital, Sales)
- [ ] Click opens request dialog
- [ ] Can add optional message
- [ ] Submit button works
- [ ] Shows pending state after submission

**Test:**
```javascript
// Navigate to page
window.location.href = '/department-selection'

// Check elements exist
document.querySelectorAll('.card').length >= 2  // Department cards
```

### ✅ Product Tour

**Check:**
- [ ] Auto-starts for new users
- [ ] Doesn't start for existing users
- [ ] All tour targets are found
- [ ] Navigation buttons work
- [ ] Progress counter shows
- [ ] Completion saves to localStorage

**Test:**
```javascript
// Check tour hasn't run
localStorage.getItem('onboarding-tour-completed')  // Should be null for new users

// Check tour targets
checkTourTargets('sales')  // All should be found

// Verify no console errors
console.log('Check for errors above')
```

### ✅ Setup Progress Card

**Check:**
- [ ] Shows on Dashboard for sales/digital
- [ ] Doesn't show for admin
- [ ] Progress percentage is correct
- [ ] Completed tasks have checkmarks
- [ ] Action buttons navigate correctly
- [ ] Dismiss button hides card
- [ ] Card stays hidden after dismiss

**Test:**
```javascript
// Navigate to dashboard
window.location.href = '/'

// Check if card exists
document.querySelector('[data-tour="setup-progress-card"]')  // May not exist if dismissed

// Show card
showSetupCard()
```

---

## Common Testing Workflows

### Workflow 1: Test Sales Onboarding (5 mins)

```javascript
// 1. Start fresh
simulateSignupFlow()

// 2. Fill onboarding form manually
// (First: Test, Last: User, click Continue)

// 3. Select Sales department
// (Click Sales card, Submit)

// 4. Approve in console
completeOnboardingStep('sales')

// 5. Complete tour
// (Click Next through all steps)

// 6. Test setup tasks
// (Click action buttons, verify navigation)

// 7. Check state
checkOnboardingState()
```

### Workflow 2: Test Digital Onboarding (5 mins)

Same as above, but use `completeOnboardingStep('digital')`

### Workflow 3: Quick Role Testing (1 min each)

```javascript
// Sales
testSalesUser()
// → Tour starts, check steps, dismiss

// Digital
testDigitalUser()
// → Different tour, check steps, dismiss

// Admin
testAdminUser()
// → Admin tour, no setup card
```

---

## Troubleshooting

### Issue: "testSalesUser is not defined"

**Cause:** Test helpers not loaded

**Fix:**
```javascript
const script = document.createElement('script');
script.src = '/onboarding-test-helpers.js';
document.head.appendChild(script);

// Wait 1 second, then try again
setTimeout(() => testSalesUser(), 1000);
```

### Issue: Tour doesn't start after onboarding

**Check:**
```javascript
checkOnboardingState()
```

**Expected:**
- `setup_completed: true`
- `tourCompleted: false`

**Fix:**
```javascript
resetOnboarding()
location.reload()
```

### Issue: Setup card doesn't show

**Check department:**
```javascript
const { useAuthStore } = await import('/src/stores/authStore.js');
useAuthStore.getState().user.department
// Should be 'sales' or 'digital'
```

**Fix:**
```javascript
showSetupCard()
```

### Issue: Can't complete onboarding form

**Check:**
- All required fields filled?
- Form validation passing?

**Skip to end:**
```javascript
completeOnboardingStep('sales')
```

### Issue: Department request stuck on pending

**This is expected!** In production, admin/manager approves.

**For testing, approve manually:**
```javascript
completeOnboardingStep('sales')  // or 'digital'
```

---

## Test Data Reference

### Mock Users

**Sales User:**
```javascript
{
  id: 1,
  email: 'sales.test@hahahaproduction.com',
  first_name: 'Sales',
  last_name: 'Tester',
  role: 'employee',
  department: 'sales',
  setup_completed: true,
}
```

**Digital User:**
```javascript
{
  id: 2,
  email: 'digital.test@hahahaproduction.com',
  first_name: 'Digital',
  last_name: 'Tester',
  role: 'employee',
  department: 'digital',
  setup_completed: true,
  profile_picture: 'https://i.pravatar.cc/150?img=5',
}
```

**Admin User:**
```javascript
{
  id: 3,
  email: 'admin.test@hahahaproduction.com',
  first_name: 'Admin',
  last_name: 'Tester',
  role: 'administrator',
  department: null,
  setup_completed: true,
}
```

**New User (Incomplete):**
```javascript
{
  id: 4,
  email: 'newuser@hahahaproduction.com',
  first_name: 'New',
  last_name: 'User',
  role: 'employee',
  department: null,
  setup_completed: false,  // ← Not complete!
}
```

---

## Quick Command Reference

```javascript
// === COMPLETE FLOW ===
simulateSignupFlow()              // Start from signup
completeOnboardingStep('sales')   // Finish onboarding

// === QUICK TESTS ===
testSalesUser()                   // Jump to sales user
testDigitalUser()                 // Jump to digital user
testAdminUser()                   // Jump to admin
testNewUser()                     // Jump to new user

// === VERIFICATION ===
checkOnboardingState()            // See current state
checkTourTargets('sales')         // Verify tour targets
listAllTourTargets()              // List all tour targets

// === RESET ===
resetOnboarding()                 // Clear onboarding state
restartTour()                     // Restart product tour

// === SETUP CARD ===
showSetupCard()                   // Show setup card
hideSetupCard()                   // Hide setup card

// === HELP ===
onboardingHelp()                  // Show all commands
```

---

## Video Recording Checklist

If recording a demo:

1. [ ] Start in incognito window (clean state)
2. [ ] Load test helpers in console
3. [ ] Run `simulateSignupFlow()`
4. [ ] Fill onboarding form
5. [ ] Select department
6. [ ] Approve with `completeOnboardingStep('sales')`
7. [ ] Complete product tour
8. [ ] Show setup progress card
9. [ ] Click task action buttons
10. [ ] Dismiss setup card
11. [ ] Restart tour with `restartTour()`

---

## Next Steps

After testing is complete:

1. ✅ Frontend onboarding flow works
2. ✅ Product tours work for all roles
3. ✅ Setup progress tracker works
4. 🔄 Implement backend API (when ready)
5. 🔄 Replace mock data with real stats

See `ONBOARDING_GUIDE.md` for backend integration specs!

---

**Need Help?**

Run `onboardingHelp()` in console for quick reference!
