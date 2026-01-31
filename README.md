# Cable-Admin Client V2

A modern React frontend application built with clean architecture principles, featuring a map-centric interface for violation management.

## Architecture

This application follows **Clean Architecture** with the following layers:

### 1. Presentation Layer (`src/presentation/`)
- **Components**: Feature-based organization using MUI components
- **Pages**: Route-level components
- **Layout**: Application layout components (Header + Body with 60/40 split)

### 2. Application Layer (`src/application/`)
- **Store**: Redux store with domain-based slices
- **Hooks**: Custom hooks implementing MVVM pattern (View Models)
- **Services**: Business logic orchestration

### 3. Domain Layer (`src/domain/`)
- **Entities**: Domain classes and types
- **Repositories**: Abstract repository interfaces
- **Types**: Domain-specific type definitions

### 4. Infrastructure Layer (`src/infrastructure/`)
- **Repositories**: Concrete repository implementations
- **API**: Axios configurations and HTTP client
- **Config**: Dependency injection setup

### 5. Shared Layer (`src/shared/`)
- **Utils**: Common utilities and helpers
- **Constants**: Application constants and configuration
- **Types**: Shared type definitions

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **MUI (Material-UI)** - Component library
- **TanStack Query** - Data fetching and caching
- **React Router** - Navigation
- **Axios** - HTTP client
- **ArcGIS API for JavaScript 4.33** - Mapping
- **Zod** - Schema validation
- **i18next** - Internationalization
- **Vite** - Build tool

## Key Features

### Layout System
- **Header + Body Layout**: Fixed header with flexible body
- **60/40 Split**: Map container (60%) + Expandable panel (40%)
- **Responsive Design**: Mobile-first approach with breakpoint handling
- **Panel Management**: Collapsible/expandable side panel with smooth animations

### State Management
- **Domain-Based Redux Slices**: Each business domain has its own slice
- **Core Slices**: layout, authentication, map (mandatory)
- **MVVM Pattern**: Redux Slice → Custom Hook → Component

### Design Patterns

#### Repository Pattern
- Abstract interfaces for data access
- Concrete implementations with dependency injection
- Consistent [result, error] return pattern

#### Configuration Pattern
- Environment-based configuration (dev/staging/prod)
- Runtime configuration files
- Compile-time environment variables

#### Singleton Pattern
- Axios instance
- Configuration management

### Internationalization
- **Primary Language**: Arabic (Cairo font, RTL)
- **Secondary Language**: English (LTR)
- **Dynamic Switching**: Language and direction changes

### Theming
- **MUI Theme System**: Custom theme with RTL/LTR support
- **Dark/Light Mode**: Toggle functionality
- **Responsive Typography**: Cairo font for Arabic, Roboto for English

## Project Structure

```
├── src/
│   ├── presentation/           # UI Layer
│   │   ├── components/
│   │   │   ├── common/        # Shared components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── features/      # Feature-specific components
│   │   │   └── providers/     # Context providers
│   │   └── pages/             # Route components
│   ├── application/            # Application Layer
│   │   ├── store/
│   │   │   └── slices/        # Redux slices
│   │   ├── hooks/             # Custom hooks (View Models)
│   │   └── services/          # Business logic
│   ├── domain/                 # Domain Layer
│   │   ├── entities/          # Domain entities
│   │   ├── repositories/      # Repository interfaces
│   │   └── types/             # Domain types
│   ├── infrastructure/         # Infrastructure Layer
│   │   ├── repositories/      # Repository implementations
│   │   ├── api/               # HTTP client setup
│   │   └── config/            # DI configuration
│   ├── shared/                 # Shared Layer
│   │   ├── utils/             # Utilities
│   │   ├── constants/         # Constants
│   │   └── types/             # Shared types
│   ├── config/                 # Runtime configuration
│   ├── locales/               # i18n resources
│   └── assets/                # Static assets
├── public/                     # Public assets
├── tests/                      # Test files
└── docs/                       # Documentation
```

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 8

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy environment template
cp .env.development.example .env.development
```

3. Configure your environment variables in `.env.development`:
```env
VITE_APP_NAME=PAI-Violation-Client
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ARCGIS_API_KEY=your-arcgis-api-key
```

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building

```bash
# Build for development
npm run build:dev

# Build for staging
npm run build:staging

# Build for production
npm run build:prod
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Configuration

### Environment Variables
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Runtime Configuration
- `src/config/config.development.json`
- `src/config/config.staging.json`
- `src/config/config.production.json`

## Best Practices

### Code Organization
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Consistent naming conventions
- Barrel exports for clean imports

### React Best Practices
- Function components only
- Custom hooks for complex logic
- Proper memoization usage
- Error boundaries

### TypeScript Best Practices
- Strict mode enabled
- No 'any' type usage
- Interface over type aliases
- Proper generic usage

### Performance
- Code splitting
- Lazy loading
- Strategic memoization
- Bundle optimization

## Contributing

1. Follow the established architecture patterns
2. Use TypeScript strictly
3. Write tests for new features
4. Follow the existing code style
5. Update documentation as needed

## License

[Your License Here]
