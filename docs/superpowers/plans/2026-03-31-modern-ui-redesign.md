# Modern UI Redesign - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign XML Previewer UI from outdated 2007-style to modern interface with left sidebar, context-sensitive actions, SVG icons, animations, and notification badges.

**Architecture:**
- Split layout: 240px left sidebar (actions + files) + main content area
- Dynamic action buttons that appear/disappear based on file type (XML vs XSD)
- Component-based architecture with reusable button components
- Gradual migration strategy to preserve existing functionality

**Tech Stack:** React 18, TypeScript, Lucide React icons, Tippy.js for tooltips, existing Zustand state management

---

## Phase 1: Layout Structure (Foundation)

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install icon library**

```bash
npm install lucide-react@^0.300.0
```

- [ ] **Step 2: Install tooltip library**

```bash
npm install @tippyjs/react@^4.2.1
```

- [ ] **Step 3: Verify installation**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add lucide-react and @tippyjs/react for modern UI"
```

### Task 2: Create AppLayout Component

**Files:**
- Create: `src/components/layout/AppLayout.tsx`
- Create: `src/components/layout/AppLayout.css`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/layout/__tests__/AppLayout.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../AppLayout';

describe('AppLayout', () => {
  it('should render children', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render sidebar when provided', () => {
    render(
      <AppLayout sidebar={<div>Sidebar</div>}>
        <div>Main</div>
      </AppLayout>
    );
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
  });

  it('should apply split layout classes', () => {
    const { container } = render(
      <AppLayout sidebar={<div>Sidebar</div>}>
        <div>Main</div>
      </AppLayout>
    );
    expect(container.querySelector('.app-layout')).toBeInTheDocument();
    expect(container.querySelector('.left-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.main-content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/layout/__tests__/AppLayout.test.tsx --run
```

Expected: FAIL with "AppLayout not found"

- [ ] **Step 3: Create AppLayout component**

