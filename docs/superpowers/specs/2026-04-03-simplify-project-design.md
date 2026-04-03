# Design: Simplify XML Previewer - Remove Unnecessary Features

**Date:** 2026-04-03
**Status:** Draft
**Author:** Claude Code

## Overview

Simplify the XML Previewer application by removing unnecessary features and keeping only core functionality for XML and XSD document editing. Create a clean, intuitive UI focused on essential operations.

## Goals

1. Remove unused views and features (Tree, Grid, XSLT, XPath, etc.)
2. Simplify UI to improve user experience
3. Keep only essential functionality: XML text editing, XSD text/graph viewing, XML generation, and validation

## Features to Keep

### Document Editing
- **XML**: Text editor only (Monaco)
- **XSD**: Text editor (Monaco) + dependency graph

### File Operations
- New File / Open File / Save / Save As
- Document tabs for switching between open files

### XSD Operations
- **Generate XML** - Generate XML instance from XSD schema (opens new tab)
- **Show Graph** - View XSD dependency graph
- **Validate** - Validate XSD schema for errors

### XML Operations
- **Validate** - Validate XML against XSD (with schema selection modal)

## Features to Remove

### XML Views
- ❌ XML Tree View (hierarchical tree view)
- ❌ XML Grid View (tabular AG-Grid view)
- ❌ Split views (multi-pane layouts)

### XSD Views
- ❌ XSD Elements Tree tab
- ❌ XSD Types Tree tab

### Generation
- ❌ Generate XSD from XML

### Schema Binding
- ❌ Assign Schema button (replaced with modal on validation)

### Transformations
- ❌ XSLT transformations
- ❌ XPath builder/evaluator
- ❌ XQuery executor

## UI Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  TopBar                                                  │
│  [New] [Open] [Save] [Save As]    [XSD: Text|Graph]     │
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│ Left     │      Main Content             │  Right        │
│ Sidebar  │                              │  Panel        │
│          │                              │               │
│ Actions  │  ┌────────────────────────┐  │  Validation   │
│ Panel    │  │                        │  │  Errors       │
│          │  │  Editor / Graph        │  │               │
│ Files    │  │                        │  │  • Error 1    │
│ Panel    │  │                        │  │  • Error 2    │
│          │  └────────────────────────┘  │  • Error 3    │
│          │                              │               │
└──────────┴──────────────────────────────┴───────────────┘
```

### Component Changes

#### TopBar (`src/components/toolbar/TopBar.tsx`)
- **Keep**: New, Open, Save, Save As buttons
- **Add**: XSD mode switcher (radio buttons: "Text | Graph")
- **Show switcher only**: When active document is XSD
- **Remove**: Undo/Redo, view mode switchers for XML

#### LeftSidebar (`src/components/layout/LeftSidebar.tsx`)
- **No changes**: Keep existing layout

#### ActionsPanel (`src/components/actions/ActionsPanel.tsx`)
**For XSD documents:**
```tsx
<PrimaryActionButton onClick={onToggleGraphMode}>
  {isGraphMode ? 'Show Text' : 'Show Graph'}
</PrimaryActionButton>
<SecondaryActionButton onClick={onGenerateXML}>
  Generate XML
</SecondaryActionButton>
<SecondaryActionButton onClick={onValidate}>
  Validate
</SecondaryActionButton>
```

**For XML documents:**
```tsx
<SecondaryActionButton onClick={onValidate}>
  Validate
</SecondaryActionButton>
```

**Remove:**
- "Assign Schema" button
- "Generate XSD" button

#### FilesPanel (`src/components/files/FilesPanel.tsx`)
- **No changes**: Keep existing functionality

#### Main Content (`src/core/documentManager/DocumentManager.tsx`)
**For XML documents:**
- Render: `XMLTextEditor`

**For XSD documents:**
- Text mode: `XMLTextEditor`
- Graph mode: `XSDGraphVisualizer`

**Add state:**
```tsx
const [xsdMode, setXsdMode] = useState<'text' | 'graph'>('text');
```

#### RightPanel (NEW: `src/components/validation/ValidationPanel.tsx`)
- **Purpose**: Display validation errors
- **Behavior**: Only visible when errors exist
- **Content**: List of errors with element path and description
- **Interaction**: Click error → focus on problematic line in editor

#### XSDVisualizer (`src/views/xsd/XSDVisualizer.tsx`)
- **Remove**: Elements tab, Types tab
- **Keep**: Only acts as container for text/graph switching
- **Simplify**: Remove tab switching logic

## Data Flows

### Generate XML from XSD

```
User clicks "Generate XML" in ActionsPanel
  ↓
ActionsPanel.handleGenerateXML()
  ↓
generateXMLFromXSD(xsdContent)
  ↓
Create new document: { name: "{XSD name}_generated.xml", type: XML }
  ↓
addDocument() + setActiveDocument()
  ↓
New tab opens with generated XML
  ↓
Toast: "✓ XML generated from {XSD name}"
```

### Validate XML Against XSD

```
User clicks "Validate" for XML document
  ↓
Check for open XSD documents
  ↓
If no XSD open:
  Show error: "No XSD schemas available. Please open an XSD file first."
Else:
  Show modal with list of available XSD documents
  ↓
User selects XSD from modal
  ↓
validateXMLAgainstXSD(xmlContent, xsdContent)
  ↓
If errors found:
  Display in RightPanel
  Render error list with element paths
Else:
  Show toast: "✓ XML is valid according to {XSD name}"
```

### Switch XSD View Mode

```
User clicks "Graph" in TopBar
  ↓
