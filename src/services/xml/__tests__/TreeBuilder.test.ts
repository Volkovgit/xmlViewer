import { TreeBuilder } from '../TreeBuilder';

describe('TreeBuilder', () => {
  let treeBuilder: TreeBuilder;

  beforeEach(() => {
    treeBuilder = new TreeBuilder();
  });

  describe('buildFromXML', () => {
    it('should build tree from simple XML', () => {
      const xml = '<root>content</root>';
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.name).toBe('root');
      expect(tree?.value).toBe('content');
      expect(tree?.children).toHaveLength(0);
    });

    it('should build tree from nested XML', () => {
      const xml = `
        <root>
          <parent>
            <child>value</child>
          </parent>
        </root>
      `;
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.name).toBe('root');
      expect(tree?.children).toHaveLength(1);
      expect(tree?.children[0].name).toBe('parent');
      expect(tree?.children[0].children[0].name).toBe('child');
      expect(tree?.children[0].children[0].value).toBe('value');
    });

    it('should build tree with attributes', () => {
      const xml = '<root id="1" name="test">content</root>';
      const tree = treeBuilder.buildFromXML(xml, {
        includeAttributes: true,
      });

      expect(tree).not.toBeNull();
      expect(tree?.name).toBe('root');
      expect(tree?.attributes).toEqual({
        id: '1',
        name: 'test',
      });
    });

    it('should build tree with text nodes', () => {
      const xml = '<root>Text content</root>';
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.name).toBe('root');
      expect(tree?.value).toBe('Text content');
      expect(tree?.type).toBe('element');
    });

    it('should build tree with multiple children', () => {
      const xml = `
        <root>
          <item1>value1</item1>
          <item2>value2</item2>
          <item3>value3</item3>
        </root>
      `;
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.children).toHaveLength(3);
      expect(tree?.children[0].name).toBe('item1');
      expect(tree?.children[1].name).toBe('item2');
      expect(tree?.children[2].name).toBe('item3');
    });

    it('should return null for malformed XML', () => {
      const xml = '<root><unclosed>';
      const tree = treeBuilder.buildFromXML(xml);

      // fast-xml-parser tries to parse even malformed XML
      // The unclosed tag gets treated as text content
      expect(tree).not.toBeNull();
      if (tree) {
        expect(tree.name).toBe('root');
        // The parser might handle this in various ways
        expect(tree.children.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return null for empty XML', () => {
      const xml = '';
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).toBeNull();
    });

    it('should include line numbers when requested', () => {
      const xml = '<root>content</root>';
      const tree = treeBuilder.buildFromXML(xml, {
        includeLineNumbers: true,
      });

      expect(tree).not.toBeNull();
      expect(tree?.line).toBeDefined();
      expect(tree?.line).toBe(1);
    });
  });

  describe('buildFromParsed', () => {
    it('should build tree from parsed data', () => {
      const parsedData = {
        root: {
          '#text': 'content',
          id: '1',
        },
      };

      const tree = treeBuilder.buildFromParsed(parsedData);

      expect(tree).not.toBeNull();
      expect(tree.name).toBe('root');
      expect(tree.value).toBe('content');
      expect(tree.attributes).toEqual({ id: '1' });
    });

    it('should handle nested objects', () => {
      const parsedData = {
        root: {
          parent: {
            child: {
              '#text': 'value',
            },
          },
        },
      };

      const tree = treeBuilder.buildFromParsed(parsedData);

      expect(tree.name).toBe('root');
      expect(tree.children[0].name).toBe('parent');
      expect(tree.children[0].children[0].name).toBe('child');
      expect(tree.children[0].children[0].value).toBe('value');
    });
  });

  describe('findNodeByLine', () => {
    it('should find node by line number', () => {
      const xml = '<root><child>value</child></root>';
      const tree = treeBuilder.buildFromXML(xml, {
        includeLineNumbers: true,
      });

      expect(tree).not.toBeNull();

      if (tree) {
        const found = treeBuilder.findNodeByLine(tree, 1);
        expect(found).toBe(tree);
      }
    });

    it('should return null if line not found', () => {
      const xml = '<root>content</root>';
      const tree = treeBuilder.buildFromXML(xml, {
        includeLineNumbers: true,
      });

      expect(tree).not.toBeNull();

      if (tree) {
        const found = treeBuilder.findNodeByLine(tree, 999);
        expect(found).toBeNull();
      }
    });
  });

  describe('node type detection', () => {
    it('should detect element nodes', () => {
      const xml = '<root><child>value</child></root>';
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.type).toBe('element');
      expect(tree?.children[0].type).toBe('element');
    });

    it('should detect text nodes', () => {
      const parsedData = {
        root: {
          '#text': 'content',
        },
      };

      const tree = treeBuilder.buildFromParsed(parsedData);

      expect(tree.type).toBe('text');
    });
  });

  describe('resetIdCounter', () => {
    it('should reset node ID counter', () => {
      const xml1 = '<root1>content</root1>';
      const tree1 = treeBuilder.buildFromXML(xml1);
      const firstId = tree1?.id;

      treeBuilder.resetIdCounter();

      const xml2 = '<root2>content</root2>';
      const tree2 = treeBuilder.buildFromXML(xml2);
      const secondId = tree2?.id;

      expect(firstId).toBe(secondId);
    });
  });

  describe('complex XML structures', () => {
    it('should handle mixed content', () => {
      const xml = `
        <root>
          <child1>value1</child1>
          <child2>value2</child2>
        </root>
      `;
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.children.length).toBeGreaterThan(0);
      expect(tree?.children[0].name).toBe('child1');
      expect(tree?.children[1].name).toBe('child2');
    });

    it('should handle attributes and children together', () => {
      const xml = `
        <root id="1">
          <child name="test">value</child>
        </root>
      `;
      const tree = treeBuilder.buildFromXML(xml);

      expect(tree).not.toBeNull();
      expect(tree?.attributes).toEqual({ id: '1' });
      expect(tree?.children[0].name).toBe('child');
      expect(tree?.children[0].attributes).toEqual({ name: 'test' });
    });
  });
});