```typescript
// src/components/layout/AppLayout.tsx
import { ReactNode } from 'react';
import './AppLayout.css';

export interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function AppLayout({ children, sidebar }: AppLayoutProps) {
  return (
    <div className="app-layout">
      {sidebar && <aside className="left-sidebar">{sidebar}</aside>}
      <main className="main-content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create CSS styles**

```css
/* src/components/layout/AppLayout.css */
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.left-sidebar {
  flex: 0 0 240px;
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Responsive: collapse sidebar on mobile */
@media (max-width: 768px) {
  .left-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .left-sidebar.open {
    transform: translateX(0);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/layout/__tests__/AppLayout.test.tsx --run
```

Expected: PASS (3/3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/
git commit -m "feat: create AppLayout component with split layout"
```

### Task 3: Create LeftSidebar Component

**Files:**
- Create: `src/components/layout/LeftSidebar.tsx`
- Create: `src/components/layout/LeftSidebar.css`
- Create: `src/components/layout/__tests__/LeftSidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/layout/__tests__/LeftSidebar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeftSidebar } from '../LeftSidebar';

describe('LeftSidebar', () => {
  it('should render actions and files sections', () => {
    render(
      <LeftSidebar
        actions={<div>Actions</div>}
        files={<div>Files</div>}
      />
    );
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('should render section headers', () => {
    render(<LeftSidebar actions={<div>Actions</div>} files={<div>Files</div>} />);
    const headers = screen.getAllByText(/actions|files/i);
    expect(headers).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/layout/__tests__/LeftSidebar.test.tsx --run
```

Expected: FAIL with "component not found"

- [ ] **Step 3: Create LeftSidebar component**

```typescript
// src/components/layout/LeftSidebar.tsx
import { ReactNode } from 'react';
import './LeftSidebar.css';

export interface LeftSidebarProps {
  actions: ReactNode;
  files: ReactNode;
}

export function LeftSidebar({ actions, files }: LeftSidebarProps) {
  return (
    <div className="left-sidebar-content">
      <section className="sidebar-section">
        <div className="sidebar-section-header">Actions</div>
        {actions}
      </section>
      <section className="sidebar-section">
        <div className="sidebar-section-header">Open Files</div>
        {files}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create CSS styles**

```css
/* src/components/layout/LeftSidebar.css */
.left-sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-section:last-child {
  border-bottom: none;
  flex: 1;
  overflow-y: auto;
}

.sidebar-section-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/layout/__tests__/LeftSidebar.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/
git commit -m "feat: create LeftSidebar component with section headers"
```

### Task 4: Integrate AppLayout into DocumentManager

**Files:**
- Modify: `src/core/documentManager/DocumentManager.tsx`
- Modify: `src/core/documentManager/DocumentManager.css`

- [ ] **Step 1: Update DocumentManager imports**

```typescript
// Add to imports in DocumentManager.tsx
import { AppLayout } from '@/components/layout/AppLayout';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
```

- [ ] **Step 2: Wrap existing content in AppLayout**

```typescript
// In DocumentManager component return statement
return (
  <DndProvider backend={HTML5Backend}>
    <div className="app">
      <AppLayout
        sidebar={
          <LeftSidebar
            actions={<div>{/* ActionsPanel will go here */}</div>}
            files={<div>{/* FilesPanel will go here */}</div>}
          />
        }
      >
        {/* Existing toolbar and content */}
        <DocumentToolbar {...toolbarProps} />
        <DocumentTabs {...tabsProps} />
        {content}
      </AppLayout>
    </div>
  </DndProvider>
);
```

- [ ] **Step 3: Update CSS for new layout**

```css
/* In DocumentManager.css */
.app {
  padding: 0;
  max-width: none;
  margin: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 4: Test compilation**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 5: Run existing tests**

```bash
npm test -- src/core/documentManager/__tests__/DocumentManager.test.tsx --run
```

Expected: Existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add src/core/documentManager/
git commit -m "feat: integrate AppLayout into DocumentManager"
```

---

## Phase 2: Action Buttons (Core Interactions)

### Task 5: Create PrimaryActionButton Component

**Files:**
- Create: `src/components/buttons/PrimaryActionButton.tsx`
- Create: `src/components/buttons/PrimaryActionButton.css`
- Create: `src/components/buttons/__tests__/PrimaryActionButton.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryActionButton } from '../PrimaryActionButton';

describe('PrimaryActionButton', () => {
  it('should render with icon and text', () => {
    render(<PrimaryActionButton icon="graph">Show Graph</PrimaryActionButton>);
    expect(screen.getByText('Show Graph')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<PrimaryActionButton icon="graph" onClick={handleClick}>Show Graph</PrimaryActionButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<PrimaryActionButton icon="graph" disabled>Show Graph</PrimaryActionButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should have gradient background', () => {
    const { container } = render(<PrimaryActionButton icon="graph">Show Graph</PrimaryActionButton>);
    const button = container.querySelector('button');
    expect(button).toHaveStyle({ background: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 186) 100%)' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/buttons/__tests__/PrimaryActionButton.test.tsx --run
```

Expected: FAIL with "component not found"

- [ ] **Step 3: Create PrimaryActionButton component**

```typescript
// src/components/buttons/PrimaryActionButton.tsx
import { ButtonHTMLAttributes } from 'react';
import { Graph } from 'lucide-react';
import './PrimaryActionButton.css';

export interface PrimaryActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  children: string;
}

export function PrimaryActionButton({ icon, children, disabled, onClick, ...props }: PrimaryActionButtonProps) {
  const iconMap: Record<string, React.ReactNode> = {
    graph: <Graph size={20} />,
    // Add more icons as needed
  };

  return (
    <button
      className="primary-action-button"
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {iconMap[icon] || icon}
      <span>{children}</span>
    </button>
  );
}
```

- [ ] **Step 4: Create CSS with gradient and hover animation**

```css
/* src/components/buttons/PrimaryActionButton.css */
.primary-action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.primary-action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.primary-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/buttons/__tests__/PrimaryActionButton.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/buttons/
git commit -m "feat: create PrimaryActionButton with gradient and hover animation"
```

### Task 6: Create SecondaryActionButton Component

**Files:**
- Create: `src/components/buttons/SecondaryActionButton.tsx`
- Create: `src/components/buttons/SecondaryActionButton.css`
- Create: `src/components/buttons/__tests__/SecondaryActionButton.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecondaryActionButton } from '../SecondaryActionButton';

describe('SecondaryActionButton', () => {
  it('should render with icon and text', () => {
    render(<SecondaryActionButton icon="file">Generate XML</SecondaryActionButton>);
    expect(screen.getByText('Generate XML')).toBeInTheDocument();
  });

  it('should have light blue background', () => {
    const { container } = render(<SecondaryActionButton icon="file">Generate XML</SecondaryActionButton>);
    const button = container.querySelector('button');
    expect(button).toHaveStyle({ backgroundColor: '#f0f4ff' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/buttons/__tests__/SecondaryActionButton.test.tsx --run
```

Expected: FAIL

- [ ] **Step 3: Create SecondaryActionButton component**

```typescript
// src/components/buttons/SecondaryActionButton.tsx
import { ButtonHTMLAttributes } from 'react';
import { FileText, FileCode, CheckCircle, Link } from 'lucide-react';
import './SecondaryActionButton.css';

export interface SecondaryActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  children: string;
}

export function SecondaryActionButton({ icon, children, onClick, ...props }: SecondaryActionButtonProps) {
  const iconMap: Record<string, React.ReactNode> = {
    file: <FileText size={18} />,
    'file-code': <FileCode size={18} />,
    check: <CheckCircle size={18} />,
    link: <Link size={18} />,
  };

  return (
    <button
      className="secondary-action-button"
      onClick={onClick}
      {...props}
    >
      {iconMap[icon] || icon}
      <span>{children}</span>
    </button>
  );
}
```

- [ ] **Step 4: Create CSS styles**

```css
/* src/components/buttons/SecondaryActionButton.css */
.secondary-action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: #f0f4ff;
  color: #2196f3;
  border: 1px solid #e3f2fd;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-action-button:hover:not(:disabled) {
  background: #e3f2fd;
  border-color: #2196f3;
}

.secondary-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/buttons/__tests__/SecondaryActionButton.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/buttons/
git commit -m "feat: create SecondaryActionButton with light blue styling"
```

### Task 7: Create ActionsPanel Component

**Files:**
- Create: `src/components/actions/ActionsPanel.tsx`
- Create: `src/components/actions/ActionsPanel.css`
- Create: `src/components/actions/__tests__/ActionsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionsPanel } from '../ActionsPanel';
import { DocumentType } from '@/types';

describe('ActionsPanel', () => {
  it('should render XSD actions when document is XSD', () => {
    const mockDoc = { type: DocumentType.XSD, id: '1' };
    render(<ActionsPanel document={mockDoc} onShowGraph={vi.fn()} onGenerateXML={vi.fn()} />);
    expect(screen.getByText('Show Graph')).toBeInTheDocument();
    expect(screen.getByText('Generate XML')).toBeInTheDocument();
    expect(screen.queryByText('Generate XSD')).not.toBeInTheDocument();
  });

  it('should render XML actions when document is XML', () => {
    const mockDoc = { type: DocumentType.XML, id: '1' };
    render(<ActionsPanel document={mockDoc} onGenerateXSD={vi.fn()} onAssignSchema={vi.fn()} />);
    expect(screen.getByText('Generate XSD')).toBeInTheDocument();
    expect(screen.queryByText('Show Graph')).not.toBeInTheDocument();
  });

  it('should render nothing when no document', () => {
    const { container } = render(<ActionsPanel document={null} />);
    expect(container.querySelector('.actions-panel')).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/actions/__tests__/ActionsPanel.test.tsx --run
```

Expected: FAIL

- [ ] **Step 3: Create ActionsPanel component**

```typescript
// src/components/actions/ActionsPanel.tsx
import { useMemo } from 'react';
import { DocumentType } from '@/types';
import type { Document } from '@/types';
import { PrimaryActionButton } from '@/components/buttons/PrimaryActionButton';
import { SecondaryActionButton } from '@/components/buttons/SecondaryActionButton';
import './ActionsPanel.css';

export interface ActionsPanelProps {
  document: Document | null;
  onShowGraph?: () => void;
  onGenerateXML?: () => void;
  onGenerateXSD?: () => void;
  onValidate?: () => void;
  onValidateXSD?: () => void;
  onAssignSchema?: () => void;
}

export function ActionsPanel({ document, ...handlers }: ActionsPanelProps) {
  const isXSD = document?.type === DocumentType.XSD;
  const isXML = document?.type === DocumentType.XML;

  if (!document) {
    return <div className="actions-panel" />;
  }

  return (
    <div className="actions-panel">
      {isXSD && (
        <>
          <PrimaryActionButton icon="graph" onClick={handlers.onShowGraph}>
            Show Graph
          </PrimaryActionButton>
          <SecondaryActionButton icon="file" onClick={handlers.onGenerateXML}>
            Generate XML
          </SecondaryActionButton>
          <SecondaryActionButton icon="check" onClick={handlers.onValidate}>
            Validate
          </SecondaryActionButton>
        </>
      )}

      {isXML && (
        <>
          <SecondaryActionButton icon="file-code" onClick={handlers.onGenerateXSD}>
            Generate XSD
          </SecondaryActionButton>
          <SecondaryActionButton icon="link" onClick={handlers.onAssignSchema}>
            Assign Schema
          </SecondaryActionButton>
          <SecondaryActionButton icon="check" onClick={handlers.onValidateXSD}>
            Validate XSD
          </SecondaryActionButton>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create minimal CSS**

```css
/* src/components/actions/ActionsPanel.css */
.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions-panel button {
  width: 100%;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/actions/__tests__/ActionsPanel.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/actions/
git commit -m "feat: create ActionsPanel with context-sensitive XSD/XML buttons"
```

### Task 8: Connect ActionsPanel to DocumentManager

**Files:**
- Modify: `src/core/documentManager/DocumentManager.tsx`

- [ ] **Step 1: Import ActionsPanel**

```typescript
// Add to imports
import { ActionsPanel } from '@/components/actions/ActionsPanel';
```

- [ ] **Step 2: Replace placeholder with ActionsPanel**

```typescript
// In DocumentManager, replace the placeholder div with:
<LeftSidebar
  actions={
    <ActionsPanel
      document={activeDocument}
      onShowGraph={() => setXsdViewMode('visualizer')}
      onGenerateXML={handleGenerateXMLFromXSD}
      onValidate={handleValidateXMLAgainstXSD}
      onGenerateXSD={handleGenerateXSDFromXML}
      onAssignSchema={handleAssignSchema}
      onValidateXSD={handleValidateXMLAgainstXSD}
    />
  }
  files={<div>{/* FilesPanel placeholder */}</div>}
/>
```

- [ ] **Step 3: Test in browser**

```bash
npm run dev
```

Expected: Sidebar appears with context-sensitive buttons

- [ ] **Step 4: Run integration tests**

```bash
npm test -- src/core/documentManager/__tests__/DocumentManager.test.tsx --run
```

Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add src/core/documentManager/
git commit -m "feat: connect ActionsPanel to DocumentManager with handlers"
```

---

## Phase 3: Files Panel (Document Management)

### Task 9: Create Badge Components

**Files:**
- Create: `src/components/badges/Badges.tsx`
- Create: `src/components/badges/Badges.css`
- Create: `src/components/badges/__tests__/Badges.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirtyBadge, ErrorBadge } from '../Badges';

describe('Badges', () => {
  it('should render dirty badge with orange dot', () => {
    const { container } = render(<DirtyBadge />);
    const badge = container.querySelector('.dirty-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: '#ff9800' });
  });

  it('should render error badge with count', () => {
    render(<ErrorBadge count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render empty fragment when count is 0', () => {
    const { container } = render(<ErrorBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/badges/__tests__/Badges.test.tsx --run
```

Expected: FAIL

- [ ] **Step 3: Create Badge components**

```typescript
// src/components/badges/Badges.tsx
import './Badges.css';

export interface DirtyBadgeProps {
  show?: boolean;
}

export function DirtyBadge({ show = true }: DirtyBadgeProps) {
  if (!show) return null;
  return <div className="dirty-badge" />;
}

export interface ErrorBadgeProps {
  count: number;
}

export function ErrorBadge({ count }: ErrorBadgeProps) {
  if (count === 0) return null;
  return <div className="error-badge">{count}</div>;
}
```

- [ ] **Step 4: Create CSS with pulse animation**

```css
/* src/components/badges/Badges.css */
.dirty-badge {
  width: 8px;
  height: 8px;
  background: #ff9800;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.error-badge {
  padding: 2px 6px;
  background: #f44336;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/badges/__tests__/Badges.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/badges/
git commit -m "feat: create DirtyBadge and ErrorBadge with pulse animation"
```

### Task 10: Create FilesPanel Component

**Files:**
- Create: `src/components/files/FilesPanel.tsx`
- Create: `src/components/files/FilesPanel.css`
- Create: `src/components/files/__tests__/FilesPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilesPanel } from '../FilesPanel';
import { DocumentType, DocumentStatus } from '@/types';

describe('FilesPanel', () => {
  const mockDocuments = [
    { id: '1', name: 'schema.xsd', type: DocumentType.XSD, status: DocumentStatus.DIRTY },
    { id: '2', name: 'data.xml', type: DocumentType.XML, status: DocumentStatus.CLEAN }
  ];

  it('should render all documents', () => {
    render(<FilesPanel documents={mockDocuments} activeDocumentId="1" onDocumentSelect={vi.fn()} />);
    expect(screen.getByText('schema.xsd')).toBeInTheDocument();
    expect(screen.getByText('data.xml')).toBeInTheDocument();
  });

  it('should highlight active document', () => {
    const { container } = render(<FilesPanel documents={mockDocuments} activeDocumentId="1" onDocumentSelect={vi.fn()} />);
    const activeItem = container.querySelector('.file-item.active');
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent('schema.xsd');
  });

  it('should show dirty badge for dirty documents', () => {
    const { container } = render(<FilesPanel documents={mockDocuments} activeDocumentId="1" onDocumentSelect={vi.fn()} />);
    expect(container.querySelector('.dirty-badge')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/files/__tests__/FilesPanel.test.tsx --run
```

Expected: FAIL

- [ ] **Step 3: Create FilesPanel component**

```typescript
// src/components/files/FilesPanel.tsx
import { useMemo } from 'react';
import { Document } from '@/types';
import { File, FileCode } from 'lucide-react';
import { DirtyBadge, ErrorBadge } from '@/components/badges';
import type { ValidationError } from '@/types';
import './FilesPanel.css';

export interface FilesPanelProps {
  documents: Document[];
  activeDocumentId: string;
  onDocumentSelect: (id: string) => void;
  validationErrors: Map<string, ValidationError[]>;
}

export function FilesPanel({ documents, activeDocumentId, onDocumentSelect, validationErrors }: FilesPanelProps) {
  const sortedDocs = useMemo(() =>
    [...documents].sort((a, b) => a.name.localeCompare(b.name)),
    [documents]
  );

  return (
    <div className="files-panel">
      {sortedDocs.map(doc => {
        const isActive = doc.id === activeDocumentId;
        const errorCount = validationErrors.get(doc.id)?.length || 0;
        const isDirty = doc.status === 'dirty';

        return (
          <div
            key={doc.id}
            className={`file-item ${isActive ? 'active' : ''}`}
            onClick={() => onDocumentSelect(doc.id)}
          >
            <FileIcon type={doc.type} />
            <span className="file-name">{doc.name}</span>
            {isDirty && <DirtyBadge show />}
            {errorCount > 0 && <ErrorBadge count={errorCount} />}
          </div>
        );
      })}
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  return type === 'xsd'
    ? <FileCode size={16} color="#666" />
    : <File size={16} color="#666" />;
}
```

- [ ] **Step 4: Create CSS styles**

```css
/* src/components/files/FilesPanel.css */
.files-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  opacity: 0.6;
}

.file-item:hover {
  background: #f5f5f5;
}

.file-item.active {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
  border-radius: 0 6px 6px 0;
  opacity: 1;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #333;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/components/files/__tests__/FilesPanel.test.tsx --run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/files/
git commit -m "feat: create FilesPanel with document list and badges"
```

### Task 11: Connect FilesPanel to DocumentManager

**Files:**
- Modify: `src/core/documentManager/DocumentManager.tsx`

- [ ] **Step 1: Replace placeholder with FilesPanel**

```typescript
// In DocumentManager, replace:
files={
  <FilesPanel
    documents={getAllDocuments()}
    activeDocumentId={activeDocument?.id || ''}
    onDocumentSelect={setActiveDocument}
    validationErrors={xsdErrors}
  />
}
```

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Expected: Files panel shows open documents with badges

- [ ] **Step 3: Commit**

```bash
git add src/core/documentManager/
git commit -m "feat: connect FilesPanel to DocumentManager"
```

---

## Phase 4: Visual Polish (Styling & Animations)

### Task 12: Refactor DocumentToolbar to TopBar

**Files:**
- Modify: `src/core/documentManager/DocumentToolbar.tsx` → Rename to `TopBar.tsx`
- Modify: `src/core/documentManager/DocumentToolbar.css` → Rename to `TopBar.css`
- Modify: `src/core/documentManager/index.ts`

- [ ] **Step 1: Rename files**

```bash
cd src/core/documentManager
git mv DocumentToolbar.tsx TopBar.tsx
git mv DocumentToolbar.css TopBar.css
```

- [ ] **Step 2: Update component name and simplify props**

```typescript
// In TopBar.tsx, rename component and remove XSD-specific props:
export function TopBar({
  onNewFile,
  onOpenFile,
  onSaveFile,
  hasActiveDocument,
}: TopBarProps) {
  // Remove: isActiveXML, isActiveXSD, onGenerateXSD, onGenerateXML, onValidateXSD, onAssignSchema

  // Update return to only show file operation buttons
}
```

- [ ] **Step 3: Update CSS for modern styling**

```css
/* Update TopBar.css with modern styling */
.document-toolbar {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.toolbar-button {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toolbar-button:hover:not(:disabled) {
  border-color: #2196f3;
  color: #2196f3;
}
```

- [ ] **Step 4: Update imports in DocumentManager and index**

```typescript
// Update imports in DocumentManager.tsx
import { TopBar } from './TopBar';

// Update export in index.ts
export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';
```

- [ ] **Step 5: Run tests**

```bash
npm test -- src/core/documentManager/__tests__/TopBar.test.tsx --run
```

Expected: Tests pass (update test name to TopBar)

- [ ] **Step 6: Commit**

```bash
git add src/core/documentManager/
git commit -m "refactor: rename DocumentToolbar to TopBar and simplify"
```

### Task 13: Add Tooltips to All Buttons

**Files:**
- Modify: `src/components/buttons/PrimaryActionButton.tsx`
- Modify: `src/components/buttons/SecondaryActionButton.tsx`

- [ ] **Step 1: Add Tippy.js tooltip to PrimaryActionButton**

```typescript
// Update PrimaryActionButton.tsx
import { useTooltip } from '@tippyjs/react';
import 'tippy.js/animations/scale.css';
import { Graph } from 'lucide-react';

export function PrimaryActionButton({ icon, children, disabled, onClick, ...props }: PrimaryActionButtonProps) {
  // Add tooltip based on button text
  const tooltipText = children.toString();

  return (
    <button
      className="primary-action-button"
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {iconMap[icon] || icon}
      <span>{children}</span>
    </button>
  );
}

// Wrap component with tooltip at bottom
```

- [ ] **Step 2: Add Tippy.js wrapper**

```typescript
// Create tooltip wrapper component
import { useTooltip } from '@tippyjs/react';
import 'tippy.js/animations/scale.css';

export function withTooltip<P extends object>(
  Component: React.ComponentType<P>,
  content: string
) {
  return function WithTooltip(props: P) {
    const { ref, ...rest } = props as any;
    const tooltip = useTooltip({ content, animation: 'scale' });

    return (
      <>
        <Component ref={(node: any) => {
          ref(node);
          if (tooltip) tooltip[0] = node;
          return node;
        }} {...rest} />
      </>
    );
  };
}
```

- [ ] **Step 3: Test tooltips work**

```bash
npm run dev
```

Expected: Tooltips appear on hover

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add tooltips to action buttons using Tippy.js"
```

### Task 14: Apply Modern Blue Color Scheme Globally

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/styles/theme.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Create theme CSS variables**

```css
/* src/styles/theme.css */
:root {
  /* Primary colors */
  --primary-blue: #2196f3;
  --primary-light: #e3f2fd;
  --primary-dark: #1976d2;
  --gradient-start: #667eea;
  --gradient-end: #764ba2;

  /* Neutral colors */
  --bg-body: #f8f9fa;
  --bg-white: #ffffff;
  --border-color: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-disabled: #999999;

  /* Status colors */
  --error: #f44336;
  --warning: #ff9800;
  --success: #4caf50;
  --info: #2196f3;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.18);
}
```

- [ ] **Step 2: Import theme in index.css**

```css
/* In src/index.css, add at top after existing CSS */
@import './styles/theme.css';
```

- [ ] **Step 3: Update global styles to use variables**

```css
/* Update body */
body {
  background: var(--bg-body);
  color: var(--text-primary);
}

/* Update buttons */
button {
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/
git commit -m "feat: add modern blue theme CSS variables"
```

---

## Phase 5: Integration & Testing

### Task 15: Update All Tests for New Layout

**Files:**
- Modify: All test files that reference old component names

- [ ] **Step 1: Find all tests referencing DocumentToolbar**

```bash
grep -r "DocumentToolbar" src/ --include="*.test.tsx" --include="*.test.ts"
```

- [ ] **Step 2: Update imports and references**

```typescript
// Update all test files:
import { TopBar } from '@/core/documentManager/TopBar';
// Change all DocumentToolbar references to TopBar
```

- [ ] **Step 3: Run all tests**

```bash
npm test -- --run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: update all tests for TopBar rename"
```

### Task 16: Add Responsive Sidebar Toggle

**Files:**
- Create: `src/components/layout/SidebarToggle.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create SidebarToggle component**

```typescript
// src/components/layout/SidebarToggle.tsx
import { Menu, X } from 'lucide-react';
import './SidebarToggle.css';

export interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <button
      className="sidebar-toggle"
      onClick={onToggle}
      aria-label="Toggle sidebar"
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
}
```

- [ ] **Step 2: Create toggle CSS**

```css
/* src/components/layout/SidebarToggle.css */
.sidebar-toggle {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1100;
  padding: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: block;
  }
}
```

- [ ] **Step 3: Integrate toggle into AppLayout**

```typescript
// Add state and toggle logic to AppLayout
const [isSidebarOpen, setSidebarOpen] = useState(false);

// Render toggle button on mobile
<MediaQuery below={768}>
  <SidebarToggle isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(!isSidebarOpen)} />
</MediaQuery>

// Add class based on state
<aside className={`left-sidebar ${isSidebarOpen ? 'open' : ''}`}>
```

- [ ] **Step 4: Test responsive behavior**

```bash
npm run dev
```

Expected: On mobile (< 768px), toggle button appears and sidebar slides

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add responsive sidebar toggle for mobile"
```

### Task 17: E2E Test - Full UI Workflow

**Files:**
- Create: `src/__tests__/e2e/modern-ui-workflow.test.tsx`

- [ ] **Step 1: Write comprehensive E2E test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentManager } from '@/core/documentManager';
import { DocumentType } from '@/types';
import { createDocument } from '@/services/document';

describe('Modern UI Workflow E2E', () => {
  it('should show sidebar with actions when XSD file is opened', async () => {
    const { container } = render(<DocumentManager />);

    // Open XSD file
    const xsdContent = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="test"/></xs:schema>';
    const file = new File([xsdContent], 'test.xsd', { type: 'application/xml' });

    // Simulate file open
    // (implementation depends on file handling)

    await waitFor(() => {
      expect(screen.getByText('Show Graph')).toBeInTheDocument();
      expect(screen.getByText('Generate XML')).toBeInTheDocument();
    });
  });

  it('should show different actions when XML file is active', async () => {
    // Similar test for XML
  });

  it('should display error badge when validation fails', async () => {
    // Test error badge display
  });

  it('should toggle sidebar on mobile', () => {
    // Test responsive behavior
  });
});
```

- [ ] **Step 2: Run E2E test**

```bash
npm test -- src/__tests__/e2e/modern-ui-workflow.test.tsx --run
```

Expected: Tests pass (may need Playwright for full E2E)

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/
git commit -m "test: add E2E tests for modern UI workflow"
```

### Task 18: Update Documentation

**Files:**
- Modify: `docs/superpowers/plans/2026-03-31-modern-ui-redesign.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update implementation plan status**

```markdown
# Modern UI Redesign - Implementation Plan

**Status:** ✅ Complete
**Completed:** 2026-03-31
**Commits:** 18 tasks
```

- [ ] **Step 2: Update CLAUDE.md with UI improvements**

```markdown
## UI Modernization (2026-03-31)

- Modern blue color scheme with gradients (#2196f3, #667eea)
- Left sidebar (240px) with context-sensitive actions
- Dynamic buttons based on file type (XML/XSD)
- SVG icons (Lucide) replace emoji
- Micro-animations, tooltips, notification badges
- Responsive design with mobile sidebar toggle
```

- [ ] **Step 3: Commit**

```bash
git add docs/ CLAUDE.md
git commit -m "docs: update documentation for modern UI redesign"
```

### Task 19: Final Verification

**Files:**
- All files

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --run
```

Expected: All tests pass

- [ ] **Step 2: Type check**

```bash
npm run type-check
```

Expected: No type errors

- [ ] **Step 3: Build production bundle**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Manual checks:
- ✅ Open XML file → see XML actions
- ✅ Open XSD file → see XSD actions with "Show Graph" prominent
- ✅ Switch files → actions update dynamically
- ✅ Dirty files show orange dot badge
- ✅ Files with errors show red count badge
- ✅ Hover over buttons shows tooltips
- ✅ Mobile responsive (< 768px) shows toggle button

- [ ] **Step 5: Create final commit tag**

```bash
git tag -a v0.2.0-modern-ui -m "Modern UI redesign - sidebar, actions, badges"
git push origin main --tags
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: complete modern UI redesign implementation"
```

---

## Summary

**Total Tasks:** 19
**Estimated Effort:** 3-4 days (assuming subagent-driven development)
**Files Created:** ~15 new components
**Files Modified:** ~8 existing files
**Test Coverage Target:** >80% for new components

**Key Deliverables:**
1. ✅ Modern split layout with 240px left sidebar
2. ✅ Context-sensitive action buttons (XSD vs XML)
3. ✅ Primary "Show Graph" button with gradient
4. ✅ SVG icons throughout
5. ✅ Hover animations and tooltips
6. ✅ Notification badges (dirty state, error count)
7. ✅ Responsive mobile design
8. ✅ All existing functionality preserved
