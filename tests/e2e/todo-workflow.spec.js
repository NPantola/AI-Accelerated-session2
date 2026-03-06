const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');
const { generateTaskData, testTasks, createTestTasks, waitForTaskToAppear, waitForTaskToDisappear, handleTestError } = require('./utils/testHelpers');

test.describe('Todo Workflow', () => {
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

  test('should create a new task with all properties', async () => {
    const taskData = {
      title: 'Comprehensive Test Task',
      description: 'This task tests all form fields',
      priority: 'high',
      dueDate: 'today'
    };

    await todoPage.createTask(taskData);

    // Verify task appears in the list
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
    
    // Verify task shows correct priority
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: taskData.title });
    await expect(taskRow.getByText('High')).toBeVisible();
    
    // Verify task is initially incomplete
    expect(await todoPage.isTaskCompleted(taskData.title)).toBe(false);
    
    // Verify statistics updated
    const stats = await todoPage.getTaskStatistics();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.incomplete).toBeGreaterThan(0);
  });

  test('should create a minimal task with only title', async () => {
    const taskData = {
      title: 'Minimal Task Test'
    };

    await todoPage.createTask(taskData);

    // Verify task appears in the list
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
    
    // Verify default priority is applied
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: taskData.title });
    await expect(taskRow.getByText('Medium')).toBeVisible();
  });

  test('should edit an existing task', async () => {
    // First create a task
    const originalTask = generateTaskData({ title: 'Original Task Name' });
    await todoPage.createTask(originalTask);

    // Edit the task
    const updatedData = {
      title: 'Updated Task Name',
      description: 'Updated description after editing',
      priority: 'low'
    };

    await todoPage.editTask(originalTask.title, updatedData);

    // Verify the old title is gone
    await expect(todoPage.getTaskByTitle(originalTask.title)).not.toBeVisible();
    
    // Verify the new title is present
    await expect(todoPage.getTaskByTitle(updatedData.title)).toBeVisible();
    
    // Verify updated priority
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: updatedData.title });
    await expect(taskRow.getByText('Low')).toBeVisible();
  });

  test('should toggle task completion status', async () => {
    const taskData = generateTaskData({ title: 'Task to Complete' });
    await todoPage.createTask(taskData);

    // Initially should be incomplete
    expect(await todoPage.isTaskCompleted(taskData.title)).toBe(false);

    // Toggle to complete
    await todoPage.toggleTaskComplete(taskData.title);

    // Verify task is now completed
    expect(await todoPage.isTaskCompleted(taskData.title)).toBe(true);
    
    // Verify statistics updated
    const statsAfterComplete = await todoPage.getTaskStatistics();
    expect(statsAfterComplete.completed).toBeGreaterThan(0);

    // Toggle back to incomplete
    await todoPage.toggleTaskComplete(taskData.title);

    // Verify task is incomplete again
    expect(await todoPage.isTaskCompleted(taskData.title)).toBe(false);
  });

  test('should delete a task with confirmation', async () => {
    const taskData = generateTaskData({ title: 'Task to Delete' });
    await todoPage.createTask(taskData);

    // Verify task exists
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();

    // Delete the task (assuming browser confirm dialog)
    todoPage.page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });

    await todoPage.deleteTask(taskData.title);

    // Wait for task to be removed
    await waitForTaskToDisappear(todoPage, taskData.title);

    // Verify task no longer exists
    await expect(todoPage.getTaskByTitle(taskData.title)).not.toBeVisible();
  });

  test('should handle multiple tasks in workflow', async () => {
    const tasks = [
      generateTaskData({ title: 'First Task', priority: 'high' }),
      generateTaskData({ title: 'Second Task', priority: 'medium' }),
      generateTaskData({ title: 'Third Task', priority: 'low' })
    ];

    // Create multiple tasks
    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Verify all tasks are present
    for (const task of tasks) {
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();
    }

    // Complete one task
    await todoPage.toggleTaskComplete(tasks[0].title);
    expect(await todoPage.isTaskCompleted(tasks[0].title)).toBe(true);

    // Edit another task
    await todoPage.editTask(tasks[1].title, { title: 'Modified Second Task' });
    await expect(todoPage.getTaskByTitle('Modified Second Task')).toBeVisible();

    // Delete the third task
    todoPage.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await todoPage.deleteTask(tasks[2].title);
    await waitForTaskToDisappear(todoPage, tasks[2].title);

    // Verify final state
    expect(await todoPage.isTaskCompleted(tasks[0].title)).toBe(true);
    await expect(todoPage.getTaskByTitle('Modified Second Task')).toBeVisible();
    await expect(todoPage.getTaskByTitle(tasks[2].title)).not.toBeVisible();
  });

  test('should validate required fields in task form', async () => {
    await todoPage.openTaskForm();

    // Try to save without title
    await todoPage.saveTaskButton.click();

    // Form should still be open (validation preventing submission)
    await expect(todoPage.taskFormDialog).toBeVisible();
    
    // Title field should be marked as invalid
    await expect(todoPage.taskTitleInput).toHaveAttribute('required');

    // Add title and save should work
    await todoPage.taskTitleInput.fill('Valid Task Title');
    await todoPage.saveTaskButton.click();
    
    // Form should close
    await expect(todoPage.taskFormDialog).not.toBeVisible();
    
    // Task should be created
    await expect(todoPage.getTaskByTitle('Valid Task Title')).toBeVisible();
  });

  test('should handle form cancellation', async () => {
    await todoPage.openTaskForm();
    
    // Fill some data
    await todoPage.taskTitleInput.fill('Task to Cancel');
    await todoPage.taskDescriptionInput.fill('This should be discarded');
    
    // Cancel the form
    await todoPage.cancelTaskButton.click();
    
    // Form should close
    await expect(todoPage.taskFormDialog).not.toBeVisible();
    
    // Task should not be created
    await expect(todoPage.getTaskByTitle('Task to Cancel')).not.toBeVisible();
  });

  test('should display task with due date correctly', async () => {
    const taskData = {
      title: 'Task with Due Date',
      description: 'This task has a due date',
      priority: 'medium',
      dueDate: 'tomorrow'
    };

    await todoPage.createTask(taskData);

    // Verify task is created
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
    
    // Verify due date chip is displayed
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: taskData.title });
    await expect(taskRow.locator('.MuiChip-root')).toBeVisible();
  });

  test('should update task statistics after operations', async () => {
    // Get initial stats
    const initialStats = await todoPage.getTaskStatistics();
    
    // Create two tasks
    await todoPage.createTask(generateTaskData({ title: 'Stats Test Task 1' }));
    await todoPage.createTask(generateTaskData({ title: 'Stats Test Task 2' }));
    
    // Verify total increased
    const afterCreateStats = await todoPage.getTaskStatistics();
    expect(afterCreateStats.total).toBe(initialStats.total + 2);
    expect(afterCreateStats.incomplete).toBe(initialStats.incomplete + 2);
    
    // Complete one task
    await todoPage.toggleTaskComplete('Stats Test Task 1');
    
    // Verify completion stats
    const afterCompleteStats = await todoPage.getTaskStatistics();
    expect(afterCompleteStats.completed).toBe(initialStats.completed + 1);
    expect(afterCompleteStats.incomplete).toBe(initialStats.incomplete + 1);
    
    // Delete one task
    todoPage.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await todoPage.deleteTask('Stats Test Task 2');
    await waitForTaskToDisappear(todoPage, 'Stats Test Task 2');
    
    // Verify final stats
    const finalStats = await todoPage.getTaskStatistics();
    expect(finalStats.total).toBe(initialStats.total + 1);
    expect(finalStats.completed).toBe(initialStats.completed + 1);
    expect(finalStats.incomplete).toBe(initialStats.incomplete);
  });
});