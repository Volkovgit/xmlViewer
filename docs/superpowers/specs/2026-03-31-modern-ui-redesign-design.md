# Modern UI Redesign - Technical Specification

**Date:** 2026-03-31
**Status:** Draft
**Version:** 1.0

## Overview

Redesign XML Previewer UI from "2007 era" look to modern interface with:
- Left sidebar with context-sensitive actions
- Dynamic buttons that appear/disappear based on file type (XML/XSD)
- Modern blue color scheme with gradients and soft shadows
- SVG icons, micro-animations, tooltips, and notification badges
- Prominent "Show Graph" button for XSD files

## Architecture

### Current Structure

```
App.tsx
  └─ DocumentManager
      ├─ DocumentToolbar (top bar)
      ├─ DocumentTabs (tabs)
      └─ Content Views
          ├─ XMLTextEditor / XMLTree / XMLGrid
          └─ XSDVisualizer (with Graph tab inside)
```

### New Structure

```
App.tsx
  └─ DocumentManager
      ├─ TopBar (New, Open, Save buttons)
      ├─ Layout (split view)
      │   ├─ LeftSidebar (NEW)
      │   │   ├─ ActionsPanel (dynamic based on file type)
      │   │   └─ FilesPanel (list of open files with badges)
      │   └─ MainContent
      │       ├─ DocumentTabs (top of content)
      │       └─ Content Views
      │           ├─ XMLTextEditor / XMLTree / XMLGrid
      │           └─ XSDVisualizer (Graph tab promoted)
```

## Components

### 1. Layout Component

**File:** `src/components/layout/AppLayout.tsx` (NEW)

Responsibilities:
- Split layout: left sidebar (240px) + main content (flex)
- Responsive: collapse sidebar on small screens (< 768px)
- Theme provider for color scheme

**Props:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}
```

**Key Features:**
- Fixed sidebar width: 240px
- Sidebar toggle button on mobile
- Smooth transitions for sidebar collapse

### 2. LeftSidebar Component

**File:** `src/components/layout/LeftSidebar.tsx` (NEW)

Responsibilities:
- Container for ActionsPanel and FilesPanel
- Scrollable when content overflows
- Sticky sections with visual separation

**Structure:**
```tsx
<div className="left-sidebar">
  <ActionsPanel />        {/* Context-sensitive buttons */}
  <FilesPanel />          {/* Open files with badges */}
</div>
```

### 3. ActionsPanel Component

**File:** `src/components/actions/ActionsPanel.tsx` (NEW)

Responsibilities:
- Display different actions based on active document type
- XSD actions: Show Graph, Generate XML, Validate
- XML actions: Generate XSD, Assign Schema, Validate XSD
- Highlight primary action (Show Graph) with gradient

**Props:**
```typescript
interface ActionsPanelProps {
  document: Document | null;
  onShowGraph?: () => void;
  onGenerateXML?: () => void;
  onGenerateXSD?: () => void;
  onValidate?: () => void;
  onAssignSchema?: () => void;
}
```

**Logic:**
```typescript
const isXSD = document?.type === DocumentType.XSD;
const isXML = document?.type === DocumentType.XML;

// XSD Actions
{isXSD && (
  <>
    <PrimaryActionButton onClick={onShowGraph} icon="graph">
      Show Graph
    </PrimaryActionButton>
    <SecondaryActionButton onClick={onGenerateXML} icon="file">
      Generate XML
    </SecondaryActionButton>
    <SecondaryActionButton onClick={onValidate} icon="check">
      Validate
    </SecondaryActionButton>
  </>
)}

// XML Actions
{isXML && (
  <>
    <SecondaryActionButton onClick={onGenerateXSD} icon="file">
      Generate XSD
    </SecondaryActionButton>
    <SecondaryActionButton onClick={onAssignSchema} icon="link">
      Assign Schema
    </SecondaryActionButton>
    <SecondaryActionButton onClick={onValidateXSD} icon="check">
      Validate XSD
    </SecondaryActionButton>
  </>
)}
```

### 4. FilesPanel Component

**File:** `src/components/files/FilesPanel.tsx` (NEW)

Responsibilities:
- List all open documents
- Show file type icons (XML/XSD)
- Active file highlighting
- Badges: dirty indicator (orange dot), error count (red circle)
- Click to switch active document

**Props:**
```typescript
interface FilesPanelProps {
  documents: Document[];
  activeDocumentId: string;
  onDocumentSelect: (id: string) => void;
  validationErrors: Map<string, ValidationError[]>;
}
```

**File Item Structure:**
```tsx
<div className={`file-item ${isActive ? 'active' : ''}`}>
  <FileIcon type={document.type} />
  <span className="file-name">{document.name}</span>
  {document.status === 'dirty' && <DirtyBadge />}
  {errorCount > 0 && <ErrorBadge count={errorCount} />}
</div>
```

### 5. PrimaryActionButton Component

**File:** `src/components/buttons/PrimaryActionButton.tsx` (NEW)

Responsibilities:
- Most important action button (Show Graph for XSD)
- Purple gradient background
- Larger than secondary buttons
- Icon + text
- Hover animation (scale + shadow)

**Props:**
```typescript
interface PrimaryActionButtonProps {
  children: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}
```

**Style:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
transition: all 0.2s ease;
border-radius: 8px;
padding: 12px;
font-weight: 600;
```

