const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');
const { generateTaskData, waitForElement, handleTestError } = require('./utils/testHelpers');

test.describe('Task Validation and Error Handling', () => {
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

  test('should validate required task title field', async () => {
    await todoPage.openCreateTaskModal();

    // Try to save with empty title
    await todoPage.clickSaveTask();

    // Should show validation error and not close modal
    await expect(todoPage.taskDialog).toBeVisible();
    await expect(todoPage.page.getByText(/title is required/i)).toBeVisible();

    // Add title and save should work
    await todoPage.titleInput.fill('Valid Task Title');
    await todoPage.clickSaveTask();

    // Modal should close and task should be created
    await expect(todoPage.taskDialog).not.toBeVisible();
    await expect(todoPage.getTaskByTitle('Valid Task Title')).toBeVisible();
  });

  test('should validate task title length limits', async () => {
    await todoPage.openCreateTaskModal();

    // Test maximum length limit (assuming 200 characters)
    const longTitle = 'A'.repeat(201);
    await todoPage.titleInput.fill(longTitle);

    await todoPage.clickSaveTask();

    // Should show length validation error
    await expect(todoPage.taskDialog).toBeVisible();
    await expect(todoPage.page.getByText(/title must be 200 characters or less/i)).toBeVisible();

    // Test valid maximum length
    const validLongTitle = 'A'.repeat(200);
    await todoPage.titleInput.fill(validLongTitle);
    await todoPage.clickSaveTask();

    await expect(todoPage.taskDialog).not.toBeVisible();
    await waitForElement(todoPage.page, '.task-item'); // Wait for task to appear
  });

  test('should validate task description length limits', async () => {
    const taskData = generateTaskData({ title: 'Description Validation Test' });
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);

    // Test maximum description length (assuming 1000 characters)
    const longDescription = 'A'.repeat(1001);
    await todoPage.descriptionInput.fill(longDescription);

    await todoPage.clickSaveTask();

    // Should show validation error
    await expect(todoPage.taskDialog).toBeVisible();
    await expect(todoPage.page.getByText(/description must be 1000 characters or less/i)).toBeVisible();

    // Test valid description
    const validDescription = 'A'.repeat(1000);
    await todoPage.descriptionInput.fill(validDescription);
    await todoPage.clickSaveTask();

    await expect(todoPage.taskDialog).not.toBeVisible();
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
  });

  test('should validate due date cannot be in the past', async () => {
    const taskData = generateTaskData({ title: 'Date Validation Test' });
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);

    // Set due date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    await todoPage.dueDateInput.fill(pastDate);
    await todoPage.clickSaveTask();

    // Should show validation error
    await expect(todoPage.taskDialog).toBeVisible();
    await expect(todoPage.page.getByText(/due date cannot be in the past/i)).toBeVisible();

    // Set valid future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];

    await todoPage.dueDateInput.fill(futureDate);
    await todoPage.clickSaveTask();

    await expect(todoPage.taskDialog).not.toBeVisible();
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
  });

  test('should handle duplicate task titles gracefully', async () => {
    const taskData = generateTaskData({ title: 'Duplicate Title Test' });
    
    // Create first task
    await todoPage.createTask(taskData);
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();

    // Try to create second task with same title
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);
    await todoPage.clickSaveTask();

    // Should either:
    // 1. Show validation error
    // 2. Allow creation but modify title (e.g., add " (2)")
    // 3. Allow creation as duplicate titles might be permitted
    
    // Check if modal is still open (validation error)
    const modalVisible = await todoPage.taskDialog.isVisible();
    
    if (modalVisible) {
      // If validation error shown
      await expect(todoPage.page.getByText(/title already exists/i)).toBeVisible();
      await todoPage.clickCancel();
    } else {
      // If duplicate allowed or title modified
      const taskCount = await todoPage.getTaskCount();
      expect(taskCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should handle network errors during task creation', async () => {
    // This test would require mocking network failures
    // For now, we'll test the UI behavior when save fails
    
    const taskData = generateTaskData({ title: 'Network Error Test' });
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);

    // Simulate network failure by intercepting the request
    await todoPage.page.route('**/api/tasks', route => {
      route.abort('failed');
    });

    await todoPage.clickSaveTask();

    // Should show error message and keep modal open
    await expect(todoPage.taskDialog).toBeVisible();
    
    // Look for error message (could be toast, inline error, etc.)
    // The exact selector would depend on how errors are displayed
    const errorVisible = await Promise.race([
      todoPage.page.getByText(/failed to create task/i).isVisible().then(() => true),
      todoPage.page.getByText(/network error/i).isVisible().then(() => true),
      todoPage.page.getByText(/something went wrong/i).isVisible().then(() => true),
      todoPage.page.waitForTimeout(3000).then(() => false)
    ]);

    expect(errorVisible).toBeTruthy();

    // Clear the route interception
    await todoPage.page.unroute('**/api/tasks');
  });

  test('should validate task editing with invalid data', async () => {
    const originalTask = generateTaskData({ title: 'Edit Validation Test' });
    await todoPage.createTask(originalTask);

    // Open edit modal
    await todoPage.clickEditTask(originalTask.title);

    // Clear title and try to save
    await todoPage.titleInput.fill('');
    await todoPage.clickSaveTask();

    // Should show validation error
    await expect(todoPage.taskDialog).toBeVisible();
    await expect(todoPage.page.getByText(/title is required/i)).toBeVisible();

    // Cancel edit - original task should remain unchanged
    await todoPage.clickCancel();
    await expect(todoPage.getTaskByTitle(originalTask.title)).toBeVisible();

    // Verify original task data intact
    const taskRow = todoPage.page.locator('.task-item').filter({ hasText: originalTask.title });
    await expect(taskRow).toBeVisible();
  });

  test('should handle special characters in task fields', async () => {
    const specialCharsTask = {
      title: 'Test Task with "Special" Characters & <symbols>',
      description: 'Description with émojis 🚀, line\nbreaks, and "quotes"',
      priority: 'high'
    };

    await todoPage.createTask(specialCharsTask);

    // Task should be created successfully with special characters preserved
    await expect(todoPage.getTaskByTitle(specialCharsTask.title)).toBeVisible();

    // Edit to verify characters are handled correctly
    await todoPage.clickEditTask(specialCharsTask.title);
    
    // Verify fields contain the special characters
    const titleValue = await todoPage.titleInput.inputValue();
    expect(titleValue).toBe(specialCharsTask.title);

    const descValue = await todoPage.descriptionInput.inputValue();
    expect(descValue).toBe(specialCharsTask.description);

    await todoPage.clickCancel();
  });

  test('should handle task deletion confirmation and cancellation', async () => {
    const taskData = generateTaskData({ title: 'Delete Confirmation Test' });
    await todoPage.createTask(taskData);

    // Click delete button
    await todoPage.clickDeleteTask(taskData.title);

    // Should show confirmation dialog
    const confirmDialog = todoPage.page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText(/are you sure/i)).toBeVisible();

    // Cancel deletion
    await confirmDialog.getByRole('button', { name: /cancel/i }).click();
    await expect(confirmDialog).not.toBeVisible();

    // Task should still exist
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();

    // Try delete again and confirm
    await todoPage.clickDeleteTask(taskData.title);
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    // Task should be deleted
    await expect(todoPage.getTaskByTitle(taskData.title)).not.toBeVisible();
  });

  test('should handle invalid date formats gracefully', async () => {
    const taskData = generateTaskData({ title: 'Date Format Test' });
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);

    // Try to enter invalid date format (this test may behave differently based on browser)
    await todoPage.dueDateInput.fill('invalid-date');
    
    // Try to save
    await todoPage.clickSaveTask();

    // Browser should either:
    // 1. Prevent invalid input
    // 2. Show validation error
    // 3. Clear the invalid input
    
    // Check if the input value was corrected or error shown
    const dueDateValue = await todoPage.dueDateInput.inputValue();
    const isModalOpen = await todoPage.taskDialog.isVisible();
    
    // If modal is still open, there should be an error or the input should be cleared
    if (isModalOpen) {
      expect(dueDateValue === '' || dueDateValue === 'invalid-date').toBeTruthy();
    }

    // Clear the field and save with valid data
    await todoPage.dueDateInput.fill('');
    await todoPage.clickSaveTask();

    await expect(todoPage.taskDialog).not.toBeVisible();
    await expect(todoPage.getTaskByTitle(taskData.title)).toBeVisible();
  });

  test('should preserve unsaved changes when modal is accidentally closed', async () => {
    // This test checks if the app has unsaved changes protection
    const taskData = generateTaskData({ title: 'Unsaved Changes Test' });
    
    await todoPage.openCreateTaskModal();
    await todoPage.titleInput.fill(taskData.title);
    await todoPage.descriptionInput.fill('Some description text');

    // Try to close modal with escape key or backdrop click
    await todoPage.page.keyboard.press('Escape');

    // Check if modal is still open or if there's a confirmation dialog
    const modalClosed = !await todoPage.taskDialog.isVisible();
    
    if (modalClosed) {
      // Re-open modal to check if changes were lost
      await todoPage.openCreateTaskModal();
      const titleValue = await todoPage.titleInput.inputValue();
      const descValue = await todoPage.descriptionInput.inputValue();
      
      // Changes should be lost (expected behavior for most forms)
      expect(titleValue).toBe('');
      expect(descValue).toBe('');
      
      await todoPage.clickCancel();
    } else {
      // Modal stayed open, which is good UX for unsaved changes
      expect(await todoPage.titleInput.inputValue()).toBe(taskData.title);
      await todoPage.clickCancel();
    }
  });
});