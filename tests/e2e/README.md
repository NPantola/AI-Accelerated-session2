# End-to-End Testing Documentation

This directory contains comprehensive end-to-end (E2E) tests for the Todo Application using Playwright with the Page Object Model pattern.

## Overview

The E2E test suite covers all critical user journeys and ensures the application works correctly across different browsers, devices, and scenarios.

## Test Structure

### Test Files

- **`todo-workflow.spec.js`** - Core CRUD operations and main user workflows
- **`task-filtering.spec.js`** - Filtering, sorting, and search functionality
- **`task-validation.spec.js`** - Form validation, error handling, and edge cases
- **`performance-accessibility.spec.js`** - Performance testing and accessibility compliance
- **`mobile-crossbrowser.spec.js`** - Mobile responsiveness and cross-browser compatibility

### Supporting Files

- **`pages/TodoPage.js`** - Page Object Model with all selectors and interactions
- **`utils/testHelpers.js`** - Utility functions for test data generation and verification
- **`utils/globalSetup.js`** - Global test environment setup
- **`utils/globalTeardown.js`** - Global cleanup after test completion

## Setup Requirements

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **Playwright** dependencies installed
3. **Backend server** running on http://localhost:3030
4. **Frontend server** running on http://localhost:3000

### Installation

```bash
# Install Playwright and dependencies
npm install -D @playwright/test

# Install browser binaries
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

## Running Tests

### Start Required Services

Before running E2E tests, ensure both servers are running:

```bash
# Terminal 1: Start backend server
npm run start --workspace=backend

# Terminal 2: Start frontend server  
npm run start --workspace=frontend
```

### Run All E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test todo-workflow.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed
```

### Run Tests by Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

### Run Specific Test Categories

```bash
# Core functionality tests
npx playwright test todo-workflow

# Filtering and search tests
npx playwright test task-filtering

# Validation and error handling
npx playwright test task-validation

# Performance and accessibility
npx playwright test performance-accessibility

# Mobile and cross-browser
npx playwright test mobile-crossbrowser
```

## Test Configuration

The testing setup is configured in `playwright.config.js`:

- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile devices**: iPhone 12, Pixel 5, iPad Pro
- **Base URL**: http://localhost:3000
- **Timeouts**: 60s test timeout, 15s action timeout
- **Retry**: 2 retries on CI, 0 locally
- **Artifacts**: Screenshots and videos on failure only

## Page Object Model

The `TodoPage` class provides a clean interface for interacting with the application:

```javascript
const { TodoPage } = require('./pages/TodoPage');

test('example test', async ({ page }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();
  
  // Create a task
  await todoPage.createTask({
    title: 'Test Task',
    description: 'Task description',
    priority: 'high'
  });
  
  // Verify task exists
  await expect(todoPage.getTaskByTitle('Test Task')).toBeVisible();
});
```

## Test Data Management

Use the helper functions for consistent test data:

```javascript
const { generateTaskData, createTestTasks } = require('./utils/testHelpers');

// Generate single task with random data
const task = generateTaskData({ title: 'Custom Title' });

// Generate multiple test tasks
const tasks = await createTestTasks(5);
```

## Debugging Tests

### Visual Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --slow-mo=1000

# Debug mode (pauses on failures)
npx playwright test --debug
```

### Trace Viewer

```bash
# Generate trace file
npx playwright test --trace on

# View trace (after test run)
npx playwright show-trace test-results/trace.zip
```

### Screenshots and Videos

Test artifacts are automatically saved on failures:
- Screenshots: `test-results/`
- Videos: `test-results/`
- HTML Report: `playwright-report/`

## Test Coverage

The E2E test suite covers:

### Core Functionality (todo-workflow.spec.js)
- ✅ Task creation with all properties
- ✅ Task editing and updates
- ✅ Task completion toggling
- ✅ Task deletion with confirmation
- ✅ Statistics and counts accuracy
- ✅ Data persistence across sessions

### Filtering and Search (task-filtering.spec.js)
- ✅ Status filtering (completed/incomplete/all)
- ✅ Priority filtering (high/medium/low/all)
- ✅ Real-time search across titles and descriptions
- ✅ Sorting by title, priority, due date
- ✅ Combined filters
- ✅ Empty state handling

### Validation and Error Handling (task-validation.spec.js)
- ✅ Required field validation
- ✅ Length limit validation
- ✅ Date validation (no past dates)
- ✅ Duplicate title handling
- ✅ Network error handling
- ✅ Special characters support
- ✅ Confirmation dialogs

### Performance and Accessibility (performance-accessibility.spec.js)
- ✅ Large dataset handling (100+ tasks)
- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Screen reader compatibility
- ✅ Focus indicators
- ✅ Reduced motion support
- ✅ Rapid interaction handling

### Mobile and Cross-Browser (mobile-crossbrowser.spec.js)
- ✅ Responsive design across devices
- ✅ Touch gesture support
- ✅ Browser feature compatibility
- ✅ Date input fallbacks
- ✅ CSS graceful degradation
- ✅ Offline behavior

## Performance Benchmarks

The tests include performance measurements:

- **Task Creation**: < 100ms per task
- **Filtering**: < 2 seconds with 100+ tasks
- **Search**: < 1 second response time
- **Modal Operations**: < 500ms open/close

## Accessibility Standards

Tests verify WCAG 2.1 AA compliance:

- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Color contrast (visual verification)
- ✅ Screen reader announcements

## CI/CD Integration

The test suite is configured for CI environments:

```yaml
# Example GitHub Actions step
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install --with-deps
    npm run start:backend &
    npm run start:frontend &
    npx playwright test
    
- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Common Issues

1. **Servers not running**: Ensure backend (3030) and frontend (3000) are running
2. **Port conflicts**: Check no other services are using ports 3000/3030
3. **Browser installation**: Run `npx playwright install` if browsers are missing
4. **Timeout errors**: Increase timeouts in playwright.config.js if needed

### Debug Commands

```bash
# Check server status
curl http://localhost:3030/api/health
curl http://localhost:3000

# Verbose test output
npx playwright test --reporter=line

# Test specific browser
npx playwright test --project=chromium --headed --debug
```

### Environment Variables

```bash
# Skip specific browsers
SKIP_WEBKIT=true npx playwright test

# Run only mobile tests
npx playwright test --grep="Mobile"

# Increase timeouts for slow systems
TIMEOUT_MULTIPLIER=2 npx playwright test
```

## Contributing

When adding new E2E tests:

1. Follow the existing naming pattern: `feature-name.spec.js`
2. Use the Page Object Model pattern
3. Include both happy path and edge case scenarios
4. Add appropriate test data cleanup
5. Document any new test utilities
6. Ensure tests work across all browsers
7. Add accessibility checks where relevant

## Reporting Issues

If tests fail consistently:

1. Check the HTML report: `npx playwright show-report`
2. Review screenshots and videos in `test-results/`
3. Use trace viewer for detailed debugging
4. Verify servers are running correctly
5. Check browser console for JavaScript errors