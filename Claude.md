# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cable Admin is a React-based administrative application for cable management system. This is a mobile-first web application designed to be used as a WebView on mobile devices, with full bilingual support (Arabic RTL & English LTR).

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                    # Start dev server (http://127.0.0.1:3000)

# Build
npm run build:dev              # Build for development
npm run build:staging          # Build for staging
npm run build:prod             # Build for production

# Type Checking & Linting
npm run typecheck              # Run TypeScript type checking
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues automatically

# Testing
npm test                       # Run tests with Vitest
npm run test:ui                # Run tests with UI
npm run test:coverage          # Run tests with coverage report

# Storybook
npm run storybook              # Start Storybook dev server
npm run build-storybook        # Build Storybook
```

### Feature Generation (Important)
```bash
npm run feature                # Interactive feature generator
npm run generate:feature       # Generate new feature module
npm run remove:feature         # Remove existing feature module
npm run config                 # Configuration manager
```

## Architecture Overview

This application follows a **feature-based architecture** with clear separation of concerns. Each feature is self-contained with its own components, services, types, hooks, and utilities.

### Core Architecture Patterns

1. **Feature Modules**: Self-contained feature directories in `src/features/`
2. **State Management**: Zustand stores in `src/stores/` (not Redux as README suggests)
3. **Data Fetching**: TanStack React Query for server state
4. **UI Components**: MUI (Material-UI) with custom theming
5. **Forms**: React Hook Form with Zod validation
6. **Maps**: ArcGIS JavaScript API 4.27.6

### Project Structure

```
src/
├── features/              # Feature modules (main development area)
│   ├── app/              # Core app components (layout, navigation, panels)
│   ├── authentication/   # Login and auth
│   ├── reservations/     # Camping reservations management
│   ├── refunds/          # Refund requests management
│   ├── users/            # User management
│   ├── roles/            # Role management
│   ├── camping-seasons/  # Season management
│   ├── camping-configurations/ # Configuration management
│   └── camping-areas/    # Area management
├── stores/               # Zustand stores (global state)
├── components/           # Shared/reusable components
├── hooks/                # Shared custom hooks
├── lib/                  # Library configurations (axios, i18n)
├── pages/                # Route containers
├── providers/            # React context providers
├── constants/            # Application constants
├── utils/                # Utility functions
└── types/                # Shared TypeScript types
```

### Feature Module Structure

Each feature follows this consistent structure:
```
feature-name/
├── components/           # Feature-specific React components
├── services/             # API calls and business logic
├── hooks/                # Feature-specific custom hooks
├── types/                # TypeScript types/interfaces
├── utils/                # Feature-specific utilities
├── validators/           # Zod schemas (if needed)
└── index.ts              # Barrel export
```

## Key Technical Details

### Configuration System

The app uses **runtime configuration** loaded from `public/config/config.{environment}.js`:
- Accessed globally via `window.env`
- Contains API URLs, map configuration, service URLs
- Different configs for development/staging/production
- Environment determined by `VITE_APP_ENVIRONMENT` in `.env` files

### State Management

**Zustand Stores** (in `src/stores/`):
- `auth-store.ts` - Authentication & user state (persisted)
- `layout-store.ts` - UI layout state (drawer, panels)
- `language-store.ts` - Language preference (ar/en)
- `theme-store.ts` - Dark/light mode
- `map-store.ts`, `map-view-store.ts` - ArcGIS map state
- `snackbar-store.ts` - Global notifications

All stores use Zustand with immer middleware for immutability.

### Internationalization (i18n)

**Critical i18n Rules:**
- Uses i18next with namespace separation via `@` (e.g., `t('common@save')`)
- Default language: Arabic (RTL)
- Locale files in `public/locales/{ar,en}/`
- Namespaces defined in `src/lib/i18n.ts` (lines 34-51)
- When adding new translations:
  1. Check for duplicates across all locale files first
  2. Add to both `ar` and `en` directories
  3. Update namespace array in `i18n.ts` if new namespace
  4. Use descriptive keys, not values
- Format: `t('namespace@key')` where `@` is the separator

### Path Aliases (tsconfig.json)

```typescript
@/*                        → ./src/*
@/presentation/*           → ./src/presentation/*
@/application/*            → ./src/application/*
@/domain/*                 → ./src/domain/*
@/infrastructure/*         → ./src/infrastructure/*
@/shared/*                 → ./src/shared/*
@/config/*                 → ./src/config/*
@/assets/*                 → ./src/assets/*
@/locales/*                → ./src/locales/*
```

Note: Some paths reference clean architecture layers but actual structure uses `features/` pattern.

### API Integration

**Axios Instance** (`src/lib/@axios.ts`):
- Base URL from `window.env.server.url`
- Automatic Bearer token injection from auth store
- Language header injection from language store
- Token refresh interceptor (401 handling)
- Automatic logout on 403

### Routing

Routes defined in `src/pages/AppContainer.tsx`:
- `/` - Dashboard
- `/reservations` - Reservations management
- `/refunds` - Refunds management
- `/users` - User management
- `/roles` - Role management
- `/camping-seasons` - Season management
- `/camping-configurations` - Configuration management
- `/camping-areas` - Area management
- `/map` - Full map view
- `/login` - Authentication

All protected routes require authentication check via `ProtectedRoute` wrapper.

### Build Output

Builds are versioned and output to `build/{APP_NAME}-{VERSION}-{ENVIRONMENT}/`
- Version from `VITE_APP_VERSION` in `.env` file
- Currently at v1.0.9 (development)

## Code Guidelines

### Component Development
- **Mobile-first**: All UI must work on mobile screens first
- Use MUI components consistently
- Keep components focused and small
- Prefer composition over inheritance
- Use barrel exports (`index.ts`) for clean imports
- Lazy load route-level components

### State & Data
- Use TanStack Query for server state
- Use Zustand stores for global client state
- Avoid prop drilling - use stores or context
- Handle loading, error, and empty states explicitly

### TypeScript
- Prefer interfaces over types for object shapes
- Avoid `any` - type everything
- Note: `strict: false` in tsconfig but still type carefully

### Performance
- Memoize expensive computations with `useMemo`/`useCallback`
- Lazy load heavy components and routes
- Use React Query's caching effectively

### Styling & Accessibility
- Use MUI theme variables, never hardcode colors
- Follow WCAG guidelines (aria-labels, focus states)
- Ensure RTL/LTR support for both languages
- Mobile-first responsive design

### Internationalization
- NO hardcoded strings - everything through `t('...')`
- Use `@` separator for namespaces (configured in i18n)
- Check for duplicate translations before adding new ones
- Maintain parallel structure in ar/en locale files
- Keep translation keys descriptive

## Map Integration

Uses **ArcGIS API for JavaScript 4.27.6**:
- Configuration in `window.env.map`, `window.env.mapView`
- Operational layers for camping areas
- Custom proxy rules for Kuwait GIS services
- Geometry and routing services configured

## Important Notes

1. **Service Worker**: Registered in `index.html` for offline support
2. **Console Suppression**: ArcGIS sublayer errors are globally suppressed in `main.tsx`
3. **Debug Mode**: Controlled by `window.env.debug` flag
4. **Authentication**: JWT tokens with automatic refresh on 401
5. **Privilege System**: User privileges stored in auth store, checked via constants in `src/constants/privileges-constants.ts`

## Common Patterns

### Adding a New Feature
1. Use `npm run generate:feature` to scaffold
2. Follow the feature module structure
3. Add route in `AppContainer.tsx`
4. Add locale files for both ar/en
5. Update i18n namespace list if needed
6. Add store if feature needs global state

### API Service Pattern
```typescript
// services/{feature}-service.ts
import { server } from '@/lib/@axios';

export const fetchData = async () => {
  const response = await server.get('/endpoint');
  return response.data;
};
```

### Custom Hook Pattern
```typescript
// hooks/use-{feature}.ts
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '../services/{feature}-service';

export const useFeatureData = () => {
  return useQuery({
    queryKey: ['feature-key'],
    queryFn: fetchData,
  });
};
```

### Component with Translations
```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <Typography>{t('namespace@key')}</Typography>;
};
```
