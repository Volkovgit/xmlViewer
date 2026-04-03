# XML Previewer - Project Context

## Project Overview

**xmlPreviewer** is an open-source, web-based XML editor inspired by Altova XMLSpy. It's built with React 18, TypeScript, and Vite, providing a comprehensive development environment for working with XML, XSD, XSLT, XPath, and XQuery.

**Goal:** Create a full-featured open-source alternative to commercial XML editors with modern web technologies.

**Current Status:** Phase 3 (Advanced Views) is complete, including modern UI redesign, multi-view synchronization, schema-aware editing, and XSD graph visualization.

---

## Tech Stack

### Core
- **React 18** - UI library
- **TypeScript** - Strict mode enabled
- **Vite** - Build tool and dev server
- **Zustand** - Lightweight state management
- **Monaco Editor** - VS Code-based code editor

### XML Processing
- **fast-xml-parser** - XML parsing
- **xmldom** - DOM manipulation
- **randexp** - Regex-based pattern generation for XSD facets

### UI Libraries
- **AG-Grid** - Tabular XML editing
- **React Flow** - XSD graph visualization
- **React DnD** - Drag-and-drop functionality
- **Lucide React** - Icon library
- **Tippy.js** - Tooltip library

### Testing & Quality
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## Project Structure

```
xmlPreviewer/
├── src/
│   ├── main.tsx                          # Entry point
│   ├── App.tsx                           # Root component
│   │
│   ├── core/                             # Core business logic
│   │   ├── documentManager/              # Document lifecycle management
│   │   ├── parserEngine/                 # XML parsing engine
│   │   ├── validatorEngine/              # XML/XSD validation
│   │   └── viewManager/                  # View state management & synchronization
│   │
│   ├── views/                            # Top-level view components
│   │   ├── text/                         # Monaco-based text editors
│   │   ├── grid/                         # AG-Grid tabular views
│   │   ├── tree/                         # Hierarchical tree views
│   │   └── split/                        # Multi-pane split views
│   │
│   ├── services/                         # Business logic (pure functions)
│   │   ├── xml/                          # XML operations, formatting
│   │   ├── xsd/                          # XSD schema services, generation
│   │   ├── xslt/                         # XSLT transformation
│   │   ├── xpath/                        # XPath evaluation
│   │   └── xquery/                       # XQuery execution
│   │
│   ├── components/                       # Reusable React UI components
│   │   ├── common/                       # Shared UI components
│   │   ├── document/                     # Document-related components
│   │   ├── layout/                       # AppLayout, LeftSidebar, etc.
│   │   ├── actions/                      # ActionsPanel (context-sensitive buttons)
│   │   ├── buttons/                      # Primary/Secondary action buttons
│   │   ├── badges/                       # DirtyBadge, ErrorBadge
│   │   ├── files/                        # FilesPanel (document list)
│   │   └── validation/                   # Validation UI components
│   │
│   ├── stores/                           # Zustand state stores
│   ├── hooks/                            # Custom React hooks
│   ├── types/                            # TypeScript type definitions
│   ├── utils/                            # Utility functions
│   ├── styles/                           # Global styles and themes
│   └── test/                             # Test configuration and utilities
│
├── public/                               # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         UI Layer (views/)               │
│  Text Editors | Grid | Tree | Split     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│    Component Layer (components/)        │
│  Layout | Documents | Validation        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      Core Systems (core/)               │
│  DocumentManager | Parser | Validator   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│    Services Layer (services/)           │
│  XML | XSD | XSLT | XPath | XQuery      │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│    State Management (stores/)           │
│         Zustand Stores                  │
└─────────────────────────────────────────┘
```

### Key Patterns

