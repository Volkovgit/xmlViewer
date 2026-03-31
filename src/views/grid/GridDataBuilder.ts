import { DOMParser } from 'xmldom';

export interface GridRowData {
  _nodeId: string;
  [key: string]: string;
}

export interface GridDataResult {
  rows: GridRowData[];
  columns: string[];
  rootElement: string;
}

export interface GridUpdateData {
  /** Original XML string before editing */
  originalXml: string;
  /** Original grid data structure */
  originalGridData: GridDataResult;
  /** Updated row data from AG-Grid */
  updatedRows: GridRowData[];
}

export function buildGridData(xmlString: string): GridDataResult {
  // Parse XML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parsing errors - xmldom puts parsererror as a direct child of documentElement
  const parseError = doc.documentElement?.querySelector?.('parsererror');
  if (parseError) {
    throw new Error(`XML parsing error: ${parseError.textContent}`);
  }

  // Check if documentElement exists (root element)
  if (!doc.documentElement) {
    // This could be malformed XML
    const warning = doc.querySelector?.('warning');
    if (warning?.textContent?.includes('unclosed')) {
      throw new Error(`XML parsing error: ${warning.textContent}`);
    }
    // For empty XML, return default root
    return {
      rows: [],
      columns: ['_nodeId', 'text'],
      rootElement: 'root'
    };
  }

  const rootElement = doc.documentElement.tagName;

  // Find all elements to convert to rows (elements under root)
  const elements = Array.from(doc.documentElement?.childNodes || []).filter(
    node => node.nodeType === 1 // ELEMENT_NODE
  ) as Element[];

  if (elements.length === 0) {
    return {
      rows: [],
      columns: ['_nodeId', 'text'],
      rootElement
    };
  }

  // Extract all possible attribute names from all elements
  const allAttributes = new Set<string>();
  elements.forEach(element => {
    Array.from(element.attributes).forEach(attr => {
      allAttributes.add(attr.name);
    });
  });

  // Combine attributes with standard columns, with _nodeId first, then text, then sorted attributes
  const sortedAttributes = Array.from(allAttributes).sort();
  const columns = ['_nodeId', 'text', ...sortedAttributes];

  // Build rows
  const rows: GridRowData[] = elements.map((element, index) => {
    const row: GridRowData = {
      _nodeId: `node-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: ''
    };

    // Add attributes
    Array.from(element.attributes).forEach(attr => {
      row[attr.name] = attr.value;
    });

    // Extract text content (including child text nodes)
    const textContent = getTextContent(element);
    row.text = textContent.trim();

    return row;
  });

  return {
    rows,
    columns,
    rootElement
  };
}

function getTextContent(element: Element): string {
  // Collect all text nodes, ignoring element nodes
  const textNodes = Array.from(element.childNodes).filter(node =>
    node.nodeType === 3 || node.nodeType === 4 // TEXT_NODE or CDATA_SECTION_NODE
  );

  return textNodes.map(node => node.nodeValue?.trim() || '').join(' ');
}

/**
 * Update XML document from grid changes
 * Reconstructs the XML with updated values from grid edits
 *
 * @param data - Grid update data containing original XML, grid structure, and updated rows
 * @returns Updated XML string
 *
 * @throws {Error} If XML parsing fails or structure is invalid
 *
 * @example
 * ```ts
 * const updatedXml = updateXMLFromGrid({
 *   originalXml: '<root><person id="1">John</person></root>',
 *   originalGridData: { rows: [{ _nodeId: 'node-0', id: '1', text: 'John' }], columns: ['_nodeId', 'text', 'id'], rootElement: 'root' },
 *   updatedRows: [{ _nodeId: 'node-0', id: '1', text: 'Jane' }]
 * });
 * // Returns: '<root><person id="1">Jane</person></root>'
 * ```
 */
export function updateXMLFromGrid(data: GridUpdateData): string {
  const { originalXml, originalGridData, updatedRows } = data;

  // Parse the original XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalXml, 'text/xml');

  // Check for parsing errors
  const parseError = doc.documentElement?.querySelector?.('parsererror');
  if (parseError) {
    throw new Error(`XML parsing error: ${parseError.textContent}`);
  }

  if (!doc.documentElement) {
    throw new Error('Invalid XML: no root element found');
  }

  // Create a map of nodeId to updated row data
  const updatedRowsMap = new Map<string, GridRowData>();
  updatedRows.forEach(row => {
    updatedRowsMap.set(row._nodeId, row);
  });

  // Get all child elements of the root
  const elements = Array.from(doc.documentElement?.childNodes || []).filter(
    node => node.nodeType === 1 // ELEMENT_NODE
  ) as Element[];

  // Check that the number of elements matches the grid data
  if (elements.length !== originalGridData.rows.length) {
    throw new Error(
      `Structure mismatch: expected ${originalGridData.rows.length} elements, found ${elements.length}`
    );
  }

  // Update each element based on the grid data
  elements.forEach((element, index) => {
    const originalRow = originalGridData.rows[index];
    const updatedRow = updatedRowsMap.get(originalRow._nodeId);

    // If no update for this row, skip
    if (!updatedRow) {
      return;
    }

    // Update attributes
    // Collect all attribute keys from both original and updated rows
    const allAttributeKeys = new Set([
      ...Object.keys(originalRow),
      ...Object.keys(updatedRow)
    ]);

    allAttributeKeys.forEach(key => {
      if (key === '_nodeId' || key === 'text') {
        return; // Skip special columns
      }

      const newValue = updatedRow[key];

      if (newValue === undefined || newValue === null) {
        // Remove attribute if new value is undefined/null
        if (element.hasAttribute(key)) {
          element.removeAttribute(key);
        }
      } else {
        // Update or create attribute
        element.setAttribute(key, newValue);
      }
    });

    // Update text content
    const newTextContent = updatedRow.text !== undefined ? updatedRow.text : originalRow.text;

    // Clear existing text content (text nodes and CDATA)
    const childNodes = Array.from(element.childNodes);
    childNodes.forEach(node => {
      if (node.nodeType === 3 || node.nodeType === 4) {
        // TEXT_NODE or CDATA_SECTION_NODE
        element.removeChild(node);
      }
    });

    // Add new text content if present
    if (newTextContent && newTextContent.trim() !== '') {
      const textNode = doc.createTextNode(newTextContent);
      element.appendChild(textNode);
    }
  });

  // Serialize back to XML string
  return doc.toString();
}