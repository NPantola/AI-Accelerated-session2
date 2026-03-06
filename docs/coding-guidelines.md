# Coding Guidelines - Todo Application

## Overview
This document establishes the coding style and quality principles for the todo application. Following these guidelines ensures consistent, maintainable, and high-quality code across all project components.

## Code Quality Principles

### DRY (Don't Repeat Yourself)
- Extract common functionality into reusable functions, components, or modules
- Use constants for repeated values (API endpoints, error messages, configuration)
- Create shared utilities for common operations (date formatting, validation, etc.)
- Avoid copy-paste programming - refactor duplicated code into shared abstractions

### KISS (Keep It Simple, Stupid)
- Write simple, readable code over clever or complex solutions
- Break complex functions into smaller, focused functions
- Use clear variable and function names that explain intent
- Avoid unnecessary abstractions until they provide clear value

### YAGNI (You Aren't Gonna Need It)
- Don't implement features until they are actually needed
- Avoid over-engineering solutions for hypothetical future requirements
- Focus on current requirements with flexibility for known future needs
- Remove unused code, dependencies, and commented-out sections

### Single Responsibility Principle
- Each function should do one thing well
- Each component should have a single, clear purpose
- Each module should encapsulate one area of functionality
- Classes should have only one reason to change

## Formatting and Style

### General Formatting Rules
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Maximum 100 characters per line
- **Line Endings**: Unix-style (LF) line endings
- **Encoding**: UTF-8 without BOM
- **Trailing Whitespace**: Remove all trailing whitespace
- **Final Newlines**: Always end files with a single newline

### JavaScript/TypeScript Formatting
- Use semicolons consistently
- Prefer single quotes for strings (unless escaping is needed)
- Use template literals for string interpolation
- Add trailing commas in multi-line arrays and objects
- Use consistent spacing around operators and keywords

```javascript
// Good
const tasks = [
  { id: 1, title: 'First task', completed: false },
  { id: 2, title: 'Second task', completed: true },
];

const message = `Found ${tasks.length} tasks`;

// Bad
const tasks = [
  {id:1,title:"First task",completed:false},
  {id:2,title:"Second task",completed:true}
]

const message = "Found " + tasks.length + " tasks"
```

### JSX/React Formatting
- Use PascalCase for component names
- Use camelCase for props and state variables
- Close self-closing tags with `/>` 
- Use meaningful prop names that describe their purpose
- Keep JSX expressions simple and readable

```jsx
// Good
<TaskItem
  task={task}
  onComplete={handleTaskComplete}
  onEdit={handleTaskEdit}
  isSelected={selectedTaskId === task.id}
/>

// Bad
<TaskItem task={task} onComplete={handleTaskComplete} onEdit={handleTaskEdit} isSelected={selectedTaskId===task.id}></TaskItem>
```

## Import Organization

### Import Order and Grouping
Organize imports in the following order with blank lines between groups:

1. **External libraries** (React, lodash, axios, etc.)
2. **Internal modules** (utilities, services, constants)
3. **Components** (shared components, UI components)
4. **Relative imports** (local files, parent directories)
5. **Type imports** (TypeScript types and interfaces)

```javascript
// External libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Internal modules  
import { API_ENDPOINTS } from '../constants/api';
import { validateTask } from '../utils/validation';
import TaskService from '../services/TaskService';

// Components
import Button from '../components/Button';
import TaskList from '../components/TaskList';

// Relative imports
import './TaskPage.css';

// Type imports (TypeScript)
import type { Task, TaskStatus } from '../types/task';
```

### Import Naming Conventions
- Use descriptive names for default imports
- Use consistent naming for named imports
- Avoid wildcard imports (`import * as`) unless necessary
- Use absolute paths for shared components and utilities

```javascript
// Good
import TaskService from '../services/TaskService';
import { createTask, updateTask } from '../utils/taskHelpers';

// Bad  
import TS from '../services/TaskService';
import * as helpers from '../utils/taskHelpers';
```

## Linter Configuration and Usage

### ESLint Configuration
- Use ESLint with recommended rules as baseline
- Extend with React-specific rules for frontend
- Configure Prettier integration for consistent formatting
- Use TypeScript ESLint rules when using TypeScript

### Required ESLint Rules
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "curly": "error"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5", 
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Pre-commit Hooks
- Use lint-staged to run linters on staged files
- Automatically format code with Prettier before commits
- Run type checking for TypeScript files
- Prevent commits that don't pass linting

## Naming Conventions

### Variables and Functions
- Use camelCase for variables and functions
- Use descriptive names that explain purpose
- Avoid abbreviations unless commonly understood
- Use verbs for function names, nouns for variables

```javascript
// Good
const taskList = [];
const isCompleted = false;
const createdAt = new Date();

function calculateDueDate(task) { }
function validateTaskTitle(title) { }

// Bad
const tl = [];
const flag = false;
const dt = new Date();

function calc(t) { }
function validate(x) { }
```

### Constants and Enums
- Use SCREAMING_SNAKE_CASE for constants
- Group related constants in objects or modules
- Use descriptive names that indicate usage

```javascript
// Good
const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  USERS: '/api/users',
};

const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

// Bad
const api = '/api/tasks';
const status = 'pending';
```

### Components and Classes
- Use PascalCase for React components and classes
- Use descriptive names that indicate functionality
- Avoid generic names like 'Container' or 'Wrapper'

```javascript
// Good
class TaskService { }
function TaskListItem({ task }) { }
function CreateTaskModal({ isOpen }) { }

// Bad
class Service { }
function Item({ data }) { }
function Modal({ open }) { }
```

## Code Organization

### File and Directory Structure
- Group related files in logical directories
- Use consistent naming for similar file types
- Keep files focused and reasonably sized (< 300 lines)
- Separate concerns into different modules

