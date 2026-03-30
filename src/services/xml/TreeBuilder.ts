import { xmlParser } from './XMLParser';

/**
 * XMLNode interface
 * Represents a node in the XML tree structure
 */
export interface XMLNode {
  /** Unique node identifier */
  id: string;
  /** Element/tag name */
  name: string;
  /** Text content (if present) */
  value?: string;
  /** Attributes as key-value pairs */
  attributes: Record<string, string>;
  /** Child nodes */
  children: XMLNode[];
  /** Line number in source XML (optional) */
  line?: number;
  /** Column number in source XML (optional) */
  column?: number;
  /** Node type */
  type: 'element' | 'text' | 'comment' | 'cdata';
}

/**
 * Build options interface
 * Configuration options for building XML tree
 */
export interface BuildOptions {
  /** Whether to include attributes in tree (default: true) */
  includeAttributes?: boolean;
  /** Whether to include line numbers (default: false) */
  includeLineNumbers?: boolean;
}

/**
 * TreeBuilder Service
 *
 * Builds hierarchical tree structures from parsed XML data.
 * Supports recursive node creation with configurable options.
 *
 * @example
 * ```typescript
 * const tree = treeBuilder.buildFromXML('<root><item>Test</item></root>');
 * console.log(tree); // XMLNode with root element and children
 * ```
 */
export class TreeBuilder {
  /** Counter for generating unique node IDs */
  private nodeIdCounter = 0;

  /**
   * Build tree from XML string
   *
   * @param xmlString - The XML string to parse
   * @param options - Optional build configuration
   * @returns Root XMLNode or null if parsing fails
   */
  buildFromXML(xmlString: string, options: BuildOptions = {}): XMLNode | null {
    const parseResult = xmlParser.parseXML(xmlString);

    if (!parseResult.success || !parseResult.data) {
      return null;
    }

    return this.buildFromParsed(parseResult.data, options);
  }

  /**
   * Build tree from already parsed data
   *
   * @param data - Parsed XML object
   * @param options - Optional build configuration
   * @returns Root XMLNode
   */
  buildFromParsed(data: any, options: BuildOptions = {}): XMLNode {
    // Handle root element
    const rootKey = Object.keys(data)[0];
    const rootData = data[rootKey];

    return this.createNode(rootKey, rootData, options, 1);
  }

  /**
   * Recursively create XMLNode from data
   *
   * @param name - Element name
   * @param data - Element data (object, string, or array)
   * @param options - Build options
   * @param line - Current line number
   * @returns Created XMLNode
   */
  private createNode(
    name: string,
    data: any,
    options: BuildOptions,
    line: number
  ): XMLNode {
    const node: XMLNode = {
      id: `node-${this.nodeIdCounter++}`,
      name,
      type: this.getNodeType(data),
      line: options.includeLineNumbers ? line : undefined,
      attributes: {},
      children: [],
    };

    // Handle null or primitive data
    if (data === null || data === undefined) {
      return node;
    }

    if (typeof data !== 'object') {
      // Primitive value (text content)
      node.value = String(data);
      return node;
    }

    // Separate keys into potential attributes and children
    // A key is an attribute if:
    // 1. Its value is a primitive (string, number, boolean)
    // 2. It's not a special key (#text, #cdata)
    // 3. Either the node has #text OR the node has object children (indicating mixed content)

    const hasTextContent = '#text' in data;
    const hasObjectChildren = Object.keys(data).some(
      (key) =>
        !key.startsWith('#') &&
        typeof data[key] === 'object' &&
        data[key] !== null &&
        !Array.isArray(data[key])
    );

    // Extract attributes and children
    if (data && typeof data === 'object') {
      Object.keys(data).forEach((key) => {
        if (key === '#text') {
          // Text content
          node.value = data[key];
        } else if (key === '#cdata') {
          // CDATA content
          node.value = data[key];
          node.type = 'cdata';
        } else if (Array.isArray(data[key])) {
          // Child elements (array of objects)
          data[key].forEach((child: any, index: number) => {
            if (child && typeof child === 'object') {
              const childNode = this.createNode(
                key,
                child,
                options,
                line + index
              );
              node.children.push(childNode);
            } else if (child !== null && child !== undefined) {
              // Primitive value in array
              const childNode: XMLNode = {
                id: `node-${this.nodeIdCounter++}`,
                name: key,
                type: 'element',
                value: String(child),
                attributes: {},
                children: [],
              };
              node.children.push(childNode);
            }
          });
        } else if (
          typeof data[key] === 'object' &&
          data[key] !== null &&
          !key.startsWith('#')
        ) {
          // Nested object (single child element)
          const childNode = this.createNode(key, data[key], options, line);
          node.children.push(childNode);
        } else if (!key.startsWith('#')) {
          // Primitive value that's not #text or #cdata
          // Determine if it's an attribute or child element
          // It's an attribute if the node has text content OR has object children
          const isAttribute =
            (hasTextContent || hasObjectChildren) &&
            options.includeAttributes !== false;

          if (isAttribute) {
            // This is an attribute
            node.attributes[key] = String(data[key]);
          } else {
            // This is a child element with primitive value
            const childNode: XMLNode = {
              id: `node-${this.nodeIdCounter++}`,
              name: key,
              type: 'element',
              value: String(data[key]),
              attributes: {},
              children: [],
            };
            node.children.push(childNode);
          }
        }
      });
    }

    return node;
  }

  /**
   * Determine node type based on data structure
   *
   * @param data - Node data
   * @returns Node type
   */
  private getNodeType(data: any): XMLNode['type'] {
    // Text-only node
    if (
      data &&
      typeof data === 'object' &&
      Object.keys(data).length === 1 &&
      '#text' in data
    ) {
      return 'text';
    }

    // CDATA node
    if (
      data &&
      typeof data === 'object' &&
      Object.keys(data).length === 1 &&
      '#cdata' in data
    ) {
      return 'cdata';
    }

    // Default to element
    return 'element';
  }

  /**
   * Find a node by line number
   *
   * @param root - Root XMLNode to search from
   * @param line - Line number to find
   * @returns Found XMLNode or null
   */
  findNodeByLine(root: XMLNode, line: number): XMLNode | null {
    if (root.line === line) {
      return root;
    }

    for (const child of root.children) {
      const found = this.findNodeByLine(child, line);
      if (found) return found;
    }

    return null;
  }

  /**
   * Reset node ID counter
   * Useful for tests to ensure consistent IDs
   */
  resetIdCounter(): void {
    this.nodeIdCounter = 0;
  }
}

/**
 * Singleton instance of TreeBuilder
 * Exported for convenient use throughout the application
 */
export const treeBuilder = new TreeBuilder();
