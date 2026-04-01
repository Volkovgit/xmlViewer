# Schema-Aware Editing Design Document

> **Status:** Proposed
> **Created:** 2025-03-31
> **Author:** Claude Sonnet 4.5
> **Phase:** Phase 3 - Final Task

---

## Overview

Implement intelligent, schema-aware XML editing with context-sensitive autocompletion, live error decorations, and quick fix actions in Monaco Editor. The system uses XSD schemas to provide intelligent editing assistance including element/attribute suggestions, enumeration values, required attribute detection, and real-time validation feedback.

**Goal:** Transform XML editing from syntax-highlighted text editing to intelligent, schema-guided development experience comparable to Visual Studio's XML editor or JetBrains' IDEs.

---

## Requirements Summary

### User Requirements

1. **Autocomplete Elements:** Suggest valid child elements based on current cursor position in XML hierarchy
2. **Autocomplete Attributes:** Suggest valid attributes for current element, highlighting required ones
3. **Autocomplete Values:** Suggest enumeration values for attributes and elements with xs:enumeration constraints
4. **Live Error Detection:** Show prohibited/missing/unexpected attributes in real-time
5. **Quick Fix:** One-click fix for missing required attributes
6. **Smart Templates:** Auto-insert required attributes when inserting elements

### Technical Requirements

1. **Performance:** Context analysis must not block typing (<50ms for suggestions)
2. **Caching:** Cache XML context stack and parsed schemas for performance
3. **Schema Detection:** Auto-detect XSD via `xsi:schemaLocation` or `xsi:noNamespaceSchemaLocation`
4. **Fallback:** Manual schema attachment if auto-detection fails
5. **Integration:** Work with existing view synchronization system
6. **Testing:** Comprehensive unit and integration tests

---

## Architecture

### System Components

```
src/services/xsd/
├── schemaProvider/
│   ├── SchemaProvider.ts              # XSD loading and parsing
│   └── __tests__/
│       └── SchemaProvider.test.ts
├── contextAnalyzer/
│   ├── XMLContextAnalyzer.ts          # Cursor position analysis
│   ├── ContextStack.ts                # Context cache management
│   └── __tests__/
│       ├── XMLContextAnalyzer.test.ts
│       └── ContextStack.test.ts
├── completion/
│   ├── SchemaCompletionProvider.ts    # Monaco CompletionItemProvider
│   ├── CompletionItems.ts             # Suggestion generator
│   └── __tests__/
│       ├── SchemaCompletionProvider.test.ts
│       └── CompletionItems.test.ts
├── decorations/
│   ├── SchemaDecorationProvider.ts    # Live error decorations
│   └── __tests__/
│       └── SchemaDecorationProvider.test.ts
└── quickFix/
    ├── SchemaQuickFixProvider.ts      # Quick fix actions
    └── __tests__/
        └── SchemaQuickFixProvider.test.ts
```

### Type System Extensions

```typescript
// src/types/index.ts
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  status: DocumentStatus;
  createdAt: number;
  modifiedAt: number;

  // NEW: Schema-aware editing support
  xsdSchema?: XSDSchema;      // Cached parsed XSD schema
  xsdPath?: string;            // Path to XSD file (if attached)
}
```

### Data Flow

```
User opens XML file
    ↓
SchemaProvider.detectSchemaLocation(xml)
    → Finds xsi:schemaLocation or xsi:noNamespaceSchemaLocation
    ↓
SchemaProvider.loadSchema(path)
    → Loads XSD from local file or HTTP(S) URL
    ↓
XSDParser.parseXSD(xsdContent)
    → Creates XSDSchema object
    ↓
DocumentStore.updateDocument()
    → document.xsdSchema = schema
    → document.xsdPath = path
    ↓
User types Ctrl+Space in Monaco Editor
    ↓
XMLContextAnalyzer.getContext(model, position)
    → Returns current element path and position
    ↓
SchemaCompletionProvider.provideCompletionItems()
    → Queries XSDSchema for valid suggestions
    → Returns Monaco CompletionItem list
    ↓
Monaco displays suggestion list
    → User selects item
    → Inserts with required attributes pre-filled
```

