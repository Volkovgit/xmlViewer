# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**xmlPreviewer** is an open-source clone of Altova XMLSpy - a comprehensive XML/XSD development environment. This is a React 18 + TypeScript application built with Vite, providing tools for XML editing, validation, XSLT/XQuery transformations, and schema management.

**Goal:** Create a full-featured XML editor with MVP priority on basic XML and XSD support.

**Tech Stack:**

- Frontend: React 18 + TypeScript (strict mode)
- Build: Vite
- State: Zustand
- Editor: Monaco Editor (@monaco-editor/react)
- XML Parsing: fast-xml-parser, xmldom
- Validation: xsdata, xml-xsd-validator
- Testing: Vitest + React Testing Library

---

## Common Commands

### Development

```bash
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:5173)
npm run build           # Production build
npm run preview         # Preview production build
```

### Testing

```bash
npm run test            # Run all tests (Vitest)
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report
npm run test:watch      # Watch mode
```

### Code Quality

```bash
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier format
npm run type-check      # TypeScript type checking
```

---

## Architecture Overview

### Core Systems Architecture

The application follows a **layered architecture** with clear separation of concerns:

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

### Key Architectural Patterns

1. **Document-Centric Design**
   - `DocumentManager` (core/) is the central coordinator for all document operations
   - All views (text, grid, tree) observe the active document
   - Document changes propagate via Observer pattern through `ViewCoordinator`

2. **Multi-View Synchronization**
   - `ViewCoordinator` (core/viewManager/) coordinates updates between multiple views
   - `ViewSyncManager` debounces changes and prevents update cycles
   - Each document maintains unique node IDs for cross-view navigation

3. **Parser-Validator Pipeline**
   - `XMLParser` (core/parserEngine/) parses and caches XML DOM/JSON
   - `XMLValidator` (core/validatorEngine/) validates syntax and XSD compliance
   - Validators aggregate errors with quick-fix suggestions

4. **State Management with Zustand**
   - `documentStore` (stores/) manages all open documents
   - Stores are sliced by feature (document, validation, settings)
   - No prop drilling - components access store directly

---

## Critical Implementation Order

**Follow this order when implementing features:**

1. **DocumentStore** (stores/documentStore.ts)
   - Foundation for all document operations
   - Must be implemented first

2. **DocumentManager** (core/documentManager/)
   - Central document lifecycle management
   - Depends on documentStore

3. **XMLParser** (core/parserEngine/XMLParser.ts)
   - Parse caching and error handling
   - Independent of other systems

4. **MonacoEditor** (views/text/MonacoEditor.tsx)
   - Base text editor component
   - Integrates with DocumentManager

5. **XMLValidator** (core/validatorEngine/XMLValidator.ts)
   - Validation engine
   - Extensible for XSD validation

---

## File Structure Philosophy

### Core Systems (src/core/)

**Purpose:** Fundamental systems that power the application. These are NOT UI components.

