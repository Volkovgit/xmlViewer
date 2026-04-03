// XSD schema services
export { parseXSD } from './XSDParser';
export type {
  XSDSchema,
  XSDElement,
  XSDComplexType,
  XSDSimpleType,
  XSDAttribute,
  XSDRestriction,
  XSDOccurrence,
} from './XSDParser';

export { validateXMLAgainstXSD, validateXMLAgainstSchema } from './XSDValidator';
export { generateXSDFromXML } from './XSDGenerator';
export { generateXMLFromXSD, type GenerateXMLOptions } from './XMLFromXSDGenerator';

// Schema-aware editing services
export { SchemaProvider } from './schemaProvider/SchemaProvider';

export {
  XMLContextAnalyzer,
  type ContextPosition,
  type XMLContext,
} from './contextAnalyzer/XMLContextAnalyzer';
export { ContextStack } from './contextAnalyzer/ContextStack';

export { SchemaCompletionProvider } from './completion/SchemaCompletionProvider';
export {
  generateElementSuggestion,
  generateAttributeSuggestion,
  generateEnumerationSuggestions,
} from './completion/CompletionItems';

export { SchemaDecorationProvider } from './decorations/SchemaDecorationProvider';
export { SchemaQuickFixProvider } from './quickFix/SchemaQuickFixProvider';

// Constraint-aware value generators
export {
  PatternMatcher,
  NumericRangeGenerator,
  LengthConstraintGenerator,
  EnumerationSelector,
  ConstraintValueGenerator,
} from './generators';