---

## Component Specifications

### 1. SchemaProvider

**Responsibility:** Detect, load, and manage XSD schemas for documents

**API:**

```typescript
class SchemaProvider {
  /**
   * Auto-detect XSD schema location from XML document
   * Searches for xsi:schemaLocation or xsi:noNamespaceSchemaLocation
   *
   * @param xmlContent - XML document content
   * @returns Schema path or null if not found
   */
  detectSchemaLocation(xmlContent: string): string | null;

  /**
   * Load XSD schema from file path or URL
   * Supports local files and HTTP/HTTPS URLs
   *
   * @param schemaPath - Path or URL to XSD
   * @returns Parsed XSDSchema or null if failed
   */
  loadSchema(schemaPath: string): Promise<XSDSchema | null>;

  /**
   * Attach schema to document (updates DocumentStore)
   *
   * @param document - Document to attach schema to
   * @param schemaPath - Path to XSD file
   * @returns Updated document
   */
  attachSchemaToDocument(
    document: Document,
    schemaPath: string
  ): Promise<Document>;

  /**
   * Detach schema from document
   *
   * @param document - Document to detach schema from
   * @returns Updated document
   */
  detachSchema(document: Document): Document;
}
```

**Schema Detection Logic:**

```typescript
detectSchemaLocation(xmlContent: string): string | null {
  // Parse XML to find root element
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
  const root = xmlDoc.documentElement;

  // Check xsi:noNamespaceSchemaLocation
  const noNsSchema = root.getAttribute('xsi:noNamespaceSchemaLocation');
  if (noNsSchema) return noNsSchema;

  // Check xsi:schemaLocation
  const schemaLocation = root.getAttribute('xsi:schemaLocation');
  if (schemaLocation) {
    // Format: "namespace-uri schema.xsd"
    const parts = schemaLocation.split(/\s+/);
    if (parts.length >= 2) return parts[parts.length - 1];
  }

  return null; // No schema found, prompt user
}
```

**Error Handling:**

- **Schema not found:** Show file picker dialog to select XSD manually
- **Schema parsing failed:** Show validation error with line/column
- **Circular imports:** Detect and prevent infinite recursion
- **Schema changed:** Invalidate cache when XSD file timestamp changes

**Files:**
- `src/services/xsd/schemaProvider/SchemaProvider.ts` (~250 lines)
- `src/services/xsd/schemaProvider/__tests__/SchemaProvider.test.ts` (~150 lines, 12 tests)

---

### 2. XMLContextAnalyzer

**Responsibility:** Analyze cursor position in XML to determine current context

**API:**

```typescript
interface XMLContext {
  /** Full path from root to current position */
  elementPath: string[];  // ['catalog', 'books', 'book']

  /** Current element (where cursor is) */
  currentElement: string | null;  // 'author'

  /** Position type within element */
  position: ContextPosition;
}

enum ContextPosition {
  INSIDE_OPENING_TAG,      // <book|>
  INSIDE_CLOSING_TAG,      // </book|>
  INSIDE_CONTENT,          // <book>|content|</book>
  INSIDE_ATTRIBUTES,       // <book id="|" attr="">
  INSIDE_ATTRIBUTE_VALUE,  // <book id="|"|>
}

class XMLContextAnalyzer {
  /**
   * Get context for cursor position with caching
   */
  getContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): XMLContext;

  /**
   * Invalidate context cache
   */
  invalidateCache(): void;
}
```

**ContextStack Cache:**

```typescript
class ContextStack {
  private stack: Map<string, XMLContext>;
  private lastPosition: monaco.Position;

  /**
   * Update stack only if position changed significantly
   * Returns true if stack was updated
   */
  updateIfNeeded(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): boolean;

  /**
   * Get cached context for position
   */
  getContext(position: monaco.Position): XMLContext | null;
}
```

