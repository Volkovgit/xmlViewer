/**
 * XMLGrid Component
 *
 * Displays XML document in a tabular grid view using AG-Grid.
 * Supports inline editing, sorting, filtering, and column resizing.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridOptions,
} from 'ag-grid-community';
import { Document } from '@/types/document';
import { buildGridData, GridRowData } from './GridDataBuilder';
import './XMLGrid.css';

// Import AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export interface XMLGridProps {
  /** Document to display in grid view */
  document: Document;
  /** Optional callback when cell value changes - receives updated XML string */
  onCellValueChanged?: (newXml: string) => void;
}

interface XMLGridError {
  message: string;
  type: 'parse' | 'validation';
}

/**
 * XMLGrid component displays XML documents in a tabular format
 * with support for inline editing and data transformation back to XML.
 */
export const XMLGrid: React.FC<XMLGridProps> = ({
  document,
  onCellValueChanged,
}) => {
  const [error, setError] = useState<XMLGridError | null>(null);

  // Parse document content into grid data
  const gridData = useMemo(() => {
    try {
      setError(null);
      return buildGridData(document.content);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown parsing error';
      setError({
        message: errorMessage,
        type: 'parse',
      });
      return { rows: [], columns: [], rootElement: 'root' };
    }
  }, [document.content]);

  // Build column definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    return gridData.columns.map(col => ({
      headerName: col === '_nodeId' ? 'Node ID' : col,
      field: col,
      editable: col !== '_nodeId', // Node ID is not editable
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: col === '_nodeId' ? 200 : 120,
    }));
  }, [gridData.columns]);

  // Handle cell value changes
  const handleCellValueChanged = useCallback(
    (event: any) => {
      if (!onCellValueChanged) return;

      try {
        // Rebuild XML from updated grid data
        const updatedXml = rebuildXmlFromGrid(
          gridData.rootElement,
          event.data,
          gridData.rows
        );
        onCellValueChanged(updatedXml);
      } catch (err) {
        setError({
          message:
            err instanceof Error
              ? err.message
              : 'Failed to update XML document',
          type: 'validation',
        });
      }
    },
    [gridData, onCellValueChanged]
  );

  // Grid options configuration
  const gridOptions: GridOptions = useMemo(
    () => ({
      animateRows: true,
      enableCellTextSelection: true,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        editable: true,
      },
      onCellValueChanged: handleCellValueChanged,
      domLayout: 'normal',
      rowHeight: 40,
      headerHeight: 48,
    }),
    [handleCellValueChanged]
  );

  // Error state UI
  if (error) {
    return (
      <div className="xml-grid-error" role="alert">
        <div className="xml-grid-error-icon">⚠️</div>
        <div className="xml-grid-error-content">
          <h3 className="xml-grid-error-title">
            {error.type === 'parse' ? 'XML Parse Error' : 'Validation Error'}
          </h3>
          <p className="xml-grid-error-message">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state UI
  if (gridData.rows.length === 0) {
    return (
      <div className="xml-grid-empty">
        <div className="xml-grid-empty-icon">📋</div>
        <div className="xml-grid-empty-content">
          <h3 className="xml-grid-empty-title">No Data Available</h3>
          <p className="xml-grid-empty-message">
            This XML document does not contain any elements to display in grid
            view.
          </p>
          <p className="xml-grid-empty-hint">
            Try adding child elements to the root element{' '}
            <code>&lt;{gridData.rootElement}&gt;</code>
          </p>
        </div>
      </div>
    );
  }

  // Main grid UI
  return (
    <div className="xml-grid-container">
      <div className="ag-theme-alpine xml-grid-wrapper">
        <AgGridReact
          rowData={gridData.rows}
          columnDefs={columnDefs}
          gridOptions={gridOptions}
          maintainColumnOrder={true}
        />
      </div>
    </div>
  );
};

export default XMLGrid;

/**
 * Helper function to rebuild XML string from modified grid data
 * Note: This is a basic implementation. A full implementation would need to:
 * - Track original DOM structure
 * - Handle nested elements
 * - Preserve comments and processing instructions
 * - Maintain proper attribute ordering
 */
function rebuildXmlFromGrid(
  rootElement: string,
  updatedRow: GridRowData,
  allRows: GridRowData[]
): string {
  // Find the index of the updated row
  const rowIndex = allRows.findIndex(row => row._nodeId === updatedRow._nodeId);
  if (rowIndex === -1) {
    throw new Error('Cannot locate updated row in grid data');
  }

  // Build XML from all rows
  const rowsXml = allRows
    .map(row => {
      const { _nodeId, text, ...attrs } = row;
      const attributes = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      const attrStr = attributes ? ` ${attributes}` : '';
      return `<element${attrStr}${text ? `>${text}</element>` : ' />'}`;
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n  ${rowsXml}\n</${rootElement}>`;
}
