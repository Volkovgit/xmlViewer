# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-03-31

### Added - Modern UI Redesign

This release includes a comprehensive UI redesign bringing the application from a 2007-era interface to a modern, responsive design.

#### New Components

- **AppLayout** - Split layout foundation with 240px left sidebar and main content area
- **LeftSidebar** - Container component for ActionsPanel and FilesPanel
- **ActionsPanel** - Context-sensitive action buttons that change based on document type
  - XSD files: Show Graph, Generate XML, Validate
  - XML files: Generate XSD, Assign Schema, Validate XSD
- **FilesPanel** - Document list with status indicators
  - Shows all open documents
  - File type icons (XML/XSD)
  - Active document highlighting
  - Status badges (dirty state, error count)
- **PrimaryActionButton** - Gradient button for primary actions (purple gradient)
- **SecondaryActionButton** - Light blue button for secondary actions
- **DirtyBadge** - Orange dot indicator for unsaved changes
- **ErrorBadge** - Red badge showing validation error count
- **SidebarToggle** - Mobile-friendly hamburger menu button

#### Design Improvements

- Modern blue color scheme with CSS variables
  - Primary: `#2196f3` (blue)
  - Gradient: `#667eea` to `#764ba2` (purple gradient for primary buttons)
  - Light backgrounds: `#f0f4ff`, `#e3f2fd`
- SVG icons using Lucide React (replacing emoji)
- Hover animations on all buttons (scale, shadow, color transitions)
- Tooltips on all action buttons using Tippy.js
- Responsive design with mobile breakpoint at 768px
- Smooth transitions and micro-animations
- Modern border radius and shadows

#### Refactoring

- **DocumentToolbar → TopBar**
  - Simplified component focused on file operations (New, Open, Save)
  - Removed XSD-specific buttons (moved to sidebar ActionsPanel)
  - Updated styling to match modern theme
  - Updated all references and tests

#### Dependencies Added

- `lucide-react@^0.300.0` - Modern SVG icon library
- `@tippyjs/react@^4.2.1` - Tooltip library with animations

#### Files Modified

- `README.md` - Added Modern UI section with feature descriptions
- `CLAUDE.md` - Updated architecture documentation with new components
- `src/core/documentManager/DocumentManager.tsx` - Integrated AppLayout and sidebar
- `src/core/documentManager/TopBar.tsx` - Renamed from DocumentToolbar, simplified
- All test files updated for new component names

#### Breaking Changes

None. All existing functionality preserved.

#### Migration Notes

No migration required. The new UI is a drop-in replacement for the previous layout.

### Changed

- Updated project status from Phase 0 to Phase 3 (Advanced Views complete)
- Improved visual hierarchy with sidebar-based actions
- Better mobile and tablet responsiveness

### Fixed

- Improved button accessibility with proper ARIA labels
- Better keyboard navigation support

## [0.2.0] - 2026-03-30

### Added

- Phase 3: Advanced Views implementation
- AG-Grid table view for XML editing
- Enhanced tree view with drag-drop
- Multi-view synchronization system
- Schema-aware autocompletion
- XSD graph visualization

### Changed

- Improved validation error handling
- Enhanced document state management

## [0.1.0] - 2026-03-15

### Added

- Phase 1 & 2: MVP XML Editor with XSD Support
- Basic XML text editor with Monaco
- XML validation with error panel
- XSD text editor
- XML vs XSD validation
- XSD generation from XML
- XML generation from XSD
- Basic XML tree view
- File operations (open/save/drag-drop)

## [0.0.1] - 2026-03-01

### Added

- Phase 0: Project Setup
- Vite + React + TypeScript infrastructure
- ESLint, Prettier, Vitest configuration
- Base project structure
- Development workflow setup
