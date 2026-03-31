import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DocumentManager } from '@/core/documentManager';
import './index.css';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <DocumentManager />
      </div>
    </DndProvider>
  );
}

export default App;
