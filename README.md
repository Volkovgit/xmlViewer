# XML Previewer

An open-source web-based XML editor inspired by Altova XMLSpy, built with modern web technologies.

## Project Description

XML Previewer is a comprehensive XML development environment designed to provide developers with powerful tools for working with XML, XSD, XSLT, XPath, and XQuery. This application aims to be a fully-featured open-source alternative to commercial XML editors.

### Key Features (Planned)

- **Multiple Editor Views**: Text View, Grid View, and Tree View for XML documents
- **Schema Support**: XSD editing, validation, and generation
- **XML Validation**: Real-time syntax checking and schema validation
- **XPath Tools**: Builder, tester, and debugger
- **XSLT Processing**: Transform XML documents with XSLT 1.0, 2.0, and 3.0
- **XQuery Editor**: Write and execute XQuery queries
- **File Operations**: Open, save, and compare XML files

## Tech Stack

### Core Framework

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### State Management & Editor

- **Zustand** - Lightweight state management
- **Monaco Editor** - Professional code editor (VS Code's editor)

### Development Tools

- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd xmlPreviewer

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally

### Code Quality

- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing

- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

## Architecture Overview

```
src/
├── components/      # React UI components
│   ├── common/     # Reusable UI components
│   ├── document/   # Document-related components
│   ├── layout/     # Layout components (toolbar, panels)
│   └── validation/ # Validation UI components
├── core/           # Core business logic
│   ├── documentManager/    # Document lifecycle management
│   ├── parserEngine/       # XML parsing engine
│   ├── validatorEngine/    # XML/XSD validation
│   └── viewManager/        # View state management
├── services/       # External service integrations
│   ├── xml/        # XML processing services
│   ├── xsd/        # XSD schema services
│   ├── xslt/       # XSLT transformation
│   ├── xpath/      # XPath evaluation
│   └── xquery/     # XQuery execution
├── stores/         # Zustand state stores
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── styles/         # Global styles and themes
└── test/           # Test configuration and utilities
```

### Key Architectural Patterns

- **State Management**: Zustand for lightweight, performant state management
- **Component Design**: Modular, reusable components with clear separation of concerns
- **Service Layer**: Isolated business logic from UI components
- **Type Safety**: Full TypeScript coverage for type safety and better DX
- **Testing**: Comprehensive test coverage with Vitest and Testing Library

## Project Status

**Phase 0: Project Setup** ✅ Complete

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed development roadmap.

## Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed implementation plan
- [CLAUDE.md](./CLAUDE.md) - Project-specific guidelines for AI assistants
- [XMLSpy*Altova*функции.md](./XMLSpy_Altova_функции.md) - XMLSpy feature reference (in Russian)

## Contributing

This project follows structured development phases. Contributions should align with the current phase objectives defined in IMPLEMENTATION_PLAN.md.

### Development Workflow

1. Ensure all tests pass: `npm run test`
2. Run linter: `npm run lint`
3. Check types: `npm run type-check`
4. Format code: `npm run format`
5. Create descriptive commits following conventional commit format

## License

[To be determined]

## Acknowledgments

Inspired by Altova XMLSpy, the industry-leading XML editor and development environment.

---

**Note**: This project is currently in active development. Phase 0 (project setup) is complete, and we are preparing to begin Phase 1 (basic XML editor implementation).