**Optimization Strategy:**

```typescript
// Only re-parse when crossing tag boundaries
updateIfNeeded(model, position): boolean {
  const lineContent = model.getLineContent(position.lineNumber);

  // Same line and not crossing tag boundary? Reuse cache
  if (sameLine && !crossesTagBoundary(lineContent, this.lastPosition, position)) {
    return false; // Cache valid
  }

  // Parse context anew
  const context = this.parseContext(model, position);
  this.stack.set(cacheKey, context);
  this.lastPosition = position;
  return true; // Cache updated
}
```

**Parsing Algorithm:**

1. Find root element of document
2. Traverse tree recursively to cursor position
3. Track element path (elementPath)
4. Determine ContextPosition by characters around cursor
5. Cache result

**Files:**
- `src/services/xsd/contextAnalyzer/XMLContextAnalyzer.ts` (~200 lines)
- `src/services/xsd/contextAnalyzer/ContextStack.ts` (~150 lines)
- `src/services/xsd/contextAnalyzer/__tests__/XMLContextAnalyzer.test.ts` (~180 lines, 10 tests)
- `src/services/xsd/contextAnalyzer/__tests__/ContextStack.test.ts` (~120 lines, 8 tests)

---

### 3. SchemaCompletionProvider

**Responsibility:** Provide Monaco autocompletion suggestions based on XSD schema

**API:**

```typescript
class SchemaCompletionProvider implements monaco.languages.CompletionItemProvider {
  /**
   * Main Monaco method for providing autocompletion
   */
  provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ): monaco.languages.CompletionList | null;

  /**
   * Attach to document schema
   */
  attachToDocument(document: Document): void;

  /**
   * Detach from document
   */
  detach(): void;
}
```

**Completion Logic:**

```typescript
provideCompletionItems(model, position, context): CompletionList | null {
  // 1. Get document from DocumentStore
  const document = getDocumentByModel(model);
  if (!document?.xsdSchema) return null; // No schema → no autocomplete

  // 2. Analyze cursor context
  const xmlContext = this.contextAnalyzer.getContext(model, position);

  // 3. Generate suggestions based on context
  let suggestions: monaco.languages.CompletionItem[] = [];

  switch (xmlContext.position) {
    case ContextPosition.INSIDE_OPENING_TAG:
      // Suggest attributes for current element
      suggestions = this.getAttributeSuggestions(xmlContext, document.xsdSchema);
      break;

    case ContextPosition.INSIDE_CONTENT:
      // Suggest child elements
      suggestions = this.getElementSuggestions(xmlContext, document.xsdSchema);
      break;

    case ContextPosition.INSIDE_ATTRIBUTE_VALUE:
      // Suggest enumeration values
      suggestions = this.getEnumerationSuggestions(xmlContext, document.xsdSchema);
      break;
  }

  return { suggestions };
}
```

**Suggestion Generation:**

```typescript
// Elements
getElementSuggestions(context, schema): CompletionItem[] {
  const parentElement = context.elementPath[context.elementPath.length - 1];
  const parentDecl = findElementDeclaration(parentElement, schema);

  return parentDecl.children.map(child => ({
    label: child.name,
    kind: monaco.languages.CompletionItemKind.Function,
    detail: `element (${child.occurrence.minOccurs}..${child.occurrence.maxOccurs})`,
    documentation: child.annotation || `Child element of <${parentElement}>`,
    insertText: this.generateElementInsertText(child),
  }));
}

// Attributes
getAttributeSuggestions(context, schema): CompletionItem[] {
  const element = context.currentElement;
  const elementDecl = findElementDeclaration(element, schema);

  return elementDecl.attributes.map(attr => ({
    label: attr.name,
    kind: monaco.languages.CompletionItemKind.Property,
    detail: attr.use === 'required' ? 'required attribute' : 'optional attribute',
    documentation: attr.annotation,
    insertText: `${attr.name}="${attr.default || ''}"`,
    sortText: attr.use === 'required' ? '0' : '1', // Required first
  }));
}

// Enumerations
getEnumerationSuggestions(context, schema): CompletionItem[] {
  const attr = getCurrentAttribute(context);
  const attrDecl = findAttributeDeclaration(attr, context.currentElement, schema);

  if (attrDecl?.type?.restriction?.enumeration) {
    return attrDecl.type.restriction.enumeration.map(value => ({
      label: value,
      kind: monaco.languages.CompletionItemKind.Enum,
      detail: 'enumeration value',
      insertText: value,
    }));
  }
  return [];
}
```

