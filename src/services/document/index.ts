/**
 * DocumentFactory Service
 *
 * Factory methods for creating documents from files or as new untitled documents.
 * Provides document type detection, unique ID generation, and default content templates.
 */

export {
  generateDocumentId,
  detectDocumentType,
  createUntitledDocument,
  createDocumentFromFile,
  resetUntitledCounters,
} from './DocumentFactory';
