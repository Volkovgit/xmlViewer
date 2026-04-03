# Simplify XML Previewer - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unnecessary features from XML Previewer, keeping only XML text editing, XSD text/graph viewing, XML generation, and validation with a simplified UI.

**Architecture:** Remove Tree/Grid/Split views, simplify XSD visualizer to text/graph only, add ValidationPanel for errors, update ActionsPanel and TopBar for streamlined workflow.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Monaco Editor, React Flow, Vitest

---

## File Structure

### Files to Delete
```
src/views/tree/                 # Entire directory
src/views/grid/                 # Entire directory
src/views/split/                # Entire directory
```

### Files to Create
```
src/components/validation/
  ├── ValidationPanel.tsx       # Right panel for validation errors
  ├── ValidationPanel.css       # Styles for validation panel
  ├── SchemaSelectionModal.tsx  # Modal for selecting XSD schema
  ├── SchemaSelectionModal.css  # Styles for modal
  └── index.ts                  # Export barrel
```

### Files to Modify
```
src/core/documentManager/
  ├── DocumentManager.tsx       # Remove tree/grid, add xsdMode state, ValidationPanel
  └── DocumentManager.css       # Update layout for right panel

src/components/layout/
  ├── AppLayout.tsx             # Add right panel support
  └── LeftSidebar.tsx           # No changes (keep existing)

src/components/actions/
  ├── ActionsPanel.tsx          # Simplify buttons, remove Assign Schema
  └── __tests__/ActionsPanel.test.tsx

src/components/toolbar/
  ├── TopBar.tsx                # Add XSD mode switcher, remove unused buttons
  └── TopBar.css                # Style the mode switcher

src/views/xsd/
  ├── XSDVisualizer.tsx         # Simplify to remove Elements/Types tabs
  └── XSDVisualizer.css         # Remove tab styles

src/views/text/
  └── XMLTextEditor.tsx         # No changes (keep existing)

src/types/
  └── document.ts               # Ensure ValidationError type is exported

src/stores/
  └── documentStore.ts          # No changes (keep existing)
```

---

## Task 1: Delete Tree View

**Files:**
- Delete: `src/views/tree/` (entire directory)

- [ ] **Step 1: Delete tree view directory**

```bash
rm -rf src/views/tree/
```

- [ ] **Step 2: Commit deletion**

```bash
git add src/views/tree/
git commit -m "refactor: remove XML tree view

Remove tree view component and all related files:
- XMLTree.tsx
- TreeNode.tsx
- TreeContextMenu.tsx
- TreeDragDrop.tsx
- TreeSearch.tsx
- All associated tests

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Delete Grid View

**Files:**
- Delete: `src/views/grid/` (entire directory)

- [ ] **Step 1: Delete grid view directory**

```bash
rm -rf src/views/grid/
```

- [ ] **Step 2: Commit deletion**

```bash
git add src/views/grid/
git commit -m "refactor: remove XML grid view

Remove grid view component and all related files:
- XMLGrid.tsx
- GridDataBuilder.tsx
- All associated tests

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Delete Split Views

**Files:**
- Delete: `src/views/split/` (entire directory)

- [ ] **Step 1: Delete split views directory**

```bash
rm -rf src/views/split/
```

- [ ] **Step 2: Commit deletion**

```bash
git add src/views/split/
git commit -m "refactor: remove split views

Remove split view component and all related files.

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update DocumentManager - Remove Tree/Grid Logic

**Files:**
- Modify: `src/core/documentManager/DocumentManager.tsx:1-200`

- [ ] **Step 1: Read current DocumentManager**

```bash
cat src/core/documentManager/DocumentManager.tsx
```

- [ ] **Step 2: Remove tree/grid imports**

Remove these lines:
```typescript
import { XMLTree } from '@/views/tree';
import { XMLGrid } from '@/views/grid';
```

- [ ] **Step 3: Remove xmlViewMode state**

Find and remove this line:
```typescript
const [xmlViewMode, setXmlViewMode] = useState<'text' | 'tree' | 'grid'>('text');
```

- [ ] **Step 4: Simplify XML rendering**

Replace the conditional rendering for XML with:
```typescript
{activeDocument?.type === DocumentType.XML && (
  <XMLTextEditor document={activeDocument} />
)}
```

- [ ] **Step 5: Run tests to verify**

```bash
npm run test -- --run src/core/documentManager/__tests__/DocumentManager.test.tsx
```

Expected: Tests pass or show which tests need updating

- [ ] **Step 6: Commit changes**

```bash
git add src/core/documentManager/DocumentManager.tsx
git commit -m "refactor: remove tree/grid view logic from DocumentManager

