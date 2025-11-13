# Dark Mode Implementation - Quick Reference

## At a Glance

| Aspect | Status | Details |
|--------|--------|---------|
| Framework | ✅ React 18 | TypeScript + Vite |
| Styling | ✅ Tailwind v3 | Class-based dark mode |
| Colors | ✅ CSS Variables | HSL format, 50+ colors |
| State Management | ✅ Zustand | `useUIStore()` for theme |
| Components | ✅ shadcn/ui | 50+ components, all support dark |
| Theme Switching | ⚠️ 95% Done | Logic exists, no UI control yet |
| Persistence | ✅ localStorage | Theme persists across sessions |
| System Detection | ✅ Implemented | `prefers-color-scheme` supported |

## Key Files (All Absolute Paths)

### Must Know Files
1. **Design System:** `/home/ioan/projects/HaOS/stack/frontend/src/index.css` (424 lines)
   - Light mode variables: lines 10-91
   - Dark mode variables: lines 93-161
   - Custom utilities: lines 199-330

2. **Theme State:** `/home/ioan/projects/HaOS/stack/frontend/src/stores/uiStore.ts` (115 lines)
   - `useUIStore()` hook
   - `setTheme('light' | 'dark' | 'system')`
   - Persists to localStorage

3. **Tailwind Config:** `/home/Ioan/projects/HaOS/stack/frontend/tailwind.config.ts` (229 lines)
   - `darkMode: ["class"]`
   - Color mappings to CSS variables
   - Custom animations

4. **UI Switcher Location:** `/home/ioan/projects/HaOS/stack/frontend/src/components/layout/UserDropdownMenu.tsx` (321 lines)
   - Where theme switcher should be added
   - Currently: Settings, Profile, Logout buttons only

### Component Files to Reference
- Button: `/src/components/ui/button.tsx` - Simple CVA pattern
- Sidebar: `/src/components/layout/Sidebar.tsx` - Advanced dark mode example
- Dialog: `/src/components/ui/dialog.tsx` - Mixed dark: prefix pattern

## Color System at a Glance

### Light Mode (`:root`)
```css
--background: 0 0% 100%;          /* White */
--foreground: 240 10% 3.9%;       /* Very dark */
--primary: 222.2 47.4% 11.2%;     /* Indigo */
--destructive: 0 84.2% 60.2%;     /* Red */
--success: 142.1 76.2% 36.3%;     /* Green */
--warning: 38 92% 50%;            /* Orange */
--info: 217.2 91.2% 59.8%;        /* Blue */
--ai-accent: 271.5 81.3% 55.9%;   /* Purple */
```

### Dark Mode (`.dark`)
```css
--background: 240 10% 3.9%;       /* Very dark */
--foreground: 0 0% 98%;           /* Almost white */
--primary: 0 0% 98%;              /* White */
--success: 142.1 70.6% 45.3%;     /* Brighter green */
--ai-accent: 271.5 81.3% 55.9%;   /* Same (good for dark) */
```

## Theme Switching Code Pattern

### Using the Store
```typescript
import { useUIStore } from '@/stores/uiStore';

function ThemeSwitcher() {
  const { theme, setTheme } = useUIStore();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### What It Does
1. Calls `setTheme('dark')` or `setTheme('light')`
2. Adds/removes 'dark' class to `<html>` element
3. Saves to localStorage key `ui-storage`
4. Tailwind CSS processes `dark:` prefixes automatically
5. CSS variables in `.dark` selector apply

## Component Dark Mode Patterns

### Pattern 1: Semantic Colors Only (No dark: prefix needed)
```typescript
// In button.tsx - uses CSS variables that change with .dark
"bg-primary text-primary-foreground hover:bg-primary/90"
// Works automatically in both modes
```

### Pattern 2: Explicit dark: prefix for specific styles
```typescript
// Glass effect needs different opacity in dark
"bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-white/10"
```

### Pattern 3: Using next-themes (not currently used but available)
```typescript
import { useTheme } from "next-themes"
const { theme } = useTheme()  // Returns 'light', 'dark', or 'system'
```

## CSS Variables Usage in Classes

```tailwindcss
/* In any Tailwind class: */
hsl(var(--primary))              /* Uses primary color variable */
hsl(var(--primary) / 0.5)        /* With opacity */
bg-primary                       /* Expands to: bg-[hsl(var(--primary))] */
text-primary-foreground          /* Semantic color */
dark:bg-white/10                 /* Dark mode explicit override */
```

## Implementation Checklist (Quick)

- [ ] **Add Theme Menu** in UserDropdownMenu.tsx with Moon/Sun icons
- [ ] **Wire to useUIStore()** using `setTheme()` function
- [ ] **Test all Pages** in light and dark modes
- [ ] **Verify Contrast** meets WCAG AA (especially dark mode)
- [ ] **Test Charts/Tables** look good in both modes
- [ ] **Check Images** and icons render correctly
- [ ] **Verify Persistence** by refreshing page
- [ ] **Test System Preference** detection

## Deployment Notes

- No environment variables needed for dark mode
- No backend changes required
- Works in all modern browsers (Chrome 76+, Firefox 67+, Safari 12.1+)
- Zero runtime performance impact
- localStorage key: `ui-storage` (persists across sessions)

## Debugging Tips

**Check current theme in console:**
```javascript
const { theme } = useUIStore.getState();
console.log(theme);  // 'light', 'dark', or 'system'
```

**Force dark mode for testing:**
```javascript
document.documentElement.classList.add('dark');
```

**Force light mode for testing:**
```javascript
document.documentElement.classList.remove('dark');
```

**Check localStorage:**
```javascript
console.log(JSON.parse(localStorage.getItem('ui-storage')));
```

## Component Library Status

**All 50+ shadcn/ui components support dark mode:**
- Core: button, input, card, dialog, form, textarea
- Lists: table, badge, dropdown, menu, navigation
- Complex: kanban, data-table, carousel, calendar
- No additional component updates needed

## Files You Should NOT Modify

- Don't change `/tailwind.config.ts` color definitions (they're perfect)
- Don't duplicate CSS variables (they're already in index.css)
- Don't add new theme libraries (Tailwind + CSS vars is enough)
- Don't use inline styles for colors (use Tailwind classes)

## Files You WILL Modify

1. `/src/components/layout/UserDropdownMenu.tsx` - Add theme switcher
2. Optionally: `/src/pages/Settings/` - Add theme setting
3. Optionally: `/src/pages/profile/` - Add theme setting

## One More Thing

The app **already respects system dark mode preference** when theme is set to 'system':

```typescript
// This is already in uiStore:
if (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
```

Just need to expose it in the UI!

---

## Icons Available

From `lucide-react` (already in dependencies):
- `Moon` - for dark mode toggle
- `Sun` - for light mode toggle
- `Settings` - for settings menu
- `Monitor` - for system preference

```typescript
import { Moon, Sun, Monitor } from 'lucide-react';
```

## Success Criteria

After implementation:
1. User can toggle between light and dark mode
2. All UI changes instantly
3. Theme preference persists across browser refreshes
4. System preference is respected when selected
5. All text readable in both modes
6. Charts visible in both modes
7. Focus indicators visible in both modes