- **documentManager/** - Document lifecycle, tabs, dirty state, file operations
- **parserEngine/** - XML parsing, DOM manipulation, caching
- **validatorEngine/** - XML/XSD validation, error aggregation
- **viewManager/** - Multi-view coordination, synchronization

### Views (src/views/)

**Purpose:** Top-level UI components representing different editing modes.

- **text/** - Monaco-based editors (XML, XSD, XSLT, XQuery)
- **grid/** - Tabular XML editing with AG-Grid
- **tree/** - Hierarchical XML tree visualization
- **split/** - Multi-pane split views

### Services (src/services/)

**Purpose:** Business logic for XML technologies. These are pure functions/classes, NOT React components.

- **xml/** - XML operations, formatting, comparison
- **xsd/** - Schema generation, validation, visualization
- **xslt/** - XSLT transformation engine, debugger, profiler
- **xpath/** - XPath evaluation, builder, tester
- **xquery/** - XQuery execution engine

---

## Technical Constraints & Solutions

### Large File Handling (100MB+ XML)

**Challenge:** Browser crashes when parsing large files in main thread.

**Solution:**

- Use fast-xml-parser streaming mode
- Offload parsing to Web Workers
- Implement virtual scrolling in views (AG-Grid infinite row model)
- Lazy-load tree nodes (only render visible branches)

### View Synchronization

**Challenge:** Multiple views (text, grid, tree) can conflict when editing.

**Solution:**

- Observer pattern with `ViewCoordinator` as central dispatcher
- Debounce view updates (300-500ms) to prevent render storms
- Assign unique IDs to nodes for cross-view reference
- Optimistic updates with rollback on validation failure

### Schema-Aware Autocompletion

**Challenge:** Monaco needs context-aware XSD suggestions.

**Solution:**

- Parse and cache XSD schemas on document load
- Index all elements/attributes/types in schema
- Generate Monaco completion items based on cursor context
- Validate facets (minLength, pattern, enumeration) in real-time

---

## Implementation Phases

### Phase 0: Project Setup (Week 1)

- Initialize Vite + React + TypeScript
- Configure ESLint, Prettier, Vitest
- Create folder structure
- **Deliverable:** Working dev environment

### Phase 1: MVP - Basic XML Editor (Weeks 2-4)

- DocumentManager + DocumentStore
- XMLParser with fast-xml-parser
- Monaco XML editor with syntax highlighting
- XMLValidator with error panel
- Basic XML tree view
- File operations (open/save/drag-drop)
- **Deliverable:** Functional XML text editor

### Phase 2: XSD Support (Weeks 5-7)

- XSD text editor
- XML vs XSD validation
- XSD generation from XML
- XML generation from XSD
- XSD visualizer
- **Deliverable:** Complete XML Schema workflow

### Phase 3: Advanced Views (Weeks 8-10)

**COMPLETED:**
- ✅ AG-Grid table view (XMLGrid with inline editing, sorting, filtering)
- ✅ Enhanced tree with drag-drop, context menu, fuzzy search, multi-selection
- ✅ Multi-view synchronization (ViewCoordinator, ViewSyncManager, useViewSync hook)
- ✅ Schema-Aware Editing (COMPLETED)
  - SchemaProvider for XSD loading and caching
  - XMLContextAnalyzer for cursor position analysis
  - SchemaCompletionProvider for Monaco autocomplete
  - SchemaDecorationProvider for live validation errors
  - SchemaQuickFixProvider for quick fix actions
- ✅ XSD Graph Visualization (COMPLETED)
  - GraphBuilder service for dependency traversal
  - GraphLayoutEngine for dagre-based automatic layouts
  - Custom React Flow nodes (Element, ComplexType, SimpleType, Built-in)
  - XSDGraphVisualizer main component with interactive controls
  - Integration into XSDVisualizer as third tab
  - Full test coverage (22 tests, GraphBuilder 96%, GraphLayoutEngine 100%)

- **Deliverable:** Professional multi-view editor

### Phase 4: Transformations (Weeks 11-13)

- XPath builder & tester (fontoxpath)
- XSLT editor and transformer (saxon-js)
- XQuery editor and executor
- **Deliverable:** Full transformation support

### Phase 5: Expert Features (Weeks 14-16)

- XML diff viewer
- XSLT debugger and profiler
- Large file optimization (Web Workers)
- **Deliverable:** Production-ready application

### Phase 6: Polish (Weeks 17-18)

- Performance optimization
- Theming (light/dark)
- Testing coverage (80%+)
- Documentation
- **Deliverable:** Production release

---

## Key Dependencies by Phase

**Phase 0 (Base):**

```json
{
  "react": "^18.2.0",
  "zustand": "^4.4.0",
  "@monaco-editor/react": "^4.6.0"
}
```

**Phase 1 (XML):**

```json
{
  "fast-xml-parser": "^4.2.5",
  "xmldom": "^0.6.0"
}
```

**Phase 2 (XSD):**

```json
{
  "xsdata": "^23.8.0",
  "xml-xsd-validator": "^0.6.0"
}
```

**Phase 3 (Views):**

```json
{
  "ag-grid-react": "^31.0.0",
  "react-dnd": "^16.0.0"
}
```

**Phase 4 (Transformations):**

```json
{
  "saxon-js": "^2.5.0",
  "fontoxpath": "^3.25.0"
}
```

**Phase 5 (Expert):**

```json
{
  "diff": "^5.1.0",
  "react-diff-viewer": "^3.1.1"
}
```

---

## Testing Strategy

### Unit Tests (80%+ coverage target)

- **Target:** Parser/Validator logic, services, utilities, hooks
- **Tool:** Vitest
- **Location:** Co-located with source files (`__tests__/`)

### Component Tests (70%+ coverage target)

- **Target:** UI components, user interactions, state changes
- **Tool:** React Testing Library
- **Focus:** Behavior, not implementation details

### Integration Tests

- **Target:** Document management, view sync, end-to-end workflows
- **Tool:** Vitest + testing-library utils

### E2E Tests

- **Target:** Complete user scenarios (open, edit, validate, transform)
- **Tool:** Playwright
- **Scenarios:** See MVP verification checklist in IMPLEMENTATION_PLAN.md

---

## Performance Targets

- **App startup:** < 3 seconds
- **Open 1MB file:** < 1 second
- **Validate 1MB file:** < 2 seconds
- **Render 1000 grid rows:** < 100ms
- **Memory usage:** < 500MB

---

## Code Quality Standards

- **TypeScript:** Strict mode enabled, no `any` types
- **ESLint:** Zero warnings
- **Prettier:** Auto-format on save
- **Lighthouse:** 95%+ score
- **Test coverage:** > 75%

---

## Critical Files Reference

When working on specific features, reference these files:

- **Document management:** `src/core/documentManager/DocumentManager.tsx`
- **XML parsing:** `src/core/parserEngine/XMLParser.ts`
- **Validation:** `src/core/validatorEngine/XMLValidator.ts`
- **Text editor:** `src/views/text/MonacoEditor.tsx`
- **State store:** `src/stores/documentStore.ts`

---

## MVP Verification Checklist

Before claiming MVP is complete (Phases 0-2), verify:

1. ✓ Open XML file → displays in text editor with syntax highlighting
2. ✓ Edit XML → syntax highlighting works, changes save
3. ✓ Break XML → error shows in validation panel
4. ✓ Fix XML → error disappears
5. ✓ Switch to tree view → hierarchy displays correctly
6. ✓ Expand tree node → children show
7. ✓ Open XSD file → XSD syntax highlighting works
8. ✓ Attach XSD to XML → validation against schema works
9. ✓ Generate XSD from XML → schema generates correctly
10. ✓ Generate XML from XSD → valid instance creates

Full checklist: See "Верификация" section in IMPLEMENTATION_PLAN.md

---

## Development Workflow

1. **Read IMPLEMENTATION_PLAN.md** for detailed phase requirements
2. **Create feature branch** from `main` (never work on main directly)
3. **Implement following Critical Implementation Order**
4. **Write tests** before or alongside implementation (TDD encouraged)
5. **Run linting and type-checking** before committing
6. **Verify against MVP checklist** if implementing Phase 0-2 features

---

## Important Notes

- **Project is currently in Phase 0** - infrastructure setup
- **Only documentation exists** - no source code yet
- **Follow the plan strictly** - don't skip phases or add features prematurely
- **Performance is critical** - optimize for large files from the start
- **Multi-view sync is complex** - invest time in ViewCoordinator architecture

---

## Reference Materials

- `IMPLEMENTATION_PLAN.md` - Detailed implementation roadmap
- `XMLSpy_Altova_функции.md` - Feature reference from original XMLSpy