### Component Organization
```
components/
├── common/           # Shared UI components
│   ├── Button/
│   ├── Modal/
│   └── Input/
├── tasks/           # Task-specific components
│   ├── TaskList/
│   ├── TaskItem/
│   └── TaskForm/
└── layout/          # Layout components
    ├── Header/
    ├── Sidebar/
    └── Footer/
```

### Function Organization
- Place helper functions before main function
- Order functions logically (public before private)
- Group related functions together
- Use consistent parameter ordering

```javascript
// Helper functions first
function validateTaskData(task) {
  // validation logic
}

function formatTaskDate(date) {
  // formatting logic  
}

// Main function last
function createTask(taskData) {
  if (!validateTaskData(taskData)) {
    throw new Error('Invalid task data');
  }
  
  const formattedTask = {
    ...taskData,
    createdAt: formatTaskDate(new Date()),
  };
  
  return TaskService.create(formattedTask);
}
```

## Error Handling

### Error Handling Principles
- Fail fast and provide clear error messages
- Use try-catch blocks for operations that can throw
- Validate input parameters at function boundaries
- Handle both synchronous and asynchronous errors

### Error Types and Messages
```javascript
// Good - Descriptive error messages
throw new Error('Task title cannot be empty');
throw new Error(`Task with id ${id} not found`);
throw new Error('Due date must be in the future');

// Bad - Generic error messages
throw new Error('Invalid input');
throw new Error('Error occurred');
throw new Error('Bad request');
```

### Async Error Handling
```javascript
// Good - Proper async error handling
async function fetchTasks() {
  try {
    const response = await TaskService.getTasks();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error.message);
    throw new Error('Unable to load tasks. Please try again.');
  }
}

// Bad - Missing error handling
async function fetchTasks() {
  const response = await TaskService.getTasks();
  return response.data;
}
```

## Performance Best Practices

### React Performance
- Use React.memo for pure components
- Use useCallback and useMemo appropriately
- Avoid creating objects/functions in render
- Use proper key props in lists

```jsx
// Good - Memoized component with proper props
const TaskItem = React.memo(({ task, onComplete, onEdit }) => {
  return (
    <div className="task-item">
      <span>{task.title}</span>
      <button onClick={() => onComplete(task.id)}>Complete</button>
      <button onClick={() => onEdit(task.id)}>Edit</button>
    </div>
  );
});

// Bad - New functions created on every render
function TaskItem({ task, onComplete, onEdit }) {
  return (
    <div className="task-item">
      <span>{task.title}</span>
      <button onClick={() => onComplete(task.id)}>Complete</button>
      <button onClick={() => onEdit(task.id)}>Edit</button>
    </div>
  );
}
```

### General Performance
- Avoid premature optimization
- Use appropriate data structures for the task
- Minimize DOM manipulations
- Debounce expensive operations like search

## Documentation and Comments

### Code Documentation
- Write self-documenting code with clear names
- Add comments for complex business logic
- Document public APIs and interfaces
- Include examples for non-obvious usage

```javascript
/**
 * Calculates the priority score for task sorting
 * Higher scores indicate higher priority
 * 
 * @param {Object} task - The task object to calculate priority for
 * @param {string} task.priority - Priority level (high, medium, low)
 * @param {Date} task.dueDate - When the task is due
 * @returns {number} Priority score (0-100)
 * 
 * @example
 * const score = calculatePriorityScore({
 *   priority: 'high',
 *   dueDate: new Date('2026-03-10')
 * });
 */
function calculatePriorityScore(task) {
  // Business logic for priority calculation
  // High priority = 70-100, Medium = 40-69, Low = 0-39
  // Due date proximity adds 0-30 points
}
```

### Inline Comments
- Explain why, not what
- Keep comments up-to-date with code changes
- Remove obsolete comments
- Use TODO comments for future improvements

```javascript
// Good - Explains the reasoning
// Use exponential backoff to handle rate limiting from API
const delay = Math.pow(2, retryCount) * 1000;

// Bad - States the obvious
// Set delay to 2 raised to retry count times 1000
const delay = Math.pow(2, retryCount) * 1000;
```

## Security Best Practices

### Input Validation
- Validate all user inputs on both client and server
- Sanitize data before database operations
- Use parameterized queries to prevent SQL injection
- Validate file uploads and limit file types

### Authentication and Authorization
- Never store passwords in plain text
- Use HTTPS for all data transmission
- Implement proper session management
- Follow principle of least privilege

### Data Protection
- Don't log sensitive information
- Remove debug code from production builds
- Use environment variables for secrets
- Implement proper error messages that don't leak information

## Git and Version Control

### Commit Messages
- Use present tense for commit messages
- Start with a verb (Add, Fix, Update, Remove)
- Keep first line under 50 characters
- Add detailed description if needed

```
Good examples:
- Add task filtering by priority level
- Fix due date validation for past dates  
- Update API endpoint for task creation
- Remove deprecated task sorting method

Bad examples:
- Added some stuff
- Fixed bug
- Updates
- WIP
```

### Branch Naming
- Use descriptive branch names
- Include issue number when applicable
- Use consistent prefixes (feature/, bugfix/, hotfix/)

```
Good examples:
- feature/task-filtering
- bugfix/due-date-validation
- feature/123-user-authentication

Bad examples:
- my-branch
- fix
- temp-branch
```

## Code Review Guidelines

### Review Focus Areas
- Code correctness and logic
- Performance implications
- Security considerations  
- Code style and consistency
- Test coverage and quality

### Review Best Practices
- Be constructive and specific in feedback
- Suggest alternatives when pointing out issues
- Ask questions to understand intent
- Approve when code meets standards
- Test functionality when possible