# Testing Guidelines - Todo Application

## Overview
This document establishes comprehensive testing standards and practices for the todo application. All code changes must include appropriate tests to ensure reliability, maintainability, and quality.

## Testing Strategy

### Testing Pyramid
Our testing approach follows the testing pyramid principle:
- **Unit Tests**: 70% - Fast, isolated tests for individual functions and components
- **Integration Tests**: 20% - API endpoint testing with real HTTP requests
- **End-to-End Tests**: 10% - Critical user journeys through browser automation

### Test Coverage Requirements
- All new features must include appropriate tests
- Aim for 80%+ code coverage on critical business logic
- Focus on testing behavior, not implementation details
- Prioritize tests that catch real bugs over achieving 100% coverage

## Unit Testing

### Framework and Setup
- **Framework**: Jest
- **Component Testing**: Jest + React Testing Library for frontend components
- **Assertion Library**: Jest built-in matchers

### File Organization and Naming
- **Naming Convention**: `*.test.js` or `*.test.ts`
- **Backend Location**: `packages/backend/__tests__/`
- **Frontend Location**: `packages/frontend/src/__tests__/`
- **File Naming**: Match the file being tested
  - `app.js` → `app.test.js`
  - `TodoService.js` → `TodoService.test.js`
  - `TaskList.jsx` → `TaskList.test.js`

### Unit Test Principles
- **Isolation**: Test functions and components in complete isolation
- **Independence**: Each test should be independent and not rely on other tests
- **Fast Execution**: Unit tests should run quickly (< 1ms per test)
- **Clear Assertions**: One concept per test with descriptive test names

### Example Unit Test Structure
```javascript
// packages/backend/__tests__/taskService.test.js
describe('TaskService', () => {
  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('createTask', () => {
    it('should create a task with valid data', () => {
      // Test implementation
    });

    it('should throw error when title is missing', () => {
      // Test implementation
    });
  });
});
```

### Frontend Component Testing
- Use React Testing Library for component testing
- Focus on testing user interactions and component behavior
- Mock external dependencies and API calls
- Test accessibility attributes and screen reader compatibility

## Integration Testing

### Framework and Setup
- **Framework**: Jest + Supertest
- **Purpose**: Test backend API endpoints with real HTTP requests
- **Database**: Use test database or in-memory database for isolation

### File Organization and Naming
- **Naming Convention**: `*.test.js` or `*.test.ts`
- **Location**: `packages/backend/__tests__/integration/`
- **File Naming**: Based on API functionality being tested
  - `todos-api.test.js` - for TODO CRUD operations
  - `auth-api.test.js` - for authentication endpoints
  - `user-api.test.js` - for user management endpoints

### Integration Test Principles
- **Real HTTP Requests**: Use Supertest to make actual HTTP requests
- **Database Isolation**: Each test should use clean database state
- **Complete Request/Response Cycle**: Test full API behavior including middleware
- **Error Scenarios**: Test both success and error responses

### Example Integration Test Structure
```javascript
// packages/backend/__tests__/integration/todos-api.test.js
describe('Todos API', () => {
  beforeEach(async () => {
    // Clean database and setup test data
  });

  afterEach(async () => {
    // Cleanup database
  });

  describe('POST /api/todos', () => {
    it('should create a new todo with valid data', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo', dueDate: '2026-03-10' })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test todo');
    });
  });
});
```

## End-to-End Testing

### Framework and Setup
- **Framework**: Playwright (REQUIRED)
- **Browser**: Single browser only (Chrome/Chromium recommended)
- **Pattern**: Page Object Model (POM) for maintainability

### File Organization and Naming
- **Naming Convention**: `*.spec.js` or `*.spec.ts`
- **Location**: `tests/e2e/`
- **File Naming**: Based on user journey being tested
  - `todo-workflow.spec.js` - creating, editing, completing todos
  - `task-filtering.spec.js` - filtering and searching functionality
  - `due-date-management.spec.js` - due date features

### E2E Test Scope
- **Limit**: 5-8 critical user journeys maximum
- **Focus**: Happy paths and key edge cases only
- **Avoid**: Exhaustive coverage - leave detailed testing to unit/integration tests