**Smart Templates:**

```typescript
generateElementInsertText(elementDecl: XSDElement): string {
  const requiredAttrs = elementDecl.attributes
    .filter(a => a.use === 'required')
    .map(a => ` ${a.name}="${a.default || ''}"`)
    .join('');

  if (elementDecl.occurrence.maxOccurs === 0) {
    // Empty element
    return `<${elementDecl.name}${requiredAttrs} />$0`;
  } else {
    // Element with content
    return `<${elementDecl.name}${requiredAttrs}>$0</${elementDecl.name}>`;
  }
}
```

**Files:**
- `src/services/xsd/completion/SchemaCompletionProvider.ts` (~180 lines)
- `src/services/xsd/completion/CompletionItems.ts` (~200 lines)
- `src/services/xsd/completion/__tests__/SchemaCompletionProvider.test.ts` (~150 lines, 8 tests)
- `src/services/xsd/completion/__tests__/CompletionItems.test.ts` (~200 lines, 12 tests)

---

### 4. SchemaDecorationProvider

**Responsibility:** Show live error decorations in Monaco Editor

**API:**

```typescript
class SchemaDecorationProvider {
  /**
   * Update decorations for model
   */
  updateDecorations(
    model: monaco.editor.ITextModel,
    schema: XSDSchema
  ): void;

  /**
   * Clear all decorations
   */
  clearDecorations(model: monaco.editor.ITextModel): void;
}
```

**Decoration Types:**

```typescript
const DECORATIONS = {
  REQUIRED_ATTRIBUTE_MISSING: {
    className: 'xml-required-attribute-missing',
    hoverMessage: { value: 'Required attribute missing' }
  },
  PROHIBITED_ATTRIBUTE: {
    className: 'xml-prohibited-attribute',
    hoverMessage: { value: 'This attribute is prohibited' }
  },
  UNEXPECTED_ATTRIBUTE: {
    className: 'xml-unexpected-attribute',
    hoverMessage: { value: 'Unexpected attribute (not declared in schema)' }
  }
};
```

**Files:**
- `src/services/xsd/decorations/SchemaDecorationProvider.ts` (~150 lines)
- `src/services/xsd/decorations/__tests__/SchemaDecorationProvider.test.ts` (~120 lines, 6 tests)
- `src/views/text/XMLTextEditor.css` (add decoration styles)

---

### 5. SchemaQuickFixProvider

**Responsibility:** Provide quick fix actions for common schema violations

**API:**

```typescript
class SchemaQuickFixProvider implements monaco.languages.CodeActionProvider {
  /**
   * Provide code actions for given position
   */
  provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList>;
}
```

**Quick Fix Actions:**

```typescript
provideCodeActions(model, range, context, token): CodeActionList {
  const actions: monaco.languages.CodeAction[] = [];

  // Detect missing required attributes
  const missingAttrs = detectMissingRequiredAttributes(model, range);
  missingAttrs.forEach(attr => {
    actions.push({
      title: `Add required attribute "${attr.name}"`,
      kind: 'quickfix',
      edit: {
        edits: [{
          range: attr.insertPosition,
          text: ` ${attr.name}="${attr.default || ''}"`
        }]
      }
    });
  });

  return { actions };
}
```