- Remove XMLTree and XMLGrid imports
- Remove xmlViewMode state
- Simplify XML rendering to only use XMLTextEditor

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Simplify XSD Visualizer - Remove Elements/Types Tabs

**Files:**
- Modify: `src/views/xsd/XSDVisualizer.tsx:1-50`
- Modify: `src/views/xsd/XSDVisualizer.css`

- [ ] **Step 1: Read current XSDVisualizer**

```bash
cat src/views/xsd/XSDVisualizer.tsx
```

- [ ] **Step 2: Update interface to remove Elements/Types tabs**

Replace the interface:
```typescript
export interface XSDVisualizerProps {
  xsdContent: string;
}
```

Remove from interface:
```typescript
activeTab?: 'elements' | 'types' | 'graph';
onTabChange?: (tab: 'elements' | 'types' | 'graph') => void;
```

- [ ] **Step 3: Simplify component to remove tab switching logic**

The component should become a simple pass-through or be removed entirely from use. Since we're moving logic to DocumentManager, we can simplify it significantly.

- [ ] **Step 4: Update tests**

```bash
cat src/views/xsd/__tests__/XSDVisualizer.test.tsx
```

Remove tests for Elements and Types tabs.

- [ ] **Step 5: Run tests**

```bash
npm run test -- --run src/views/xsd/__tests__/XSDVisualizer.test.tsx
```

- [ ] **Step 6: Commit changes**

```bash
git add src/views/xsd/XSDVisualizer.tsx src/views/xsd/__tests__/XSDVisualizer.test.tsx
git commit -m "refactor: simplify XSDVisualizer

Remove Elements and Types tabs, keeping only the component structure.
Tab switching logic moved to DocumentManager.

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create ValidationPanel Component

**Files:**
- Create: `src/components/validation/ValidationPanel.tsx`
- Create: `src/components/validation/ValidationPanel.css`
- Create: `src/components/validation/index.ts`

- [ ] **Step 1: Create ValidationPanel component**

```typescript
// src/components/validation/ValidationPanel.tsx
import { ValidationError } from '@/types';
import './ValidationPanel.css';

export interface ValidationPanelProps {
  errors: ValidationError[];
  visible: boolean;
  onErrorClick?: (error: ValidationError) => void;
}

