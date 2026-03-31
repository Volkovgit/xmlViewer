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
    const warning = doc.documentElement?.querySelector?.('warning');
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