**Files:**
- `src/services/xsd/quickFix/SchemaQuickFixProvider.ts` (~120 lines)
- `src/services/xsd/quickFix/__tests__/SchemaQuickFixProvider.test.ts` (~100 lines, 5 tests)

---

## Integration Points

### 1. XMLTextEditor Integration

```typescript
// src/views/text/XMLTextEditor.tsx

export function XMLTextEditor({ document }: XMLTextEditorProps) {
  const schemaProvider = useMemo(() => new SchemaProvider(), []);
  const completionProvider = useMemo(() => new SchemaCompletionProvider(), []);
  const decorationProvider = useMemo(() => new SchemaDecorationProvider(), []);
  const quickFixProvider = useMemo(() => new SchemaQuickFixProvider(), []);

  useEffect(() => {
    // Auto-detect and load schema on mount
    const schemaPath = schemaProvider.detectSchemaLocation(document.content);
    if (schemaPath) {
      schemaProvider.loadSchema(schemaPath).then(schema => {
        if (schema) {
          // Schema will be attached to document via DocumentStore
          completionProvider.attachToDocument(document);
          decorationProvider.updateDecorations(model, schema);
        }
      });
    }

    // Register Monaco providers
    const disposables = [
      monaco.languages.registerCompletionItemProvider('xml', completionProvider),
      monaco.languages.registerCodeActionProvider('xml', quickFixProvider),
    ];

    return () => {
      disposables.forEach(d => d.dispose());
      completionProvider.detach();
    };
  }, [document.id]);

  // ... rest of component
}
```

### 2. DocumentStore Integration

```typescript
// src/stores/documentStore.ts

interface DocumentStoreActions {
  // ... existing actions

  // NEW: Schema attachment
  attachSchema: (documentId: string, schemaPath: string, schema: XSDSchema) => void;
  detachSchema: (documentId: string) => void;
  updateSchema: (documentId: string, schema: XSDSchema) => void;
}
```

### 3. File Operations Integration

```typescript
// When user opens XML file
async function openXMLFile(file: File) {
  const content = await file.text();

  // Auto-detect schema
  const schemaPath = schemaProvider.detectSchemaLocation(content);
  if (schemaPath) {
    const schema = await schemaProvider.loadSchema(schemaPath);
    // Schema attached to document
  }

  // Create document with schema
  const document: Document = {
    id: generateId(),
    name: file.name,
    type: DocumentType.XML,
    content,
    status: DocumentStatus.READY,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    xsdSchema: schema,
    xsdPath: schemaPath,
  };

  addDocument(document);
}
```

---

## Error Handling

### Schema Detection Errors

| Error | Handling |
|-------|----------|
| No schema location attribute | Show dialog: "No XSD schema detected. Attach schema manually?" |
| Schema file not found | Show error: "Schema not found at {path}. Choose different file?" |
| Invalid XSD syntax | Show parsing error with line/column from XSD parser |
| Circular imports | Detect during parsing, show error with import chain |

### Runtime Errors

| Error | Handling |
|-------|----------|
| Schema changed during editing | Watch file timestamp, reload and invalidate cache |
| Invalid XML structure | Fall back to basic XML syntax highlighting |
| Performance degradation | Debounce context analysis, show "analyzing..." indicator |

---

## Performance Considerations

### Caching Strategy

1. **Schema Cache:** Parse XSD once, reuse across all documents
2. **Context Stack:** Update only when crossing tag boundaries
3. **Completion Items:** Generate on-demand, cache per document
4. **Decorations:** Update on idle (requestIdleCallback)

### Optimization Targets

| Operation | Target |
|-----------|--------|
| Schema detection | <100ms |
| Schema parsing | <500ms (one-time) |
| Context analysis | <50ms (cached) |
| Autocomplete trigger | <100ms |
| Decoration update | <200ms (idle) |

---

## Testing Strategy

### Unit Tests

