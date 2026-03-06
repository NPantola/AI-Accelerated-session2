/**
 * Utilities and helpers for E2E tests
 */

// Test data generators
const generateTaskData = (overrides = {}) => ({
  title: `Test Task ${Date.now()}`,
  description: 'This is a test task created during E2E testing',
  priority: 'medium',
  dueDate: null,
  ...overrides
});

const generateMultipleTasks = (count = 3) => {
  return Array.from({ length: count }, (_, index) => 
    generateTaskData({
      title: `Test Task ${index + 1} - ${Date.now()}`,
      priority: ['low', 'medium', 'high'][index % 3],
      description: `Task ${index + 1} description for testing`
    })
  );
};

// Common test data sets
const testTasks = {
  basic: {
    title: 'Basic Test Task',
    description: 'Simple task for basic testing',
    priority: 'medium'
  },
  urgent: {
    title: 'Urgent Task',
    description: 'High priority task with due date',
    priority: 'high',
    dueDate: 'today'
  },
  lowPriority: {
    title: 'Low Priority Task',
    description: 'Task that can wait',
    priority: 'low',
    dueDate: 'nextWeek'
  },
  noDescription: {
    title: 'Task Without Description',
    priority: 'medium'
  },
  futureDue: {
    title: 'Future Due Task',
    description: 'Task due in the future',
    priority: 'high',
    dueDate: 'tomorrow'
  }
};

// Setup helpers
const setupCleanDatabase = async (page) => {
  // This would typically reset the database to a known state
  // For in-memory database, we might need to restart the server or call a reset endpoint
  console.log('Setting up clean database state...');
};

const createTestTasks = async (todoPage, tasks) => {
  const createdTasks = [];
  for (const taskData of tasks) {
    await todoPage.createTask(taskData);
    createdTasks.push(taskData);
  }
  return createdTasks;
};

// Verification helpers
const verifyTaskOrder = async (todoPage, expectedOrder) => {
  const actualTasks = await todoPage.getVisibleTaskTitles();
  return actualTasks.every((title, index) => 
    index >= expectedOrder.length || title.includes(expectedOrder[index])
  );
};

const verifyTaskCount = async (todoPage, expected) => {
  const actual = await todoPage.getTaskCount();
  return actual === expected;
};

const verifyTaskStatistics = async (todoPage, expected) => {
  const actual = await todoPage.getTaskStatistics();
  return (
    actual.total === expected.total &&
    actual.completed === expected.completed &&
    actual.incomplete === expected.incomplete
  );
};

// Wait helpers
const waitForTaskToAppear = async (todoPage, title, timeout = 5000) => {
  return await todoPage.page.waitForFunction(
    async (titleToFind) => {
      const titles = Array.from(document.querySelectorAll('.task-title')).map(el => el.textContent);
      return titles.some(title => title.includes(titleToFind));
    },
    title,
    { timeout }
  );
};

const waitForTaskToDisappear = async (todoPage, title, timeout = 5000) => {
  return await todoPage.page.waitForFunction(
    async (titleToFind) => {
      const titles = Array.from(document.querySelectorAll('.task-title')).map(el => el.textContent);
      return !titles.some(title => title.includes(titleToFind));
    },
    title,
    { timeout }
  );
};

const waitForTaskCount = async (todoPage, expectedCount, timeout = 5000) => {
  return await todoPage.page.waitForFunction(
    async (count) => {
      const taskItems = document.querySelectorAll('.task-item');
      return taskItems.length === count;
    },
    expectedCount,
    { timeout }
  );
};

// Network helpers
const interceptApiCalls = async (page) => {
  const apiCalls = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        timestamp: Date.now()
      });
    }
  });
  
  return apiCalls;
};

const mockApiFailure = async (page, endpoint, status = 500) => {
  await page.route(`**/api/${endpoint}*`, route => {
    route.fulfill({
      status: status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Mocked API failure for testing' })
    });
  });
};

// Screenshot helpers
const takeScreenshot = async (page, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `tests/e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
};

const takeElementScreenshot = async (page, selector, name) => {
  const element = page.locator(selector);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await element.screenshot({
    path: `tests/e2e/screenshots/${name}-${timestamp}.png`
  });
};

// Performance helpers
const measurePageLoadTime = async (page) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();
  return endTime - startTime;
};

const measureApiResponseTime = async (page, apiCall) => {
  const startTime = Date.now();
  const response = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return response.json();
  }, apiCall);
  const endTime = Date.now();
  return { response, duration: endTime - startTime };
};

// Browser storage helpers
const clearBrowserStorage = async (page) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const setLocalStorageItem = async (page, key, value) => {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key, value }
  );
};

const getLocalStorageItem = async (page, key) => {
  return await page.evaluate(key => localStorage.getItem(key), key);
};

// Accessibility helpers
const checkAccessibility = async (page) => {
  // Basic accessibility checks
  const violations = await page.evaluate(() => {
    const issues = [];
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`Found ${images.length} images without alt text`);
    }
    
    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
    if (inputs.length > 0) {
      issues.push(`Found ${inputs.length} inputs without labels`);
    }
    
    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
    
    return issues;
  });
  
  return violations;
};

// Error handling helpers
const handleTestError = async (page, error, testName) => {
  console.error(`Error in test "${testName}":`, error.message);
  await takeScreenshot(page, `error-${testName}`);
  
  // Log current page state
  const url = page.url();
  const title = await page.title();
  console.log(`Page URL: ${url}`);
  console.log(`Page Title: ${title}`);
  
  // Log any console errors
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  if (consoleMessages.length > 0) {
    console.log('Console messages:', consoleMessages);
  }
};

module.exports = {
  generateTaskData,
  generateMultipleTasks,
  testTasks,
  setupCleanDatabase,
  createTestTasks,
  verifyTaskOrder,
  verifyTaskCount,
  verifyTaskStatistics,
  waitForTaskToAppear,
  waitForTaskToDisappear,
  waitForTaskCount,
  interceptApiCalls,
  mockApiFailure,
  takeScreenshot,
  takeElementScreenshot,
  measurePageLoadTime,
  measureApiResponseTime,
  clearBrowserStorage,
  setLocalStorageItem,
  getLocalStorageItem,
  checkAccessibility,
  handleTestError
};