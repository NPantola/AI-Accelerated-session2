const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');
const { generateTaskData, createTestTasks, verifyTaskOrder, waitForTaskCount, handleTestError } = require('./utils/testHelpers');

test.describe('Task Filtering and Search', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await handleTestError(page, new Error('Test failed'), testInfo.title);
    }
  });

  test('should filter tasks by completion status', async () => {
    // Create test tasks with different completion states
    const tasks = [
      generateTaskData({ title: 'Completed Task 1' }),
      generateTaskData({ title: 'Completed Task 2' }),
      generateTaskData({ title: 'Incomplete Task 1' }),
      generateTaskData({ title: 'Incomplete Task 2' })
    ];

    // Create all tasks
    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Complete first two tasks
    await todoPage.toggleTaskComplete('Completed Task 1');
    await todoPage.toggleTaskComplete('Completed Task 2');

    // Test "All" filter (default)
    await todoPage.filterByStatus('all');
    expect(await todoPage.getTaskCount()).toBe(4);

    // Test "Completed" filter
    await todoPage.filterByStatus('completed');
    await waitForTaskCount(todoPage, 2);
    
    const completedTitles = await todoPage.getVisibleTaskTitles();
    expect(completedTitles).toEqual(
      expect.arrayContaining(['Completed Task 1', 'Completed Task 2'])
    );

    // Test "Incomplete" filter
    await todoPage.filterByStatus('incomplete');
    await waitForTaskCount(todoPage, 2);
    
    const incompleteTitles = await todoPage.getVisibleTaskTitles();
    expect(incompleteTitles).toEqual(
      expect.arrayContaining(['Incomplete Task 1', 'Incomplete Task 2'])
    );

    // Return to "All" to verify all tasks are still there
    await todoPage.filterByStatus('all');
    expect(await todoPage.getTaskCount()).toBe(4);
  });

  test('should filter tasks by priority level', async () => {
    // Create tasks with different priorities
    const tasks = [
      generateTaskData({ title: 'High Priority Task 1', priority: 'high' }),
      generateTaskData({ title: 'High Priority Task 2', priority: 'high' }),
      generateTaskData({ title: 'Medium Priority Task', priority: 'medium' }),
      generateTaskData({ title: 'Low Priority Task', priority: 'low' })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Test "All" priorities (default)
    await todoPage.filterByPriority('all');
    expect(await todoPage.getTaskCount()).toBe(4);

    // Test "High" priority filter
    await todoPage.filterByPriority('high');
    await waitForTaskCount(todoPage, 2);
    
    const highPriorityTitles = await todoPage.getVisibleTaskTitles();
    expect(highPriorityTitles).toEqual(
      expect.arrayContaining(['High Priority Task 1', 'High Priority Task 2'])
    );

    // Test "Medium" priority filter
    await todoPage.filterByPriority('medium');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('Medium Priority Task')).toBeVisible();

    // Test "Low" priority filter
    await todoPage.filterByPriority('low');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('Low Priority Task')).toBeVisible();
  });

  test('should perform real-time search across task titles', async () => {
    // Create tasks with searchable content
    const tasks = [
      generateTaskData({ title: 'Project Documentation Update' }),
      generateTaskData({ title: 'Code Review Meeting' }),
      generateTaskData({ title: 'Database Migration Project' }),
      generateTaskData({ title: 'User Interface Design' })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Search for "Project" - should match 2 tasks
    await todoPage.searchTasks('Project');
    await waitForTaskCount(todoPage, 2);
    
    const projectTitles = await todoPage.getVisibleTaskTitles();
    expect(projectTitles).toEqual(
      expect.arrayContaining(['Project Documentation Update', 'Database Migration Project'])
    );

    // Search for "Meeting" - should match 1 task
    await todoPage.searchTasks('Meeting');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('Code Review Meeting')).toBeVisible();

    // Clear search - should show all tasks
    await todoPage.clearSearch();
    expect(await todoPage.getTaskCount()).toBe(4);

    // Case-insensitive search
    await todoPage.searchTasks('database');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('Database Migration Project')).toBeVisible();
  });

  test('should search across task descriptions', async () => {
    // Create tasks with searchable descriptions
    const tasks = [
      generateTaskData({ 
        title: 'Backend Task',
        description: 'Implement REST API endpoints for user management'
      }),
      generateTaskData({ 
        title: 'Frontend Task',
        description: 'Create responsive user interface components'
      }),
      generateTaskData({ 
        title: 'Testing Task',
        description: 'Write comprehensive unit tests for API endpoints'
      })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Search for "API" in descriptions
    await todoPage.searchTasks('API');
    await waitForTaskCount(todoPage, 2);
    
    const apiTasks = await todoPage.getVisibleTaskTitles();
    expect(apiTasks).toEqual(
      expect.arrayContaining(['Backend Task', 'Testing Task'])
    );

    // Search for "responsive" in description
    await todoPage.searchTasks('responsive');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('Frontend Task')).toBeVisible();
  });

  test('should sort tasks by different criteria', async () => {
    // Create tasks with different attributes for sorting
    const taskData = [
      { title: 'Alpha Task', priority: 'low', dueDate: 'today' },
      { title: 'Beta Task', priority: 'high', dueDate: 'tomorrow' },
      { title: 'Gamma Task', priority: 'medium', dueDate: 'nextWeek' },
      { title: 'Delta Task', priority: 'high', dueDate: null }
    ];

    // Create tasks in specific order to test sorting
    for (const task of taskData) {
      await todoPage.createTask(task);
    }

    // Sort by title A-Z
    await todoPage.sortBy('title', 'asc');
    await todoPage.page.waitForTimeout(1000); // Wait for re-render
    
    const titlesAscending = await todoPage.getVisibleTaskTitles();
    const expectedAlphabetical = ['Alpha Task', 'Beta Task', 'Delta Task', 'Gamma Task'];
    expect(titlesAscending).toEqual(expectedAlphabetical);

    // Sort by title Z-A
    await todoPage.sortBy('title', 'desc');
    await todoPage.page.waitForTimeout(1000);
    
    const titlesDescending = await todoPage.getVisibleTaskTitles();
    expect(titlesDescending).toEqual(expectedAlphabetical.reverse());

    // Sort by priority (high to low)
    await todoPage.sortBy('priority', 'desc');
    await todoPage.page.waitForTimeout(1000);
    
    // High priority tasks should appear first
    const prioritySorted = await todoPage.getVisibleTaskTitles();
    expect(prioritySorted[0]).toMatch(/Beta Task|Delta Task/);
    expect(prioritySorted[prioritySorted.length - 1]).toBe('Alpha Task');
  });

  test('should combine multiple filters', async () => {
    // Create diverse set of tasks
    const tasks = [
      generateTaskData({ title: 'High Priority Complete', priority: 'high' }),
      generateTaskData({ title: 'High Priority Incomplete', priority: 'high' }),
      generateTaskData({ title: 'Medium Priority Complete', priority: 'medium' }),
      generateTaskData({ title: 'Low Priority Incomplete', priority: 'low' })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Complete specific tasks
    await todoPage.toggleTaskComplete('High Priority Complete');
    await todoPage.toggleTaskComplete('Medium Priority Complete');

    // Combine filters: High priority + Incomplete
    await todoPage.filterByPriority('high');
    await todoPage.filterByStatus('incomplete');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('High Priority Incomplete')).toBeVisible();

    // Combine filters: All priority + Completed
    await todoPage.filterByPriority('all');
    await todoPage.filterByStatus('completed');
    await waitForTaskCount(todoPage, 2);
    
    const completedTasks = await todoPage.getVisibleTaskTitles();
    expect(completedTasks).toEqual(
      expect.arrayContaining(['High Priority Complete', 'Medium Priority Complete'])
    );

    // Add search to existing filters
    await todoPage.searchTasks('High');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle('High Priority Complete')).toBeVisible();
  });

  test('should handle empty filter results gracefully', async () => {
    // Create a few tasks
    const tasks = [
      generateTaskData({ title: 'Test Task 1', priority: 'medium' }),
      generateTaskData({ title: 'Test Task 2', priority: 'low' })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Search for non-existent term
    await todoPage.searchTasks('NonExistentTerm');
    
    // Should show empty state message
    await expect(todoPage.emptyState).toBeVisible();
    expect(await todoPage.getTaskCount()).toBe(0);

    // Clear search should restore tasks
    await todoPage.clearSearch();
    expect(await todoPage.getTaskCount()).toBe(2);

    // Filter by high priority when no high priority tasks exist
    await todoPage.filterByPriority('high');
    
    await expect(todoPage.emptyState).toBeVisible();
    expect(await todoPage.getTaskCount()).toBe(0);

    // Reset filters should restore tasks
    await todoPage.filterByPriority('all');
    expect(await todoPage.getTaskCount()).toBe(2);
  });

  test('should preserve task data integrity during filtering', async () => {
    const taskData = generateTaskData({ 
      title: 'Integrity Test Task',
      description: 'This task tests data integrity',
      priority: 'high'
    });

    await todoPage.createTask(taskData);
    
    // Verify task is visible initially
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();

    // Apply filter that hides the task
    await todoPage.filterByPriority('low');
    await expect(todoPage.getTaskByTitle(taskData.title)).not.toBeVisible();

    // Remove filter - task should reappear with all data intact
    await todoPage.filterByPriority('all');
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();

    // Verify task properties are still correct
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: taskData.title });
    await expect(taskRow.getByText('High')).toBeVisible();
    await expect(taskRow.getByText(taskData.description)).toBeVisible();
  });

  test('should update filter results when tasks are modified', async () => {
    const taskData = generateTaskData({ 
      title: 'Filter Update Test',
      priority: 'medium'
    });

    await todoPage.createTask(taskData);

    // Filter to show only high priority tasks
    await todoPage.filterByPriority('high');
    expect(await todoPage.getTaskCount()).toBe(0);

    // Reset filter and edit task to high priority
    await todoPage.filterByPriority('all');
    await todoPage.editTask(taskData.title, { priority: 'high' });

    // Apply high priority filter again - task should now appear
    await todoPage.filterByPriority('high');
    await waitForTaskCount(todoPage, 1);
    
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
  });
});