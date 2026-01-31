# NPM Install & Runtime Fix Documentation

## Issues Encountered

### Phase 1: NPM Install Issues
The `npm install` command was failing due to multiple dependency version conflicts:

#### 1. i18next Version Conflict
- **Error**: `react-i18next@15.7.3` requires `i18next >= 25.4.1`
- **Found**: `i18next@23.16.8`
- **Fix**: Updated `i18next` from `^23.16.8` to `^25.4.1`

#### 2. MUI Version Conflict
- **Error**: `@mui/lab@7.0.0-beta.16` requires `@mui/material@^7.3.2`
- **Found**: `@mui/material@6.5.0`
- **Fix**: Updated `@mui/material` from `^6.5.0` to `^7.3.2`
- **Additional**: Updated `@mui/icons-material` from `^6.5.0` to `^7.3.2` for compatibility

#### 3. Vite Version Conflict
- **Error**: `@storybook/react-vite@8.6.14` requires `vite@^4.0.0 || ^5.0.0 || ^6.0.0`
- **Found**: `vite@7.1.4`
- **Fix**: Downgraded `vite` from `^7.1.4` to `^6.0.0`

### Phase 2: Runtime Issues

#### 4. MUI v7 Import Path Issues
- **Error**: `@mui/material/styles/createTheme` and `@mui/material/styles/ThemeProvider` imports not found
- **Cause**: MUI v7 changed import paths
- **Fix**: Changed imports in `src/providers/AppThemeProvider.tsx:5` from individual imports to destructured import:
  ```typescript
  // Before
  import createTheme from '@mui/material/styles/createTheme';
  import ThemeProvider from '@mui/material/styles/ThemeProvider';
  
  // After
  import { createTheme, ThemeProvider } from '@mui/material/styles';
  ```

#### 5. React Router Compatibility Issues
- **Error**: `useRoutes() may be used only in the context of a <Router> component`
- **Cause**: React Router v6.30.1 incompatibility with React 19
- **Fix**: Upgraded React Router from `^6.30.1` to `^7.8.2`

#### 6. Infinite Update Loop in AppThemeProvider
- **Error**: `Maximum update depth exceeded` in AppThemeProvider component
- **Cause**: Two issues causing infinite re-renders:
  1. Theme object recreated on every render
  2. Circular dependency in language sync hook
- **Fix**: 
  - Used `useMemo` to memoize theme creation in `AppThemeProvider.tsx`
  - Fixed circular dependency in `use-language-sync.ts` by removing `language` from effect dependency array and using `getState()`

## Changes Made

### Package.json Updates
```json
{
  "dependencies": {
    "i18next": "^25.4.1",           // was ^23.16.8
    "@mui/icons-material": "^7.3.2", // was ^6.5.0
    "@mui/material": "^7.3.2",      // was ^6.5.0
    "react-router": "^7.8.2",       // was ^6.30.1
    "react-router-dom": "^7.8.2"    // was ^6.30.1
  },
  "devDependencies": {
    "vite": "^6.0.0"               // was ^7.1.4
  }
}
```

### Code Changes
1. **AppThemeProvider.tsx**: Fixed MUI v7 imports and added `useMemo` for theme memoization
2. **use-language-sync.ts**: Fixed circular dependency in language synchronization

## Result

- ✅ `npm install` completes successfully (719 packages, 0 vulnerabilities)
- ✅ All dependency conflicts resolved
- ✅ MUI v7 imports working correctly
- ✅ React Router v7 compatible with React 19
- ✅ No more infinite update loops
- ✅ Application starts and runs without errors