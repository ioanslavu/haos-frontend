# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

This is a React-based ERP system for record labels, built with Vite and TypeScript. The application follows a single-page architecture with React Router for navigation and server-side OAuth authentication.

### Tech Stack
- **Build/Dev**: Vite with React SWC plugin
- **UI Framework**: React 18 with TypeScript
- **Component Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom HSL-based design system
- **Routing**: React Router DOM with protected routes
- **State Management**: Zustand for auth and UI state
- **Data Fetching**: TanStack Query with auth-aware defaults
- **Authentication**: Server-side Google OAuth with session cookies
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with CSRF protection
- **Rich Editors**: Monaco Editor (code), Lexical (rich text)
- **Visualization**: Recharts, Nivo, React Flow

### Project Structure
```
src/
├── api/           # API client, endpoints, and hooks
│   ├── client.ts  # Axios instance with interceptors
│   └── hooks/     # TanStack Query hooks
├── components/
│   ├── ui/        # shadcn/ui components
│   ├── layout/    # App layout (Sidebar, TopBar, AppLayout)
│   └── auth/      # Auth components (ProtectedRoute, PermissionGate)
├── pages/         # Route components with modular structure
│   ├── auth/      # Login, AuthCallback
│   │   └── components/
│   ├── dashboard/
│   │   └── components/
│   └── [other pages]/
├── providers/     # React providers (QueryProvider, AuthProvider)
├── stores/        # Zustand stores (authStore, uiStore)
├── services/      # Business logic services
├── hooks/         # Custom React hooks
├── lib/           # Utilities and constants
└── main.tsx       # Entry point
```

### Key Architectural Patterns

1. **Layout**: Three-panel layout with collapsible sidebar, main content area, and insights panel
2. **Routing**: Protected routes with `<ProtectedRoute>` wrapper, public routes for auth
3. **Authentication**: Server-side OAuth flow, session-based with cookie auth
4. **State Management**: Zustand for global state (auth, UI), TanStack Query for server state
5. **Components**: Follow shadcn/ui patterns - composition-based with primitive components
6. **Styling**: Tailwind utilities with CSS variables for theming (light/dark mode support)
7. **Error Handling**: Global error boundary, auth error interceptors, CSRF token management

### Important Configuration

**TypeScript** (`tsconfig.json`):
- Relaxed type checking (`strict: false`)
- Path alias: `@/*` maps to `./src/*`

**Tailwind** (`tailwind.config.ts`):
- Custom HSL color system with CSS variables
- Dark mode via class strategy
- Extended sidebar color scheme

### Authentication & API Integration

**Authentication Flow**:
1. User clicks login → redirects to backend `/auth/google/login/`
2. Backend handles OAuth → redirects to `/auth/callback`
3. Frontend validates session with `/api/v1/users/me/`
4. Session persisted via httpOnly cookies

**API Configuration**:
- Base API path: `/api/v1/`
- Authentication: Server-side Google OAuth (domain-restricted to @hahahaproduction.com)
- Session: Cookie-based with CSRF protection
- Money values: Handle as strings for decimal precision
- Dates: ISO 8601 format with timezone
- File uploads: Use pre-signed S3 URLs

**Development Mode**:
- Set `VITE_ENABLE_MOCK_AUTH=true` in `.env` for mock authentication
- Mock user bypasses Google OAuth for local development

### Music Industry Domain Context

The application handles:
- **Catalog Management**: Tracks, albums, artists with ISRC/UPC codes
- **Contracts**: Rights management and licensing
- **Finance**: Royalty calculations and revenue tracking
- **CRM**: Contact and deal pipeline management
- **Analytics**: Revenue analytics and performance metrics

### Development Guidelines

1. Use shadcn/ui component patterns for consistency
2. Place new UI components in `src/components/ui/`
3. Use the `cn()` utility from `lib/utils` for conditional classes
4. Follow existing mock data patterns during development
5. Maintain the HSL-based color system for theming consistency