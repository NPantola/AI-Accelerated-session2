# UI Guidelines - Todo Application

## Overview
This document establishes the visual design standards and user interface guidelines for the todo application. These guidelines ensure consistency, accessibility, and a professional user experience across all components.

## Design System Framework

### Material Design Components
- **REQUIRED**: All UI components must use Material Design principles and components
- Utilize Material UI (MUI) library for React implementation
- Follow Material Design 3 (Material You) specifications
- Maintain consistent elevation, spacing, and motion patterns
- Use Material Design icons from the official icon set

## Color Palette

### Primary Colors
- **Primary**: `#1976d2` (Blue 700)
- **Primary Light**: `#42a5f5` (Blue 400)  
- **Primary Dark**: `#1565c0` (Blue 800)
- **Primary Contrast**: `#ffffff` (White)

### Secondary Colors
- **Secondary**: `#dc004e` (Pink A400)
- **Secondary Light**: `#ff5983` (Pink A200)
- **Secondary Dark**: `#9a0036` (Pink A700)
- **Secondary Contrast**: `#ffffff` (White)

### Semantic Colors
- **Success**: `#4caf50` (Green 500)
- **Warning**: `#ff9800` (Orange 500)
- **Error**: `#f44336` (Red 500)
- **Info**: `#2196f3` (Blue 500)

### Neutral Colors
- **Background**: `#fafafa` (Grey 50)
- **Surface**: `#ffffff` (White)
- **Surface Variant**: `#f5f5f5` (Grey 100)
- **On Surface**: `#212121` (Grey 900)
- **On Surface Variant**: `#757575` (Grey 600)
- **Outline**: `#e0e0e0` (Grey 300)

### Task Status Colors
- **Complete**: `#4caf50` (Success Green)
- **Overdue**: `#f44336` (Error Red)
- **Due Soon**: `#ff9800` (Warning Orange)
- **No Due Date**: `#9e9e9e` (Grey 500)

## Typography

### Font Family
- **Primary**: 'Roboto', sans-serif
- **Monospace**: 'Roboto Mono', monospace (for dates/times)

### Text Styles
- **H1 (Page Title)**: 32px, Medium (500), Letter spacing -0.5px
- **H2 (Section Title)**: 24px, Medium (500), Letter spacing 0px
- **H3 (Subsection)**: 20px, Medium (500), Letter spacing 0.15px
- **Body 1 (Primary Text)**: 16px, Regular (400), Letter spacing 0.5px, Line height 1.5
- **Body 2 (Secondary Text)**: 14px, Regular (400), Letter spacing 0.25px, Line height 1.43
- **Caption**: 12px, Regular (400), Letter spacing 0.4px
- **Button Text**: 14px, Medium (500), Letter spacing 1.25px, Uppercase

## Button Styles

### Primary Buttons
- Use Material Design `contained` variant
- Primary color background (`#1976d2`)
- White text color
- 8px border radius
- 36px minimum height
- 16px horizontal padding
- Hover state: Slightly darker background with elevation increase

### Secondary Buttons  
- Use Material Design `outlined` variant
- Primary color border and text (`#1976d2`)
- Transparent background
- 8px border radius
- 36px minimum height
- 16px horizontal padding
- Hover state: Light primary color background (8% opacity)

### Text Buttons
- Use Material Design `text` variant
- Primary color text (`#1976d2`)
- No background or border
- 36px minimum height
- 8px horizontal padding
- Hover state: Light primary color background (4% opacity)

### Icon Buttons
- 48x48px touch target minimum
- 24px icon size
- 12px padding around icon
- Circular hover/focus ripple effect
- Use for actions like delete, edit, favorite

### Floating Action Button (FAB)
- Use for primary task creation action
- 56px diameter (large) or 40px diameter (small)
- Primary color background
- White icon color
- 2dp elevation (resting), 6dp elevation (pressed)
- Position: Fixed bottom-right, 16px from edges

## Layout and Spacing

