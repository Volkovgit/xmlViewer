/**
 * XMLGrid Component
 *
 * Displays XML document in a tabular grid view using AG-Grid.
 * Supports inline editing, sorting, filtering, and column resizing.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type {
  ColDef,
  GridOptions,
} from 'ag-grid-community';
import { Document } from '@/types/document';
import { buildGridData, updateXMLFromGrid } from './GridDataBuilder';
import { useViewSync } from '@/hooks/useViewSync';
import { ChangeType, ViewType } from '@/core/viewManager/ViewUpdate';
import { useDocumentStore } from '@/stores/documentStore';
import './XMLGrid.css';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Import AG-Grid styles (new Theming API)
import 'ag-grid-community/styles/ag-grid.css';

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

  // View synchronization
  const { notifyViewChanged } = useViewSync(document, ViewType.GRID);
  const { updateDocumentContent } = useDocumentStore();

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
      try {
        // Create updated rows array with the modified row
        const updatedRows = gridData.rows.map(row =>
          row._nodeId === event.data._nodeId ? event.data : row
        );

        // Update XML from grid changes
        const updatedXml = updateXMLFromGrid({
          originalXml: document.content,
          originalGridData: gridData,
          updatedRows
        });

        // Update document in store
        updateDocumentContent(document.id, updatedXml);

        // Notify other views of change
        notifyViewChanged(updatedXml, ChangeType.CONTENT);

        // Call original callback if provided
        onCellValueChanged?.(updatedXml);
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
    [gridData, document, updateDocumentContent, notifyViewChanged, onCellValueChanged]
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
      <div className="ag-theme-quartz xml-grid-wrapper">
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