- **SchemaProvider:** 12 tests (detection, loading, error handling)
- **XMLContextAnalyzer:** 10 tests (parsing, stack management)
- **ContextStack:** 8 tests (caching, invalidation)
- **SchemaCompletionProvider:** 8 tests (suggestion generation)
- **CompletionItems:** 12 tests (element/attr/enum suggestions)
- **SchemaDecorationProvider:** 6 tests (decoration types)
- **SchemaQuickFixProvider:** 5 tests (code actions)

**Total: ~61 unit tests**

### Integration Tests

- **End-to-end autocomplete workflow** (4 tests)
- **Schema attachment and detachment** (3 tests)
- **Error decoration and quick fix** (3 tests)
- **Multi-document schema sharing** (2 tests)

**Total: ~12 integration tests**

### Manual Testing

1. Open XML with XSD linked
2. Verify schema auto-detected
3. Test element autocomplete (Ctrl+Space)
4. Test attribute autocomplete
5. Test enumeration value autocomplete
6. Verify required attributes auto-inserted
7. Test error decorations for prohibited attrs
8. Test quick fix for missing required attrs
9. Open multiple XMLs with same XSD (verify cache reuse)
10. Edit XSD file, verify cache invalidated

---

## Implementation Phases

### Phase 1: Foundation (Day 1-2)
- SchemaProvider implementation
- Document.xsdSchema field integration
- Schema detection and loading

### Phase 2: Context Analysis (Day 3)
- XMLContextAnalyzer implementation
- ContextStack caching
- Position detection logic

### Phase 3: Autocompletion (Day 4-5)
- SchemaCompletionProvider implementation
- CompletionItems generator
- Element/attribute/enum suggestions
- Monaco registration

### Phase 4: Visual Feedback (Day 6)
- SchemaDecorationProvider implementation
- Quick fix provider
- CSS styling for decorations

### Phase 5: Polish & Testing (Day 7)
- Integration tests
- Performance optimization
- Manual testing
- Documentation

---

## Success Criteria

✅ **Functional:**
- Ctrl+Space shows valid elements for current position
- Ctrl+Space shows valid attributes with required ones prioritized
- Ctrl+Space shows enumeration values in context
- Required attributes auto-inserted with elements
- Prohibited/missing attributes highlighted
- Quick fix available for missing required attributes

✅ **Performance:**
- Autocomplete appears within 100ms of Ctrl+Space
- No lag when typing (context analysis <50ms)
- Schema parsing <500ms (one-time)

✅ **Quality:**
- All 61 unit tests passing
- All 12 integration tests passing
- Zero TypeScript errors
- ESLint clean

✅ **User Experience:**
- Schema auto-detected from xsi:schemaLocation
- Fallback to manual schema attachment
- Clear visual feedback for errors
- Intuitive quick fix actions

---

## Open Questions & Decisions

### Resolved

1. **Schema storage:** Store in Document object (not global cache)
2. **Schema detection:** Hybrid auto-detect with manual fallback
3. **Context analysis:** Optimized stack caching
4. **Monaco integration:** Full CompletionItemProvider + decorations + quick fix

### TBD (To Be Determined)

1. **Large schema handling:** What if XSD is >10MB? → Chunk loading?
2. **Remote schema caching:** Cache HTTP-loaded schemas in IndexedDB?
3. **Schema versioning:** Support multiple schema versions for same document?

---

## Dependencies

### Existing Dependencies
- `fast-xml-parser` - XML parsing (already used)
- `xmldom` - DOM manipulation (already used)
- `@monaco-editor/react` - Monaco integration (already used)

### New Dependencies
- None needed! Using existing XSDParser from Phase 2

---

## References

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [XSD Schema Specification](https://www.w3.org/TR/xmlschema-1/)
- [Existing XSDParser](../../src/services/xsd/XSDParser.ts)
- [Existing XSDValidator](../../src/services/xsd/XSDValidator.ts)

---

**Document Version:** 1.0
**Last Updated:** 2025-03-31