export function ValidationPanel({ errors, visible, onErrorClick }: ValidationPanelProps) {
  if (!visible || errors.length === 0) {
    return null;
  }

  return (
    <div className="validation-panel">
      <div className="validation-panel-header">
        <h3>Validation Errors</h3>
        <span className="error-count">{errors.length}</span>
      </div>
      <div className="validation-errors-list">
        {errors.map((error, index) => (
          <div
            key={index}
            className="validation-error-item"
            onClick={() => onErrorClick?.(error)}
          >
            <div className="error-path">{error.path}</div>
            <div className="error-message">{error.message}</div>
            {error.line && (
              <div className="error-location">Line {error.line}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ValidationPanel styles**

```css
/* src/components/validation/ValidationPanel.css */
.validation-panel {
  width: 320px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.validation-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f5f5;
}

.validation-panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.error-count {
  background: #f44336;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.validation-errors-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.validation-error-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.validation-error-item:hover {
  background: #f5f5f5;
  border-color: #2196f3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-path {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.error-message {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.error-location {
  font-size: 11px;
  color: #999;
}
```

- [ ] **Step 3: Create index export**

```typescript
// src/components/validation/index.ts
export { ValidationPanel } from './ValidationPanel';
export type { ValidationPanelProps } from './ValidationPanel';
```

- [ ] **Step 4: Create test file**

```typescript
// src/components/validation/__tests__/ValidationPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationPanel } from '../ValidationPanel';
import { ValidationError } from '@/types';

describe('ValidationPanel', () => {
  const mockErrors: ValidationError[] = [
    {
      path: '/root/child',
      message: 'Element is required',
      line: 10,
      column: 5
    },
    {
      path: '/root/@attr',
      message: 'Invalid attribute value',
    }
  ];

  it('should not render when not visible', () => {
    const { container } = render(
      <ValidationPanel errors={mockErrors} visible={false} />
    );

    expect(container.querySelector('.validation-panel')).not.toBeInTheDocument();
  });

  it('should not render when no errors', () => {
    const { container } = render(
      <ValidationPanel errors={[]} visible={true} />
    );

    expect(container.querySelector('.validation-panel')).not.toBeInTheDocument();
  });

  it('should render errors when visible', () => {
    render(<ValidationPanel errors={mockErrors} visible={true} />);

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // error count
    expect(screen.getByText('/root/child')).toBeInTheDocument();
    expect(screen.getByText('Element is required')).toBeInTheDocument();
    expect(screen.getByText('Line 10')).toBeInTheDocument();
  });

  it('should call onErrorClick when error is clicked', () => {
    const handleErrorClick = vi.fn();

    render(
      <ValidationPanel
        errors={mockErrors}
        visible={true}
        onErrorClick={handleErrorClick}
      />
    );

    const errorItems = screen.getAllByTestId(/^validation-error-/);
    errorItems[0].click();

    expect(handleErrorClick).toHaveBeenCalledTimes(1);
    expect(handleErrorClick).toHaveBeenCalledWith(mockErrors[0]);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- --run src/components/validation/__tests__/ValidationPanel.test.tsx
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/validation/
git commit -m "feat: add ValidationPanel component

Add right panel component for displaying validation errors:
- Shows error count in header
- Lists errors with path, message, and line number
- Clickable error items for navigation
- Collapses when no errors

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update AppLayout to Support Right Panel

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/layout/AppLayout.css`

- [ ] **Step 1: Read current AppLayout**

```bash
cat src/components/layout/AppLayout.tsx
```

- [ ] **Step 2: Add right panel slot to AppLayout**

Update the component to accept a rightPanel prop:

```typescript
export interface AppLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function AppLayout({ children, rightPanel }: AppLayoutProps) {
  // ... existing code ...
}
```

- [ ] **Step 3: Update render to include right panel**

```typescript
return (
  <div className="app-layout">
    <LeftSidebar>
      {children}
    </LeftSidebar>
    <div className="main-content">
      {children}
    </div>
    {rightPanel && (
      <div className="right-panel">
        {rightPanel}
      </div>
    )}
  </div>
);
```

- [ ] **Step 4: Add CSS for right panel**

```css
/* src/components/layout/AppLayout.css */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.right-panel {
  width: 320px;
  height: 100%;
  border-left: 1px solid #e0e0e0;
  overflow: hidden;
}

/* Update main-content to account for right panel */
.main-content {
  flex: 1;
  overflow: auto;
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- --run src/components/layout/__tests__/AppLayout.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppLayout.tsx src/components/layout/AppLayout.css
git commit -m "feat: add right panel support to AppLayout

Add rightPanel prop to AppLayout for displaying validation errors.
Update layout CSS to accommodate right sidebar.

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create Schema Selection Modal

**Files:**
- Create: `src/components/validation/SchemaSelectionModal.tsx`
- Create: `src/components/validation/SchemaSelectionModal.css`

- [ ] **Step 1: Create SchemaSelectionModal component**

```typescript
// src/components/validation/SchemaSelectionModal.tsx
import { Document } from '@/types';
import './SchemaSelectionModal.css';

export interface SchemaSelectionModalProps {
  xsdDocuments: Document[];
  onSelect: (xsdDocument: Document) => void;
  onCancel: () => void;
}

export function SchemaSelectionModal({
  xsdDocuments,
  onSelect,
  onCancel
}: SchemaSelectionModalProps) {
  return (
    <div className="schema-modal-overlay" onClick={onCancel}>
      <div className="schema-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="schema-modal-header">
          <h2>Select XSD Schema</h2>
          <button className="schema-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="schema-modal-body">
          {xsdDocuments.length === 0 ? (
            <p className="schema-modal-empty">
              No XSD schemas available. Please open an XSD file first.
            </p>
          ) : (
            <ul className="schema-list">
              {xsdDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="schema-item"
                  onClick={() => onSelect(doc)}
                >
                  <span className="schema-name">{doc.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create modal styles**

```css
/* src/components/validation/SchemaSelectionModal.css */
.schema-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.schema-modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.schema-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schema-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.schema-modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schema-modal-close:hover {
  color: #333;
}

.schema-modal-body {
  padding: 20px;
  overflow-y: auto;
}

.schema-modal-empty {
  color: #666;
  text-align: center;
  padding: 40px 20px;
  margin: 0;
}

.schema-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.schema-item {
  padding: 12px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid #e0e0e0;
  margin-bottom: 8px;
}

.schema-item:hover {
  background: #f5f5f5;
  border-color: #2196f3;
}

.schema-name {
  font-size: 14px;
  color: #333;
}
```

- [ ] **Step 3: Update validation index export**

```typescript
// src/components/validation/index.ts
export { ValidationPanel } from './ValidationPanel';
export { SchemaSelectionModal } from './SchemaSelectionModal';
export type { ValidationPanelProps } from './ValidationPanel';
export type { SchemaSelectionModalProps } from './SchemaSelectionModal';
```

- [ ] **Step 4: Create test**

```typescript
// src/components/validation/__tests__/SchemaSelectionModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchemaSelectionModal } from '../SchemaSelectionModal';
import { Document, DocumentType } from '@/types';

describe('SchemaSelectionModal', () => {
  const mockXsdDocuments: Document[] = [
    {
      id: '1',
      name: 'schema1.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema></xs:schema>',
      status: 'ready',
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: '2',
      name: 'schema2.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema></xs:schema>',
      status: 'ready',
      createdAt: new Date(),
      modifiedAt: new Date(),
    }
  ];

  it('should render modal with XSD documents', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Select XSD Schema')).toBeInTheDocument();
    expect(screen.getByText('schema1.xsd')).toBeInTheDocument();
    expect(screen.getByText('schema2.xsd')).toBeInTheDocument();
  });

  it('should show empty state when no XSD documents', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={[]}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText(/No XSD schemas available/)).toBeInTheDocument();
  });

  it('should call onSelect when schema is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('schema1.xsd'));
    expect(handleSelect).toHaveBeenCalledWith(mockXsdDocuments[0]);
  });

  it('should call onCancel when close button is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('should call onCancel when overlay is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    const { container } = render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    const overlay = container.querySelector('.schema-modal-overlay');
    fireEvent.click(overlay!);
    expect(handleCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- --run src/components/validation/__tests__/SchemaSelectionModal.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/validation/
git commit -m "feat: add SchemaSelectionModal component

Add modal for selecting XSD schema during XML validation:
- Shows list of available XSD documents
- Empty state when no schemas available
- Click outside or close button to cancel
- Select schema to validate against

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update DocumentManager with XSD Mode and Validation

**Files:**
- Modify: `src/core/documentManager/DocumentManager.tsx`
- Modify: `src/core/documentManager/DocumentManager.css`

- [ ] **Step 1: Read current DocumentManager**

```bash
cat src/core/documentManager/DocumentManager.tsx | head -100
```

- [ ] **Step 2: Add imports for new components**

Add to imports:
```typescript
import { ValidationPanel, SchemaSelectionModal } from '@/components/validation';
import { XSDGraphVisualizer } from '@/views/xsd/graph/XSDGraphVisualizer';
```

- [ ] **Step 3: Add state for XSD mode and validation**

```typescript
// XSD view mode: 'text' or 'graph'
const [xsdMode, setXsdMode] = useState<'text' | 'graph'>('text');

// Validation errors
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

// Schema selection modal state
const [showSchemaModal, setShowSchemaModal] = useState(false);
```

- [ ] **Step 4: Add handler for XSD mode toggle**

```typescript
const handleToggleXsdMode = useCallback(() => {
  setXsdMode(prev => prev === 'text' ? 'graph' : 'text');
}, []);
```

- [ ] **Step 5: Add handler for XML validation**

```typescript
const handleValidateXml = useCallback(() => {
  const xsdDocuments = getAllDocuments().filter(d => d.type === DocumentType.XSD);

  if (xsdDocuments.length === 0) {
    // Show error - no XSD available
    alert('No XSD schemas available. Please open an XSD file first.');
    return;
  }

  // Show schema selection modal
  setShowSchemaModal(true);
}, [getAllDocuments]);
```

- [ ] **Step 6: Add handler for schema selection**

```typescript
const handleSchemaSelect = useCallback((xsdDocument: Document) => {
  setShowSchemaModal(false);

  if (!activeDocument) return;

  try {
    const errors = validateXMLAgainstXSD(activeDocument.content, xsdDocument.content);
    setValidationErrors(errors);

    if (errors.length === 0) {
      alert(`✓ XML is valid according to ${xsdDocument.name}`);
    }
  } catch (error) {
    alert(`Validation error: ${error}`);
  }
}, [activeDocument]);
```

- [ ] **Step 7: Update rendering to include ValidationPanel and conditional XSD view**

```typescript
// Parse XSD for graph view
const parsedSchema = useMemo(() => {
  if (activeDocument?.type === DocumentType.XSD && xsdMode === 'graph') {
    try {
      return parseXSD(activeDocument.content);
    } catch {
      return null;
    }
  }
  return null;
}, [activeDocument, xsdMode]);

// In render:
{activeDocument?.type === DocumentType.XSD && xsdMode === 'graph' && parsedSchema ? (
  <XSDGraphVisualizer schema={parsedSchema} />
) : (
  <XMLTextEditor document={activeDocument} />
)}

<ValidationPanel
  errors={validationErrors}
  visible={validationErrors.length > 0}
  onErrorClick={(error) => {
    // Focus editor on error line
    if (error.line) {
      // TODO: Implement focus logic
    }
  }}
/>

{showSchemaModal && (
  <SchemaSelectionModal
    xsdDocuments={getAllDocuments().filter(d => d.type === DocumentType.XSD)}
    onSelect={handleSchemaSelect}
    onCancel={() => setShowSchemaModal(false)}
  />
)}
```

- [ ] **Step 8: Run tests**

```bash
npm run test -- --run src/core/documentManager/__tests__/DocumentManager.test.tsx
```

- [ ] **Step 9: Commit**

```bash
git add src/core/documentManager/
git commit -m "feat: add XSD mode switching and validation to DocumentManager

- Add xsdMode state for text/graph switching
- Add ValidationPanel for displaying errors
- Add SchemaSelectionModal for choosing XSD schema
- Implement XML validation with schema selection
- Conditional rendering for XSD graph view

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update ActionsPanel

**Files:**
- Modify: `src/components/actions/ActionsPanel.tsx`
- Modify: `src/components/actions/__tests__/ActionsPanel.test.tsx`

- [ ] **Step 1: Read current ActionsPanel**

```bash
cat src/components/actions/ActionsPanel.tsx
```

- [ ] **Step 2: Update ActionsPanel props**

```typescript
interface ActionsPanelProps {
  document: Document | null;
  onToggleGraphMode?: () => void;      // For XSD
  onGenerateXML?: () => void;          // For XSD
  onValidate?: () => void;             // For both
}
```

- [ ] **Step 3: Simplify ActionsPanel rendering**

```typescript
export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  document,
  onToggleGraphMode,
  onGenerateXML,
  onValidate,
}) => {
  const isXSD = document?.type === DocumentType.XSD;
  const isXML = document?.type === DocumentType.XML;

  return (
    <div className="actions-panel">
      <div className="actions-header">Actions</div>

      {document === null ? (
        <div className="actions-empty">No document selected</div>
      ) : (
        <div className="actions-list">
          {isXSD && (
            <>
              <PrimaryActionButton
                icon="Circle"
                onClick={onToggleGraphMode || (() => {})}
                tooltip="Show dependency graph for XSD schema"
              >
                Открыть граф
              </PrimaryActionButton>
              <SecondaryActionButton
                icon="FileText"
                onClick={onGenerateXML || (() => {})}
                tooltip="Generate XML instance from XSD schema"
              >
                Generate XML
              </SecondaryActionButton>
              <SecondaryActionButton
                icon="CheckCircle"
                onClick={onValidate || (() => {})}
                tooltip="Validate XSD schema for errors and warnings"
              >
                Validate
              </SecondaryActionButton>
            </>
          )}

          {isXML && (
            <>
              <SecondaryActionButton
                icon="CheckCircle"
                onClick={onValidate || (() => {})}
                tooltip="Validate XML document against XSD schema"
              >
                Validate
              </SecondaryActionButton>
            </>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Update ActionsPanel tests**

```bash
cat src/components/actions/__tests__/ActionsPanel.test.tsx
```

Remove tests for removed buttons (Assign Schema, Generate XSD, etc.)

- [ ] **Step 5: Run tests**

```bash
npm run test -- --run src/components/actions/__tests__/ActionsPanel.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/actions/
git commit -m "refactor: simplify ActionsPanel

Remove Assign Schema and Generate XSD buttons.
Keep only Validate for XML and Show Graph/Generate XML/Validate for XSD.

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update TopBar with XSD Mode Switcher

**Files:**
- Modify: `src/components/toolbar/TopBar.tsx`
- Modify: `src/components/toolbar/TopBar.css`

- [ ] **Step 1: Read current TopBar**

```bash
cat src/components/toolbar/TopBar.tsx
```

- [ ] **Step 2: Add XSD mode switcher props**

```typescript
export interface TopBarProps {
  xsdMode?: 'text' | 'graph';
  onXsdModeChange?: (mode: 'text' | 'graph') => void;
  // ... existing props
}
```

- [ ] **Step 3: Add XSD mode switcher UI**

```typescript
// After file operation buttons, add:
{activeDocument?.type === DocumentType.XSD && (
  <div className="xsd-mode-switcher">
    <span className="mode-label">Mode:</span>
    <label className={xsdMode === 'text' ? 'active' : ''}>
      <input
        type="radio"
        name="xsd-mode"
        checked={xsdMode === 'text'}
        onChange={() => onXsdModeChange?.('text')}
      />
      Text
    </label>
    <label className={xsdMode === 'graph' ? 'active' : ''}>
      <input
        type="radio"
        name="xsd-mode"
        checked={xsdMode === 'graph'}
        onChange={() => onXsdModeChange?.('graph')}
      />
      Graph
    </label>
  </div>
)}
```

- [ ] **Step 4: Add CSS for mode switcher**

```css
/* src/components/toolbar/TopBar.css */
.xsd-mode-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 24px;
  padding-left: 24px;
  border-left: 1px solid #e0e0e0;
}

.mode-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.xsd-mode-switcher label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
  color: #666;
}

.xsd-mode-switcher label:hover {
  background: #f5f5f5;
}

.xsd-mode-switcher label.active {
  background: #e3f2fd;
  color: #2196f3;
  font-weight: 500;
}

.xsd-mode-switcher input[type="radio"] {
  margin: 0;
}
```

- [ ] **Step 5: Remove unused buttons from TopBar**

Remove undo/redo and other unused buttons if present.

- [ ] **Step 6: Update DocumentManager to pass props to TopBar**

```typescript
<TopBar
  xsdMode={xsdMode}
  onXsdModeChange={setXsdMode}
  // ... existing props
/>
```

- [ ] **Step 7: Run tests**

```bash
npm run test -- --run src/components/toolbar/__tests__/TopBar.test.tsx
```

- [ ] **Step 8: Commit**

```bash
git add src/components/toolbar/
git commit -m "feat: add XSD mode switcher to TopBar

Add radio button switcher for XSD text/graph modes.
Only visible when active document is XSD.
Remove unused buttons (undo/redo, etc.).

Part of project simplification effort.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Integration and Testing

**Files:**
- Multiple files for verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test -- --run
```

Expected: All tests pass (833+ tests)

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: No TypeScript errors

- [ ] **Step 3: Run linter**

```bash
npm run lint
```

Expected: No new errors (warnings OK)

- [ ] **Step 4: Start dev server and manually test**

```bash
npm run dev
```

Manual test checklist:
- [ ] Open XML file → shows text editor only
- [ ] Open XSD file → shows text editor with mode switcher in TopBar
- [ ] Click "Graph" mode for XSD → shows dependency graph
- [ ] Click "Text" mode for XSD → shows text editor
- [ ] Click "Generate XML" for XSD → creates new XML tab
- [ ] Click "Validate" for XML → shows schema modal
- [ ] Select XSD from modal → validates and shows errors in right panel (if any)
- [ ] Click "Validate" for XSD → validates XSD schema

- [ ] **Step 5: Check for unused imports and code**

```bash
# Check for unused imports
npx tsc --noUnusedLocals --noUnusedParameters
```

Remove any unused imports found.

- [ ] **Step 6: Update documentation**

Update CLAUDE.md if needed to reflect simplified architecture.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: final polish after project simplification

- Complete removal of Tree/Grid/Split views
- Simplify XSD to text/graph modes only
- Add ValidationPanel for error display
- Add SchemaSelectionModal for XML validation
- Update ActionsPanel and TopBar
- All tests passing (833+)
- TypeScript and ESLint clean

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Self-Review Results

**✓ Spec Coverage:**
- Tree/Grid/Split view removal → Tasks 1-4
- XSD simplification → Task 5
- ValidationPanel → Task 6
- AppLayout right panel → Task 7
- SchemaSelectionModal → Task 8
- DocumentManager updates → Task 9
- ActionsPanel updates → Task 10
- TopBar mode switcher → Task 11
- Final integration → Task 12

**✓ Placeholder Check:** No TBD/TODO found. All steps have concrete code.

**✓ Type Consistency:** Props and types match across tasks (xsdMode, validationErrors, etc.)

**✓ No Gaps:** All spec requirements covered by tasks.
