# Backend Integration Tests

This directory contains comprehensive integration tests for the Todo API backend. These tests verify the full functionality of the API endpoints, database operations, validation, and error handling.

## Test Structure

### Test Files

- **`tasks-api.test.js`** - Core CRUD operations for task management
  - Task creation, retrieval, updating, and deletion
  - Field validation and data integrity
  - Error handling for invalid operations
  - Concurrent operations testing

- **`tasks-filtering.test.js`** - Advanced filtering and search functionality
  - Status filtering (completed/incomplete/all)
  - Priority filtering (high/medium/low/all)
  - Real-time search across titles and descriptions
  - Sorting by various criteria (title, priority, due date, created date)
  - Combined filters and complex queries
  - Date range filtering
  - Performance testing with large datasets

- **`tasks-validation.test.js`** - Input validation and error handling
  - Required field validation
  - Data type validation
  - Field length limits
  - Special characters and Unicode support
  - Security testing (XSS, injection attempts)
  - Edge cases and malformed input handling

- **`health-check.test.js`** - Application health and configuration
  - Health endpoint functionality
  - Server startup and middleware configuration
  - Error handling for invalid routes
  - Performance under load
  - Security headers and configuration

- **`database-integration.test.js`** - Database operations and performance
  - Schema validation and constraints
  - Index usage and query optimization
  - Transaction behavior and data integrity
  - Concurrent database operations
  - Performance testing with bulk operations
  - Error handling and resilience

## Running Tests

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **Backend dependencies** installed (`npm install`)
3. **SQLite database** (created automatically in memory)

### Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Individual Test Files

```bash
# Run specific test file
npx jest tests/integration/tasks-api.test.js

# Run tests matching a pattern
npx jest --testNamePattern="POST /api/tasks"

# Run tests for specific functionality
npx jest --testPathPattern="filtering"
```

## Test Configuration

The integration tests use:

- **Jest** as the testing framework
- **Supertest** for HTTP assertions
- **SQLite in-memory database** for isolated testing
- **Test isolation** with cleanup between tests

### Jest Configuration

The tests are configured in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
};
```

## Test Coverage

The integration tests provide comprehensive coverage:

### API Endpoints
- ✅ GET `/` - Health check
- ✅ GET `/api/tasks` - List tasks with filtering
- ✅ POST `/api/tasks` - Create new task
- ✅ GET `/api/tasks/:id` - Get specific task
- ✅ PUT `/api/tasks/:id` - Update task
- ✅ PATCH `/api/tasks/:id/toggle` - Toggle completion
- ✅ DELETE `/api/tasks/:id` - Delete task

### Functionality Areas
- ✅ **CRUD Operations** - Full lifecycle testing
- ✅ **Filtering & Search** - All filter combinations
- ✅ **Sorting** - Multiple sort criteria
- ✅ **Validation** - Input validation and constraints  
- ✅ **Error Handling** - Graceful error responses
- ✅ **Performance** - Load testing and optimization
- ✅ **Security** - Injection and XSS protection
- ✅ **Database** - Schema, indexes, and transactions

### Test Scenarios

#### Happy Path Testing
- Valid data operations
- Successful CRUD workflows
- Proper filtering and sorting
- Expected response formats

#### Edge Case Testing
- Boundary value testing
- Null and undefined handling
- Empty and whitespace-only input
- Unicode and special characters
- Large dataset operations

#### Error Path Testing
- Invalid input validation
- Missing required fields
- Non-existent resource access
- Malformed request handling
- Database constraint violations

#### Performance Testing
- Bulk operations (100+ tasks)
- Concurrent request handling
- Complex query performance
- Memory usage optimization

## Database Testing

The integration tests verify database behavior:

### Schema Validation
- Table structure and constraints
- Index creation and usage
- Default value assignment
- Foreign key relationships

### Data Integrity
- Transaction consistency
- Concurrent operation handling
- Referential integrity maintenance
- Constraint enforcement

### Performance Optimization
- Index usage verification
- Query execution time measurement
- Bulk operation efficiency
- Memory usage monitoring

## Test Data Management

### Test Isolation
Each test is isolated with:
- **BeforeEach cleanup** - Remove test data before tests
- **AfterEach cleanup** - Remove test data after tests
- **Prefixed test data** - All test data uses recognizable prefixes
- **Separate test environment** - In-memory database for testing

### Test Data Patterns
```javascript
// Test data cleanup pattern
beforeEach(() => {
  db.exec('DELETE FROM tasks WHERE title LIKE "TestPrefix%"');
});

// Test data creation pattern
const testTaskData = {
  title: 'TestPrefix Task Name',
  description: 'Test description',
  priority: 'high'
};
```

## Performance Benchmarks

The integration tests include performance verification:

- **Task Creation**: < 100ms per task
- **Bulk Operations**: < 50ms average per task (100+ tasks)
- **Filtering Queries**: < 100ms with indexes
- **Search Operations**: < 100ms with LIKE queries
- **Complex Queries**: < 50ms for multi-filter operations
- **Health Checks**: < 10ms response time
- **Concurrent Operations**: Handle 50+ simultaneous requests

## Debugging Tests

### Running Individual Tests
```bash
# Run single test file with verbose output
npx jest tests/integration/tasks-api.test.js --verbose

# Run specific test case
npx jest --testNamePattern="should create a new task with all fields"

# Run with debug output
DEBUG=* npx jest tests/integration/tasks-api.test.js
```

### Common Issues and Solutions

1. **Port Conflicts**: Tests use random ports (server.listen(0))
2. **Database Locks**: Tests use in-memory database to avoid file locks
3. **Async Cleanup**: All tests properly await async operations
4. **Memory Leaks**: Tests close server connections in afterAll hooks

### Test Output Analysis
- **Coverage Reports**: Generated in `coverage/` directory
- **Performance Logs**: Console output shows timing information
- **Error Details**: Verbose output for debugging failures

## CI/CD Integration

The integration tests are designed for CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Run Backend Integration Tests
  run: |
    cd packages/backend
    npm test:integration
  env:
    NODE_ENV: test
```

### Test Environment Variables
- `NODE_ENV=test` - Test environment mode
- `CI=true` - Continuous integration detection
- `JEST_TIMEOUT=60000` - Extended timeout for CI

## Contributing

When adding new integration tests:

1. **Follow naming convention**: `feature-name.test.js`
2. **Include cleanup**: Before/after each test
3. **Test edge cases**: Not just happy paths
4. **Add performance checks**: For new operations
5. **Document test purpose**: Clear describe blocks
6. **Verify isolation**: Tests don't depend on each other

### Test Pattern Example
```javascript
describe('New Feature Integration Tests', () => {
  beforeEach(() => {
    // Clean up test data
  });

  afterEach(() => {
    // Clean up test data
  });

  describe('Happy Path', () => {
    it('should handle valid operations', async () => {
      // Test implementation
    });
  });

  describe('Error Cases', () => {
    it('should handle invalid input', async () => {
      // Test implementation  
    });
  });

  describe('Performance', () => {
    it('should perform efficiently', async () => {
      // Performance verification
    });
  });
});
```