setXsdMode('graph')
  ↓
DocumentManager re-renders
  ↓
For XSD document: render XSDGraphVisualizer instead of XMLTextEditor
```

### Validate XSD Schema

```
User clicks "Validate" for XSD document
  ↓
Validate XSD schema structure
  ↓
If errors found:
  Display in RightPanel
Else:
  Show toast: "✓ XSD schema is valid"
```

## Error Handling

### Validation Errors

**Display Location**: RightPanel

**Error Structure**:
```tsx
interface ValidationError {
  path: string;        // Element path (e.g., "/root/child/@attr")
  message: string;     // Error description
  line?: number;       // Line number if available
  column?: number;     // Column number if available
}
```

**User Feedback**:
- Red badge on FilesPanel with error count
- RightPanel slides in from right
- Error list with clickable items

### Generation Errors

**When XSD is invalid**:
- Show error in toast: "Cannot generate XML: XSD schema is invalid"
- Don't create new document

**When generation fails**:
- Show toast with error description
- Log error to console

## Files to Delete

```
src/views/tree/                    # XML Tree view
  ├── XMLTree.tsx
  ├── TreeNode.tsx
  ├── TreeContextMenu.tsx
  ├── TreeDragDrop.tsx
  ├── TreeSearch.tsx
  └── __tests__/

src/views/grid/                    # XML Grid view
  ├── XMLGrid.tsx
  ├── GridDataBuilder.tsx
  └── __tests__/

src/views/split/                   # Split views
  └── (all files)
```

## Component Updates

### DocumentManager.tsx

**Remove:**
```tsx
// Remove XML view modes
const [xmlViewMode, setXmlViewMode] = useState<'text' | 'tree' | 'grid'>('text');

// Remove XSD tab state
const [xsdActiveTab, setXsdActiveTab] = useState<'elements' | 'types' | 'graph'>('elements');
```

**Add:**
```tsx
// XSD view mode state
const [xsdMode, setXsdMode] = useState<'text' | 'graph'>('text');

// Validation panel state
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
```

**Conditional rendering:**
```tsx
{activeDocument?.type === DocumentType.XSD && xsdMode === 'graph' ? (
  <XSDGraphVisualizer schema={parsedSchema} />
) : (
  <XMLTextEditor document={activeDocument} />
)}
```

### XSDVisualizer.tsx

**Simplify to:**
```tsx
export function XSDVisualizer({ xsdContent, activeTab, onTabChange }: XSDVisualizerProps) {
  // No more Elements/Types tabs
  // Just delegate to editor or graph based on parent state
  return null; // Logic moved to DocumentManager
}
```

### ActionsPanel.tsx

**Update props:**
```tsx
interface ActionsPanelProps {
  document: Document | null;
  onToggleGraphMode?: () => void;      // For XSD
  onGenerateXML?: () => void;          // For XSD
  onValidate?: () => void;             // For both
}
```

## Testing Strategy

### Unit Tests to Update
- `ActionsPanel.test.tsx` - Update for simplified buttons
- `DocumentManager.test.tsx` - Remove tree/grid tests
- `XSDVisualizer.test.tsx` - Remove Elements/Types tabs tests

### Integration Tests to Update
- XML generation from XSD
- XML validation with schema selection modal
- XSD mode switching (text ↔ graph)

### Tests to Delete
- All XMLTree tests
- All XMLGrid tests
- Split view tests
- XSD Elements/Types tabs tests

## Implementation Phases

### Phase 1: Remove Unused Views
1. Delete `src/views/tree/`
2. Delete `src/views/grid/`
3. Delete `src/views/split/`
4. Update `DocumentManager.tsx` - remove tree/grid state and rendering
5. Remove imports and dependencies
6. Delete related tests
7. Run tests to verify

### Phase 2: Simplify XSD Visualizer
1. Remove Elements and Types tabs from `XSDVisualizer.tsx`
2. Simplify component to just handle text/graph switching
3. Update `XSDVisualizer.test.tsx`
4. Remove unused CSS for tabs

### Phase 3: Create Validation Panel
1. Create `src/components/validation/ValidationPanel.tsx`
2. Create `src/components/validation/ValidationPanel.css`
3. Add to `AppLayout.tsx` as right panel
4. Add state management in `DocumentManager.tsx`
5. Integrate with validation logic
6. Write tests for ValidationPanel

### Phase 4: Update Actions Panel
1. Remove "Assign Schema" button
2. Update "Validate" for XML to show modal
3. Create schema selection modal component
4. Update "Generate XML" to create new tab
5. Update `ActionsPanel.test.tsx`

### Phase 5: Update TopBar
1. Add XSD mode switcher component
2. Show only for XSD documents
3. Remove unused buttons (undo/redo, etc.)
4. Update TopBar tests

### Phase 6: Final Polish
1. Verify all user flows work
2. Check error handling
3. Run full test suite
4. Update documentation
5. Remove unused code and imports
6. Final UI review

## Success Criteria

- [ ] All unused features removed
- [ ] Only XML text editor remains (no tree/grid)
- [ ] XSD has text + graph modes only
- [ ] Validation panel shows errors correctly
- [ ] Generate XML creates new tabs
- [ ] Schema selection modal works
- [ ] All tests pass
- [ ] No console errors
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes with no new warnings

## Notes

- Keep existing document management logic (tabs, dirty state, etc.)
- Reuse existing validation services
- Maintain backward compatibility with file formats
- Consider adding keyboard shortcuts for common actions
- Ensure mobile responsiveness is maintained