### Critical User Journeys to Test
1. **Todo Creation Workflow**: Create, edit, delete tasks
2. **Task Completion**: Mark tasks complete/incomplete
3. **Due Date Management**: Add, edit, remove due dates
4. **Task Filtering**: Filter by status, priority, due date
5. **Search Functionality**: Search tasks by title/description
6. **Responsive Behavior**: Mobile vs desktop layouts
7. **Error Handling**: Network errors, validation errors
8. **Data Persistence**: Refresh browser, data integrity

### Page Object Model Pattern
```javascript
// tests/e2e/pages/TodoPage.js
class TodoPage {
  constructor(page) {
    this.page = page;
    this.addTaskButton = page.locator('[data-testid="add-task-btn"]');
    this.taskInput = page.locator('[data-testid="task-input"]');
    this.taskList = page.locator('[data-testid="task-list"]');
  }

  async addTask(title) {
    await this.addTaskButton.click();
    await this.taskInput.fill(title);
    await this.taskInput.press('Enter');
  }

  async getTaskCount() {
    return await this.taskList.locator('.task-item').count();
  }
}
```

### Example E2E Test Structure
```javascript
// tests/e2e/todo-workflow.spec.js
describe('Todo Workflow', () => {
  let todoPage;

  beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await page.goto('/');
    // Setup clean state for each test
  });

  afterEach(async ({ page }) => {
    // Cleanup after each test
  });

  test('should create and complete a todo', async ({ page }) => {
    await todoPage.addTask('Test task');
    await expect(todoPage.getTaskCount()).toBe(1);
    
    await todoPage.completeTask('Test task');
    await expect(todoPage.getCompletedTaskCount()).toBe(1);
  });
});
```

## Port Configuration

### Backend Port Configuration
```javascript
// packages/backend/src/index.js
const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Frontend Port Configuration
- React's default port is 3000
- Can be overridden with `PORT` environment variable
- In development: `PORT=3001 npm start`

### Benefits for CI/CD
- Environment variables allow dynamic port detection
- Prevents port conflicts in CI/CD pipelines
- Enables parallel test execution
- Supports containerized deployments

## Test Configuration Files

### Jest Configuration (Backend)
```javascript
// packages/backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
```

### Jest Configuration (Frontend)
```javascript
// packages/frontend/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  }
};
```

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  use: {
    browserName: 'chromium', // Single browser only
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
};
```

## Test Data Management

### Test Independence
- Each test must set up its own data
- No dependencies between tests
- Tests should pass when run individually or as a suite
- Use database transactions or cleanup methods

### Setup and Teardown Hooks
- **beforeEach**: Set up clean state for each test
- **afterEach**: Clean up after each test
- **beforeAll**: One-time setup (database connections, etc.)
- **afterAll**: One-time cleanup (close connections, etc.)

### Test Data Factories
```javascript
// __tests__/factories/taskFactory.js
const createTask = (overrides = {}) => ({
  title: 'Default task',
  description: 'Default description',
  completed: false,
  priority: 'medium',
  createdAt: new Date(),
  ...overrides
});

module.exports = { createTask };
```

## Best Practices

### Test Naming
- Use descriptive test names that explain the behavior
- Format: "should [expected behavior] when [condition]"
- Example: "should return 404 when todo does not exist"

### Assertions
- Use specific assertions over generic ones
- Prefer `toBe()` for primitives, `toEqual()` for objects
- Include descriptive error messages when helpful
- Test both positive and negative cases

### Mocking Guidelines
- Mock external dependencies (APIs, databases, file systems)
- Don't mock the system under test
- Use real implementations when practical for integration tests
- Keep mocks simple and focused

### Performance
- Unit tests should run in under 1ms each
- Integration tests should complete within 100ms each
- E2E tests should complete within 30 seconds each
- Run tests in parallel when possible

### Maintenance
- Keep tests simple and readable
- Avoid complex test logic
- Refactor tests when production code changes
- Remove obsolete tests promptly
- Use shared utilities for common test operations

## Continuous Integration

### Test Execution Order
1. **Lint and Format**: Code style checks
2. **Unit Tests**: Fast feedback on individual components
3. **Integration Tests**: API and service layer testing
4. **E2E Tests**: Full user journey validation

### Failure Handling
- Fail fast: Stop pipeline on first test failure type
- Provide clear error messages and logs
- Include screenshots for E2E test failures
- Retry flaky tests with max 2 retries

### Coverage Reporting
- Generate coverage reports for unit and integration tests
- Set minimum coverage thresholds (80% for critical paths)
- Exclude test files from coverage calculations
- Display coverage trends over time