1. **Document-Centric Design:** `DocumentManager` is the central coordinator; all views observe the active document
2. **Multi-View Synchronization:** `ViewCoordinator` broadcasts changes; `ViewSyncManager` debounces updates (300ms)
3. **Observer Pattern:** Changes propagate through coordinated stores and view managers
4. **State Slicing:** Zustand stores are sliced by feature (document, validation, settings)
5. **Modern UI:** Split layout with sidebar; context-sensitive actions based on document type (XML/XSD)

---

## Available Commands

### Development
```bash
npm run dev             # Start dev server (http://localhost:5173)
npm run build           # Production build (tsc + vite build)
npm run preview         # Preview production build
```

### Testing
```bash
npm run test            # Run all tests (Vitest)
npm run test:ui         # Run tests with Vitest UI
npm run test:coverage   # Run tests with coverage report
npm run test:watch      # Run tests in watch mode
```

### Code Quality
```bash
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier format
npm run format:check    # Check code formatting
npm run type-check      # TypeScript type checking (no emit)
```

---

## Code Quality Standards

- **TypeScript:** Strict mode enabled (`strict: true`)
- **ESLint:** Zero warnings; React hooks and refresh plugins enabled
- **Prettier:** Semi-colons, single quotes, 2-space indent, es5 trailing comma
- **Test Coverage:** Target > 75%

---

## Implementation Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0: Project Setup | Vite + React + TypeScript + ESLint + Vitest | ✅ Complete |
| Phase 1: MVP - Basic XML | DocumentManager, XMLParser, Monaco Editor, Validator | ✅ Complete |
| Phase 2: XSD Support | XSD editor, validation, generation | ✅ Complete |
| Phase 3: Advanced Views | AG-Grid, Tree sync, Schema-aware editing, XSD Graph | ✅ Complete |
| Phase 4: Transformations | XPath, XSLT, XQuery | Planned |
| Phase 5: Expert Features | XML diff, debuggers, profilers | Planned |
| Phase 6: Polish | Performance, theming, 80%+ tests | Planned |

---

## Key Files Reference

| Feature | File Path |
|---------|-----------|
| Document management | `src/core/documentManager/DocumentManager.tsx` |
| XML parsing | `src/core/parserEngine/XMLParser.ts` |
| Validation | `src/core/validatorEngine/XMLValidator.ts` |
| Text editor | `src/views/text/MonacoEditor.tsx` |
| State store | `src/stores/documentStore.ts` |
| App layout | `src/components/layout/AppLayout.tsx` |
| Left sidebar | `src/components/layout/LeftSidebar.tsx` |
| Actions panel | `src/components/actions/ActionsPanel.tsx` |
| Files panel | `src/components/files/FilesPanel.tsx` |

---

## Modern UI Features (Added 2026-03-31)

- **Left Sidebar:** Context-sensitive actions and file list
- **Smart Actions:** XSD/XML-specific operations based on document type
- **Status Indicators:** Dirty state (orange dot) and validation error badges (red count)
- **Responsive Design:** Mobile-friendly with collapsible sidebar toggle
- **Modern Color Theme:** Blue color scheme with smooth gradients (#2196f3, #667eea)
- **Tooltips:** Descriptive tooltips on all action buttons

---

## Performance Targets

- App startup: < 3 seconds
- Open 1MB file: < 1 second
- Validate 1MB file: < 2 seconds
- Render 1000 grid rows: < 100ms
- Memory usage: < 500MB

---

## Development Conventions

1. **Critical Implementation Order:** DocumentStore → DocumentManager → XMLParser → MonacoEditor → XMLValidator
2. **TDD Encouraged:** Write tests before or alongside implementation
3. **Feature Branches:** Never work directly on `main`
4. **Performance First:** Optimize for large files from the start
5. **Multi-View Sync:** Invest time in ViewCoordinator architecture

---

## Notes

- Project is currently in **Phase 3** - Advanced Views complete
- MVP verification checklist is available in `CLAUDE.md`
- Feature reference documentation is in `XMLSpy_Altova_функции.md` (Russian)
- Implementation plan details are in `IMPLEMENTATION_PLAN.md`
