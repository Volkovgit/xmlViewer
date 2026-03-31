import { describe, it, expect } from 'vitest';
import { TreeManipulator } from '../TreeManipulator';
import { XMLNode } from '../TreeBuilder';

describe('TreeManipulator', () => {
  const sampleNode: XMLNode = {
    id: 'root-1',
    name: 'root',
    attributes: {},
    children: [
      { id: 'child-1', name: 'item', value: 'First', attributes: {}, children: [], type: 'element' },
      { id: 'child-2', name: 'item', value: 'Second', attributes: {}, children: [], type: 'element' }
    ],
    type: 'element'
  };

  it('should add child node to parent', () => {
    const manipulator = new TreeManipulator();
    const newChild: XMLNode = {
      id: 'new-1',
      name: 'newItem',
      value: 'New',
      attributes: {},
      children: [],
      type: 'element'
    };

    const result = manipulator.addChild(sampleNode, newChild);
    expect(result.children).toHaveLength(3);
    expect(result.children[2].name).toBe('newItem');
  });

  it('should remove node by ID', () => {
    const manipulator = new TreeManipulator();
    const result = manipulator.removeNode(sampleNode, 'child-1');
    expect(result.children).toHaveLength(1);
    expect(result.children[0].id).toBe('child-2');
  });

  it('should move node to new position', () => {
    const manipulator = new TreeManipulator();
    const result = manipulator.moveNode(sampleNode, 'child-1', 1);
    expect(result.children[0].id).toBe('child-2');
    expect(result.children[1].id).toBe('child-1');
  });

  it('should duplicate node with new ID', () => {
    const manipulator = new TreeManipulator();
    const result = manipulator.duplicateNode(sampleNode, 'child-1');
    expect(result.children).toHaveLength(3);
    expect(result.children[2].name).toBe('item');
    expect(result.children[2].id).not.toBe('child-1');
  });

  it('should find node by ID', () => {
    const manipulator = new TreeManipulator();
    const found = manipulator.findNode(sampleNode, 'child-2');
    expect(found).toBeDefined();
    expect(found?.id).toBe('child-2');
  });

  it('should serialize tree to XML', () => {
    const manipulator = new TreeManipulator();
    const xml = manipulator.toXML(sampleNode);
    expect(xml).toContain('<root>');
    expect(xml).toContain('<item>First</item>');
    expect(xml).toContain('<item>Second</item>');
    expect(xml).toContain('</root>');
  });

  it('should update node value', () => {
    const manipulator = new TreeManipulator();
    const result = manipulator.updateNode(sampleNode, 'child-1', { value: 'Updated' });
    const child = result.children.find(c => c.id === 'child-1');
    expect(child?.value).toBe('Updated');
  });
});
