# Phase 1 Manual Testing Checklist

## Overview

This checklist provides comprehensive manual testing procedures for the Phase 1 XML Editor MVP. Each test case includes specific steps and expected results to verify all functionality works correctly.

---

## Test Environment Setup

### Prerequisites
- [ ] Node.js installed (v18 or higher)
- [ ] Package dependencies installed (`npm install`)
- [ ] Development server ready to start

### Startup
- [ ] Run `npm run dev` from project root
- [ ] Verify server starts successfully (default: http://localhost:5173)
- [ ] Open browser to development URL
- [ ] Check browser console for errors (should be none)

---

## Test Cases

### 1. Application Launch

**Steps:**
1. Open terminal and navigate to project directory
2. Run `npm run dev`
3. Wait for compilation to complete
4. Open browser to the shown URL (typically http://localhost:5173)

**Expected Results:**
- [ ] Development server starts without errors
- [ ] Browser loads the application
- [ ] DocumentManager component is visible
- [ ] "New File" and "Open File" buttons are visible
- [ ] No console errors in browser DevTools
- [ ] Empty state message is shown: "No Document Open"

**Success Criteria:** Application loads cleanly with no errors, UI is responsive.

---

### 2. New Document Creation

**Steps:**
1. Click the "New File" button in the toolbar
2. Observe the tab bar and content area

**Expected Results:**
- [ ] New tab appears immediately
- [ ] Tab shows "Untitled-xml-1.xml"
- [ ] Tab is marked as active (different styling)
- [ ] Editor area shows XML template:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <root>
  </root>
  ```
- [ ] Status bar at bottom shows:
  - "Ln 1, Col 1" (cursor position)
  - "3 lines" (line count)
  - "~56 bytes" (file size, approximate)
  - "UTF-8" (encoding)
  - "✓ Valid" (validation status)

**Success Criteria:** New document created with proper defaults, all UI elements update correctly.

---

### 3. Content Editing

**Steps:**
1. Create a new document (if not already open)
2. Click in the editor area
3. Type: `<root>Hello World</root>`
4. Observe the tab and status bar

**Expected Results:**
- [ ] Text appears in editor
- [ ] Tab shows dirty indicator (bullet point • before name)
- [ ] Tab name now shows: "• Untitled-xml-1.xml"
- [ ] Status bar updates:
  - Line count changes based on content
  - File size updates
  - Validation shows "✓ Valid"
- [ ] Cursor position updates when moving cursor

**Success Criteria:** Editor accepts input, dirty state is tracked, all status updates work.

---

### 4. XML Validation

**Steps:**
1. Create or open a valid XML document
2. Verify status shows "✓ Valid"
3. Remove the closing `</root>` tag
4. Observe validation status
5. Add the closing tag back
6. Verify validation returns to valid

**Expected Results:**
- [ ] Initial state: "✓ Valid"
- [ ] After breaking XML:
  - [ ] Status changes to "✗ 1 error" (or more)
  - [ ] Validation status text turns red
  - [ ] Monaco editor may show red underline
- [ ] After fixing XML:
  - [ ] Status returns to "✓ Valid"
  - [ ] Validation status returns to normal color

**Success Criteria:** Real-time validation works, provides immediate feedback, updates correctly.

---

### 5. Multiple Documents

**Steps:**
1. Click "New File" button
2. Click "New File" button again
3. Click "New File" button a third time
4. Click on the first tab
5. Click on the second tab
6. Click on the third tab

**Expected Results:**
- [ ] First document: "Untitled-xml-1.xml"
- [ ] Second document: "Untitled-xml-2.xml"
- [ ] Third document: "Untitled-xml-3.xml"
- [ ] Each tab shows when clicked (active tab styling)
- [ ] Editor content changes to match selected document
- [ ] Only one tab is active at a time
- [ ] All tabs remain visible

**Success Criteria:** Multiple documents can be created and switched between seamlessly.

---

### 6. Document Switching with Edits

**Steps:**
1. Create two documents
2. In the first document, type: `<doc1>Content 1</doc1>`
3. Switch to second document (click its tab)
4. In the second document, type: `<doc2>Content 2</doc2>`
5. Switch back to first document
6. Verify content is preserved
7. Verify dirty indicator on first tab

**Expected Results:**
- [ ] First document shows dirty indicator
- [ ] Second document shows dirty indicator
- [ ] Content in first document: `<doc1>Content 1</doc1>`
- [ ] Content in second document: `<doc2>Content 2</doc2>`
- [ ] Each document maintains its own content
- [ ] Editor correctly switches content

**Success Criteria:** Each document maintains independent state when switching.

---

### 7. File Opening

**Steps:**
1. Create a test XML file on your system:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <test>
     <item>Test content</item>
   </test>
   ```
2. Click "Open File" button
3. Select the test file
4. Observe the new tab

**Expected Results:**
- [ ] File picker dialog opens
- [ ] After selecting file:
  - [ ] New tab appears with filename
  - [ ] File content is loaded in editor
  - [ ] Tab is marked as active
  - [ ] Validation status shows
  - [ ] Status bar shows correct line count and size

**Success Criteria:** Files can be opened and displayed correctly.

---

### 8. Close Document (Clean)

**Steps:**
1. Create a new document
2. Don't make any changes
3. Click the × (close) button on the tab

**Expected Results:**
- [ ] Tab closes immediately
- [ ] No confirmation dialog
- [ ] Editor shows empty state
- [ ] "No Document Open" message appears

**Success Criteria:** Clean documents close without prompting.

---

### 9. Close Document (Dirty)

**Steps:**
1. Create a new document
2. Type some content: `<test>dirty content</test>`
3. Click the × (close) button on the tab
4. Observe the confirmation dialog
5. Test both "OK" and "Cancel" options

**Expected Results (OK):**
- [ ] Confirmation dialog appears
- [ ] Message: "Save changes to [filename] before closing?"
- [ ] Click OK → document closes

**Expected Results (Cancel):**
- [ ] Confirmation dialog appears
- [ ] Click Cancel → document remains open
- [ ] Tab still visible
- [ ] Content preserved

**Success Criteria:** Dirty state protection works, user can cancel close operation.

---

### 10. Status Bar Accuracy

**Steps:**
1. Create a new document
2. Move cursor around using arrow keys
3. Add multiple lines of content
4. Observe all status bar elements

**Expected Results:**
- [ ] "Ln X, Col Y" updates as cursor moves
- [ ] Line count increases when adding lines
- [ ] File size increases with more content
- [ ] Encoding always shows "UTF-8"
- [ ] Validation updates immediately

**Success Criteria:** All status bar elements accurately reflect document state.

---

### 11. Empty State Behavior

**Steps:**
1. Start application (or close all documents)
2. Observe the empty state
3. Verify buttons are still functional

**Expected Results:**
- [ ] "No Document Open" heading displayed
- [ ] Instruction text visible
- [ ] "New File" button still works
- [ ] "Open File" button still works
- [ ] No errors in console
- [ ] Status bar not visible (or shows dashes)

**Success Criteria:** Empty state is user-friendly and functional.

---

### 12. Editor Features

**Steps:**
1. Open or create a document
2. Test editor functionality:
   - Type text
   - Use arrow keys to navigate
   - Use Enter for new lines
   - Use Backspace/Delete
   - Select text with mouse
   - Copy/paste (Ctrl+C, Ctrl+V)

**Expected Results:**
- [ ] All typing works smoothly
- [ ] Syntax highlighting applied to XML tags
- [ ] Navigation works
- [ ] No lag or delays
- [ ] Undo/Redo works (Ctrl+Z, Ctrl+Y)
- [ ] Text selection works

**Success Criteria:** Monaco editor provides full editing capabilities.

---

### 13. XML Syntax Highlighting

**Steps:**
1. Create a document with complex XML:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <root attr1="value1" attr2="value2">
     <child1>Text content</child1>
     <child2>
       <nested>Deep</nested>
     </child2>
     <!-- Comment -->
     <?processing instruction?>
   </root>
   ```
2. Observe colors and styling

**Expected Results:**
- [ ] XML declaration has distinct color
- [ ] Tag names have one color
- [ ] Attributes have another color
- [ ] Attribute values have different color
- [ ] Text content is distinguishable
- [ ] Comments are styled
- [ ] Processing instructions are styled

**Success Criteria:** XML syntax is properly highlighted for readability.

---

### 14. Large Document Performance

**Steps:**
1. Create or open a large XML file (1000+ lines)
2. Scroll through document
3. Make edits at various positions
4. Observe performance

**Expected Results:**
- [ ] Document loads reasonably fast (< 2 seconds)
- [ ] Scrolling is smooth
- [ ] Editing is responsive
- [ ] Validation doesn't freeze UI
- [ ] No browser crashes

**Success Criteria:** Application handles large documents adequately.

---

### 15. Browser Console Check

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform various actions:
   - Create documents
   - Edit content
   - Close documents
   - Switch tabs
4. Watch for any errors or warnings

**Expected Results:**
- [ ] No console errors
- [ ] No console warnings (except maybe React development warnings)
- [ ] No failed network requests
- [ ] No TypeScript errors

**Success Criteria:** Application runs cleanly without errors.

---

## Cross-Browser Testing (Optional)

### Browsers to Test:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Expected Results:**
- [ ] All features work across browsers
- [ ] Styling looks consistent
- [ ] No browser-specific issues

---

## Performance Benchmarks

### Metrics to Check:
- [ ] Initial page load: < 3 seconds
- [ ] New document creation: < 100ms
- [ ] Document switching: < 50ms
- [ ] File opening (1MB file): < 2 seconds
- [ ] Validation response: < 300ms

---

## Accessibility Checks

**Steps:**
1. Navigate using keyboard only (Tab key)
2. Use screen reader (if available)

**Expected Results:**
- [ ] All buttons are keyboard accessible
- [ ] Focus indicators visible
- [ ] Tab order is logical
- [ ] ARIA labels present where needed
- [ ] Buttons have meaningful labels

---

## Defect Reporting

If any test fails, document:
1. Test case number
2. Steps taken
3. Expected result
4. Actual result
5. Browser/version
6. Console errors (if any)
7. Screenshot (if applicable)

---

## Test Sign-Off

**Tester Name:** _______________

**Date Completed:** _______________

**Overall Result:**
- [ ] All tests passed - Ready for Phase 2
- [ ] Minor issues found (documented above)
- [ ] Major issues found (needs fixes before Phase 2)

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