### Grid System
- Use Material Design 8px grid system
- Base spacing unit: 8px
- Component spacing: 8px, 16px, 24px, 32px, 40px, 48px
- Page margins: 16px (mobile), 24px (tablet), 32px (desktop)

### Elevation
- **Level 0**: Surface, cards at rest
- **Level 1**: Raised cards, search bars
- **Level 2**: FAB at rest, snackbars
- **Level 3**: Drawers, modals
- **Level 4**: Navigation bars
- **Level 6**: FAB pressed state
- **Level 8**: Menus, pickers

## Task List Components

### Task Cards
- Material Design Card component
- 1dp elevation
- 8px border radius
- 16px padding
- White background
- Subtle shadow for depth
- Hover effect: Increase elevation to 2dp

### Task Status Indicators
- Use Material Design Checkbox for completion status
- Color-coded left border (4px width) for priority/status
- Icons from Material Design icon set only

### Due Date Display
- Use Chip component for due dates
- Small size variant
- Color based on due date status (overdue, due soon, future)
- Include calendar icon

## Form Components

### Input Fields
- Use Material Design TextField component
- Outlined variant preferred
- 16px border radius
- Proper label and helper text
- Error states with appropriate error colors
- Focus indicators following Material guidelines

### Date/Time Pickers
- Use Material Design DatePicker/TimePicker
- Consistent with overall color scheme
- Clear visual hierarchy
- Touch-friendly sizing

## Accessibility Requirements

### Color Contrast
- **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio for normal text
- **WCAG AA Compliance**: Minimum 3:1 contrast ratio for large text
- **WCAG AAA Target**: 7:1 contrast ratio where possible
- Never rely solely on color to convey information

### Focus Management
- All interactive elements must have visible focus indicators
- Focus indicators must have 3:1 contrast ratio minimum
- Logical tab order through all interface elements
- Focus traps in modal dialogs

### Keyboard Navigation
- All functionality accessible via keyboard
- Standard keyboard shortcuts (Enter, Space, Escape, Arrow keys)
- Skip links for main content areas
- Consistent navigation patterns

### Screen Reader Support
- Proper semantic HTML structure
- ARIA labels for all interactive elements
- ARIA live regions for dynamic content updates
- Descriptive alt text for all images/icons
- Form labels properly associated with inputs

### Touch Accessibility
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- No hover-dependent functionality
- Gesture alternatives for complex interactions

### Typography Accessibility
- Minimum 16px font size for body text
- Maximum 80 characters per line for readability
- Sufficient line height (1.5x font size minimum)
- Left-aligned text (avoid center/right alignment for paragraphs)

## Motion and Animation

### Transitions
- Use Material Design easing curves
- Standard duration: 300ms for most transitions
- Enter animations: 200ms
- Exit animations: 150ms
- Complex animations: 400-500ms maximum

### Interaction Feedback
- Ripple effects on all clickable elements
- Loading states for operations >100ms
- Success/error feedback for user actions
- Smooth state transitions

## Responsive Design

### Breakpoints
- **Mobile**: 0-599px
- **Tablet**: 600-959px  
- **Desktop**: 960px+

### Layout Adaptations
- Single column layout on mobile
- Multi-column layouts on larger screens
- Touch-friendly sizing on mobile devices
- Keyboard-friendly sizing on desktop

## Component States

### Interactive States
- **Default**: Base appearance
- **Hover**: Subtle background change or elevation increase
- **Focus**: Clear focus indicator
- **Active/Pressed**: Visual feedback during interaction
- **Disabled**: Reduced opacity (38%) and no interaction

### Loading States
- Skeleton loaders for content areas
- Progress indicators for operations
- Disabled state for form submission
- Clear messaging about loading progress

## Brand Consistency

### Logo Usage
- Maintain clear space around logo
- Do not modify logo colors or proportions
- Use appropriate logo variant for background

### Voice and Tone
- Clear, concise messaging
- Helpful error messages
- Positive reinforcement for completed actions
- Professional yet friendly tone