**Hover State:**
```css
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

### 6. SecondaryActionButton Component

**File:** `src/components/buttons/SecondaryActionButton.tsx` (NEW)

Responsibilities:
- Less important actions
- Light blue background (#f0f4ff)
- Blue border
- Icon + text

**Style:**
```css
background: #f0f4ff;
color: #2196f3;
border: 1px solid #e3f2fd;
transition: all 0.2s ease;
border-radius: 6px;
padding: 10px;
```

**Hover State:**
```css
background: #e3f2fd;
border-color: #2196f3;
```

### 7. Badge Components

**File:** `src/components/badges/Badges.tsx` (NEW)

**DirtyBadge:**
```tsx
<div className="dirty-badge" />
```
```css
width: 8px;
height: 8px;
background: #ff9800;
border-radius: 50%;
```

**ErrorBadge:**
```tsx
<div className="error-badge">{count}</div>
```
```css
padding: 2px 6px;
background: #f44336;
color: white;
border-radius: 10px;
font-size: 11px;
font-weight: 600;
```

### 8. Icon Library

**File:** `src/components/icons/Icon.tsx` (NEW)

Use Lucide React icons:
```bash
npm install lucide-react
```

**Icons to use:**
- `Show Graph`: `<Circle/>` or custom graph icon
- `Generate XML`: `<FileText/>`
- `Generate XSD`: `<FileCode/>`
- `Validate`: `<CheckCircle/>`
- `Assign Schema`: `<Link/>`
- `File`: `<File/>` (XML/XSD with color)

### 9. TopBar Component

**File:** `src/components/toolbar/TopBar.tsx` (REFACTOR from DocumentToolbar)

Responsibilities:
- App title/branding
- File operations: New, Open, Save
- Remove XSD-specific buttons (moved to sidebar)
- Modern styling

**New Props:**
```typescript
interface TopBarProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onSave?: () => void;
  hasActiveDocument?: boolean;
}
```

## Color Scheme

### Primary Colors

```css
--primary-blue: #2196f3;
--primary-light: #e3f2fd;
--primary-dark: #1976d2;
--gradient-start: #667eea;
--gradient-end: #764ba2;
```

### Neutral Colors

```css
--bg-body: #f8f9fa;
--bg-white: #ffffff;
--border-color: #e0e0e0;
--text-primary: #333333;
--text-secondary: #666666;
--text-disabled: #999999;
```

### Status Colors

```css
--error: #f44336;
--warning: #ff9800;
--success: #4caf50;
--info: #2196f3;
```

## Animations

### Button Hover
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Sidebar Slide In (Mobile)
```css
@media (max-width: 768px) {
  .left-sidebar {
    transition: transform 0.3s ease;
  }

  .left-sidebar.collapsed {
    transform: translateX(-100%);
  }
}
```

### Badge Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.dirty-badge {
  animation: pulse 2s infinite;
}
```

## Tooltips

Use React-tooltip or Tippy.js:
```bash
npm install @tippyjs/react
```

**Implementation:**
```tsx
<Tooltip content="Show dependency graph for XSD schema">
  <PrimaryActionButton icon="graph">Show Graph</PrimaryActionButton>
</Tooltip>
```

## Responsive Design

### Breakpoints
- Mobile: < 768px (sidebar collapsed by default)
- Tablet: 768px - 1024px (sidebar always visible)
- Desktop: > 1024px (full layout)

### Mobile Behavior
- Sidebar toggle button in header
- Sidebar overlay mode
- Swipe to close sidebar

## Implementation Tasks

### Phase 1: Layout Structure
1. Create AppLayout component
2. Create LeftSidebar component
3. Update DocumentManager to use new layout
4. Make responsive with collapse toggle

### Phase 2: Actions Panel
1. Create ActionsPanel component
2. Create PrimaryActionButton component
3. Create SecondaryActionButton component
4. Implement dynamic logic (XSD vs XML)
5. Add action handlers from DocumentManager

### Phase 3: Files Panel
1. Create FilesPanel component
2. Add file type detection icons
3. Implement DirtyBadge component
4. Implement ErrorBadge component
5. Connect to document store validation state

### Phase 4: Visual Polish
1. Install and configure Lucide icons
2. Apply modern blue color scheme
3. Add hover animations
4. Add tooltips
5. Test all interactions

### Phase 5: TopBar Refactor
1. Refactor DocumentToolbar → TopBar
2. Remove XSD-specific buttons
3. Update styling
4. Update tests

## Migration Strategy

1. **Keep existing components** working during migration
2. **Feature flag** new layout (e.g., useModernLayout in settings)
3. **Gradual migration**: one component at a time
4. **Test compatibility** with existing workflows
5. **Remove old code** once new layout is stable

## Testing

### Unit Tests
- ActionsPanel: renders correct buttons for XSD vs XML
- FilesPanel: displays documents, handles selection
- Badges: displays correct counts, colors
- Responsive: sidebar collapse/expand

### Integration Tests
- Click "Show Graph" → opens XSD Graph View
- Switch files → actions update dynamically
- Error badge shows correct count
- Mobile toggle → sidebar collapses

### E2E Tests
- Open XSD file → see XSD actions
- Open XML file → see XML actions
- Click Show Graph → graph displays
- Switch files → actions switch

## Dependencies

### New Packages
```json
{
  "lucide-react": "^0.300.0",
  "@tippyjs/react": "^4.2.1"
}
```

### Existing (Keep)
- react (already using)
- react-dnd (already using)

## Success Criteria

- ✅ Modern blue visual style applied
- ✅ Left sidebar with context actions
- ✅ Dynamic buttons based on file type
- ✅ "Show Graph" prominently displayed
- ✅ SVG icons replace emoji
- ✅ Hover animations on buttons
- ✅ Tooltips on all buttons
- ✅ Badges for dirty state and errors
- ✅ Responsive on mobile/tablet
- ✅ All existing functionality preserved
- ✅ 100% test coverage for new components
