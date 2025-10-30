# Onboarding System Documentation

This guide explains how the onboarding system works and how to extend it with new tours and tasks.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Adding a New Product Tour](#adding-a-new-product-tour)
4. [Adding Setup Tasks](#adding-setup-tasks)
5. [Adding Tour Targets to Components](#adding-tour-targets-to-components)
6. [Customizing Tour Appearance](#customizing-tour-appearance)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The onboarding system consists of two main features:

### 1. **Interactive Product Tours**
- Guided walkthroughs for new users
- Role-specific tours (Admin, Digital, Sales)
- Built with `react-joyride` library
- Automatic on first login, can be restarted manually

### 2. **Setup Progress Tracker**
- Checklist of onboarding tasks
- Only for Digital and Sales departments
- Tracks progress with backend stats
- Dismissible card shown on dashboard

---

## Architecture

### File Structure

```
frontend/
├── src/
│   ├── config/
│   │   ├── onboarding-tours.ts      # Tour step definitions
│   │   └── setup-tasks.ts           # Setup task definitions
│   ├── hooks/
│   │   ├── useOnboardingTour.ts     # Tour state management
│   │   └── useSetupProgress.ts      # Setup progress logic
│   ├── components/
│   │   └── onboarding/
│   │       ├── ProductTour.tsx      # Tour component
│   │       └── SetupProgressCard.tsx # Progress tracker
│   └── ONBOARDING_GUIDE.md          # This file
```

### Data Flow

1. **User logs in** → Check if `setup_completed` is true
2. **If new user** → Show product tour based on role/department
3. **If digital/sales** → Show setup progress card on dashboard
4. **User completes tasks** → Progress updates automatically
5. **All tasks done** → Setup card hides, tour marked complete

---

## Adding a New Product Tour

### Step 1: Define Tour Steps

Edit `src/config/onboarding-tours.ts`:

```typescript
// Add your new tour steps
const marketingTourSteps: Step[] = [
  ...commonSteps, // Include shared steps
  {
    target: '[data-tour="campaigns-nav"]',
    content: 'Create and manage marketing campaigns here',
    title: 'Campaigns',
    placement: 'right',
  },
  {
    target: '[data-tour="analytics-nav"]',
    content: 'Track campaign performance and ROI',
    title: 'Analytics',
    placement: 'right',
  },
  // Add more steps...
];
```

### Step 2: Register the Tour

Add to the `onboardingTours` object:

```typescript
export const onboardingTours: Record<UserRole, Step[]> = {
  admin: adminTourSteps,
  digital: digitalTourSteps,
  sales: salesTourSteps,
  marketing: marketingTourSteps, // NEW
  default: defaultTourSteps,
};
```

### Step 3: Update User Role Type

Update the `UserRole` type:

```typescript
export type UserRole = 'admin' | 'digital' | 'sales' | 'marketing' | 'default';
```

### Step 4: Update getTourForUser Function

Modify the function to handle the new role:

```typescript
export const getTourForUser = (
  role?: string,
  department?: string
): Step[] => {
  if (role === 'admin') return onboardingTours.admin;
  if (department === 'digital') return onboardingTours.digital;
  if (department === 'sales') return onboardingTours.sales;
  if (department === 'marketing') return onboardingTours.marketing; // NEW

  return onboardingTours.default;
};
```

---

## Adding Setup Tasks

### Step 1: Define Tasks

Edit `src/config/setup-tasks.ts`:

```typescript
const marketingSetupTasks: SetupTask[] = [
  {
    id: 'complete_profile',
    label: 'Complete your profile',
    description: 'Add your name and profile picture',
    category: 'profile',
    checkCompletion: (stats) => stats.setup_completed,
    actionLabel: 'Edit Profile',
    actionPath: '/profile',
    priority: 1,
  },
  {
    id: 'create_first_campaign',
    label: 'Create your first campaign',
    description: 'Set up a marketing campaign',
    category: 'content',
    checkCompletion: (stats) => stats.campaigns_count > 0,
    actionLabel: 'New Campaign',
    actionPath: '/campaigns/create',
    priority: 2,
  },
  // Add more tasks...
];
```

### Step 2: Add Stats Interface

If you need new stats, update the `SetupStats` interface:

```typescript
export interface SetupStats {
  // Existing stats...
  campaigns_count: number;

  // Add new ones:
  marketing_materials_count: number; // NEW
  email_templates_count: number;    // NEW
}
```

### Step 3: Register Tasks

Add to `setupTasksByDepartment`:

```typescript
export const setupTasksByDepartment: Record<string, SetupTask[]> = {
  digital: digitalSetupTasks,
  sales: salesSetupTasks,
  marketing: marketingSetupTasks, // NEW
};
```

### Step 4: Update Backend API

**Important:** Ensure your backend API returns the new stats:

```python
# In your Django view
@api_view(['GET'])
def get_setup_stats(request):
    user = request.user
    return Response({
        'has_profile_picture': bool(user.profile_picture),
        'campaigns_count': Campaign.objects.filter(user=user).count(),
        'marketing_materials_count': Material.objects.filter(user=user).count(),
        # ... etc
    })
```

---

## Adding Tour Targets to Components

Tour steps target elements using `data-tour` attributes.

### Example: Sidebar Navigation

```tsx
<NavLink
  to="/contracts"
  data-tour="contracts-nav"  // Tour will highlight this
  className="nav-link"
>
  Contracts
</NavLink>
```

### Example: Page Element

```tsx
<Button
  data-tour="create-contract"  // Tour will point to this button
  onClick={handleCreate}
>
  Create Contract
</Button>
```

### Example: Card or Section

```tsx
<Card data-tour="analytics-card" className="...">
  <CardHeader>Analytics</CardHeader>
  ...
</Card>
```

### Best Practices

1. **Use descriptive names:** `create-contract` not `button-1`
2. **Be consistent:** `{feature}-nav` for navigation, `{action}-button` for buttons
3. **Keep unique:** Don't reuse the same `data-tour` ID
4. **Document in code:** Add a comment explaining what step uses it

```tsx
{/* data-tour="contracts-nav" - Used in admin & sales onboarding tours */}
<NavLink to="/contracts" data-tour="contracts-nav">Contracts</NavLink>
```

---

## Customizing Tour Appearance

### Tour Styles

Edit `src/config/onboarding-tours.ts` → `tourOptions.styles`:

```typescript
export const tourOptions = {
  styles: {
    options: {
      primaryColor: 'hsl(var(--primary))',  // Button color
      zIndex: 10000,                          // Layer priority
    },
    tooltip: {
      borderRadius: 'var(--radius)',  // Match app theme
      fontSize: '14px',
    },
    buttonNext: {
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: 'var(--radius)',
    },
  },
};
```

### Custom Tooltip Component

Edit `src/components/onboarding/ProductTour.tsx` → `CustomTooltip`:

```tsx
const CustomTooltip: React.FC<TooltipRenderProps> = ({
  step,
  primaryProps,
  // ... other props
}) => {
  return (
    <div className="bg-card border rounded-lg p-4">
      {/* Customize layout here */}
      <h3>{step.title}</h3>
      <p>{step.content}</p>
      <Button {...primaryProps}>Next</Button>
    </div>
  );
};
```

---

## Testing

### Test Product Tour

1. **Clear tour completion:**
   ```javascript
   localStorage.removeItem('onboarding-tour-completed');
   ```

2. **Refresh page** - Tour should auto-start

3. **Manually start tour:**
   ```tsx
   import { useOnboardingTour } from '@/hooks/useOnboardingTour';

   const { startTour } = useOnboardingTour();

   <Button onClick={startTour}>Restart Tour</Button>
   ```

### Test Setup Progress

1. **Clear dismissal:**
   ```javascript
   localStorage.removeItem('setup-progress-dismissed');
   ```

2. **Check user department:**
   - Must be `digital` or `sales`
   - Update user object in auth store if needed

3. **Verify stats:**
   - Check mock data in `useSetupProgress.ts`
   - Replace with real API calls for production

### Test Different Roles

```typescript
// In browser console:
const { useAuthStore } = await import('@/stores/authStore');
const store = useAuthStore.getState();

// Change role
store.setUser({ ...store.user, department: 'sales' });

// Reload to see sales tour
location.reload();
```

---

## Troubleshooting

### Tour doesn't start

**Check:**
- User has `setup_completed: true`
- `localStorage.getItem('onboarding-tour-completed')` is `null`
- User role/department matches a tour
- Tour steps array is not empty

**Fix:**
```javascript
// Force tour to start
const { startTour } = useOnboardingTour();
startTour();
```

### Tour targets not found

**Check:**
- `data-tour` attributes exist on target elements
- Targets are visible when tour runs (not hidden/collapsed)
- Selectors match exactly: `[data-tour="contracts-nav"]`

**Fix:**
Add `disableBeacon: true` to skip pulsing beacon if element isn't ready

### Setup card not showing

**Check:**
- User department is `digital` or `sales`
- `localStorage.getItem('setup-progress-dismissed')` is `null`
- At least one task is incomplete
- Component is imported in Dashboard

**Fix:**
```typescript
// Force show card
const { shouldShowSetup } = useSetupProgress();
console.log('Should show setup:', shouldShowSetup);
```

### Tasks not completing

**Check:**
- `SetupStats` interface matches backend response
- `checkCompletion` function logic is correct
- Stats are being fetched (not using stale mock data)

**Fix:**
```typescript
// Debug stats
const { stats } = useSetupProgress();
console.log('Current stats:', stats);
```

---

## Backend Integration Checklist

Currently using **mock data**. For production:

### 1. Create API Endpoint

```python
# backend/api/views.py
@api_view(['GET'])
def get_setup_stats(request):
    user = request.user
    return Response({
        'has_profile_picture': bool(user.profile_picture),
        'has_department': bool(user.department),
        'setup_completed': user.setup_completed,
        'clients_count': Client.objects.filter(created_by=user).count(),
        'works_count': Work.objects.filter(created_by=user).count(),
        # ... etc
    })
```

### 2. Add URL Route

```python
# backend/api/urls.py
urlpatterns = [
    path('users/me/setup-stats/', views.get_setup_stats),
]
```

### 3. Update Hook

```typescript
// src/hooks/useSetupProgress.ts
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/v1/users/me/setup-stats/');
    const data = await response.json();
    setStats(data);
    setIsLoading(false);
  };
  fetchStats();
}, [user]);
```

### 4. Store Preferences

Update backend to save:
- `onboarding_tour_completed` (boolean)
- `setup_progress_dismissed` (boolean)

```python
# models.py
class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    onboarding_tour_completed = models.BooleanField(default=False)
    setup_progress_dismissed = models.BooleanField(default=False)
```

---

## Quick Reference

### Add a New Tour Step

```typescript
// src/config/onboarding-tours.ts
{
  target: '[data-tour="my-feature"]',
  content: 'This is my new feature',
  title: 'My Feature',
  placement: 'right',
}
```

### Add a New Setup Task

```typescript
// src/config/setup-tasks.ts
{
  id: 'my_task',
  label: 'Complete my task',
  description: 'Do something important',
  category: 'content',
  checkCompletion: (stats) => stats.my_count > 0,
  actionPath: '/my-feature/create',
  priority: 3,
}
```

### Add a Tour Target

```tsx
<Button data-tour="my-feature">Click Me</Button>
```

### Force Show Tour

```javascript
localStorage.removeItem('onboarding-tour-completed');
location.reload();
```

### Force Show Setup Card

```javascript
localStorage.removeItem('setup-progress-dismissed');
location.reload();
```

---

## Need Help?

- **Tour library docs:** [react-joyride documentation](https://docs.react-joyride.com/)
- **Code comments:** Inline documentation in all config files
- **Examples:** Look at existing tours in `onboarding-tours.ts`
- **Stack:** File an issue or ask the team

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
