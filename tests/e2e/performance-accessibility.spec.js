const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');
const { generateTaskData, createTestTasks, measurePerformance, handleTestError } = require('./utils/testHelpers');

test.describe('Performance and Accessibility', () => {
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

  test('should handle large number of tasks efficiently', async ({ page }) => {
    // Create 100 tasks to test performance
    const tasks = [];
    for (let i = 1; i <= 100; i++) {
      tasks.push(generateTaskData({ 
        title: `Performance Test Task ${i.toString().padStart(3, '0')}`,
        description: `Description for task ${i}`,
        priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
      }));
    }

    console.log('Creating 100 test tasks...');
    const startTime = performance.now();
    
    // Create tasks in batches to avoid overwhelming the UI
    for (let i = 0; i < tasks.length; i += 10) {
      const batch = tasks.slice(i, i + 10);
      await Promise.all(batch.map(task => todoPage.createTask(task, false))); // Don't wait for each individually
      await page.waitForTimeout(100); // Small delay between batches
    }

    const endTime = performance.now();
    const creationTime = endTime - startTime;
    
    console.log(`Task creation took ${creationTime}ms`);
    
    // Verify all tasks were created
    const taskCount = await todoPage.getTaskCount();
    expect(taskCount).toBe(100);

    // Test filtering performance with large dataset
    const filterStartTime = performance.now();
    await todoPage.filterByPriority('high');
    await page.waitForLoadState('networkidle');
    const filterEndTime = performance.now();
    
    console.log(`Filtering took ${filterEndTime - filterStartTime}ms`);
    
    // Should filter quickly (under 2 seconds)
    expect(filterEndTime - filterStartTime).toBeLessThan(2000);

    // Test search performance
    const searchStartTime = performance.now();
    await todoPage.searchTasks('050'); // Search for specific task
    await page.waitForTimeout(500); // Wait for search debounce
    const searchEndTime = performance.now();
    
    console.log(`Search took ${searchEndTime - searchStartTime}ms`);
    expect(searchEndTime - searchStartTime).toBeLessThan(1000);

    // Should find the matching task
    await expect(todoPage.getTaskByTitle('Performance Test Task 050')).toBeVisible();
  });

  test('should be fully keyboard navigable', async ({ page }) => {
    // Create a few test tasks
    const tasks = await createTestTasks(3);
    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Test tab navigation to create task button
    await page.keyboard.press('Tab');
    await expect(todoPage.createTaskBtn).toBeFocused();

    // Open create modal with Enter
    await page.keyboard.press('Enter');
    await expect(todoPage.taskDialog).toBeVisible();

    // Navigate through form fields with Tab
    await page.keyboard.press('Tab');
    await expect(todoPage.titleInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(todoPage.descriptionInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(todoPage.prioritySelect).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(todoPage.dueDateInput).toBeFocused();

    // Navigate to save button
    await page.keyboard.press('Tab');
    const saveButton = todoPage.taskDialog.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeFocused();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(todoPage.taskDialog).not.toBeVisible();

    // Test keyboard navigation in task list
    // Focus should return to create button or first task
    await page.keyboard.press('Tab');
    
    // Navigate through tasks
    const firstTask = todoPage.page.locator('.task-item').first();
    await firstTask.focus();
    await expect(firstTask).toBeFocused();

    // Test task actions via keyboard
    await page.keyboard.press('Enter'); // Should open edit modal or complete task
    
    // Verify keyboard interaction worked
    const isModalOpen = await todoPage.taskDialog.isVisible();
    const taskCompleted = await firstTask.locator('[data-completed="true"]').isVisible();
    
    expect(isModalOpen || taskCompleted).toBeTruthy();
  });

  test('should meet accessibility standards', async ({ page }) => {
    // Create test tasks with various states
    const tasks = [
      generateTaskData({ title: 'Completed Task', priority: 'high' }),
      generateTaskData({ title: 'High Priority Task', priority: 'high' }),
      generateTaskData({ title: 'Due Today Task' })
    ];

    for (const task of tasks) {
      await todoPage.createTask(task);
    }

    // Complete first task
    await todoPage.toggleTaskComplete('Completed Task');

    // Open create task modal
    await todoPage.openCreateTaskModal();

    // Check for proper ARIA labels and roles
    const modalTitle = todoPage.taskDialog.getByRole('heading');
    await expect(modalTitle).toHaveText(/create task|add task/i);

    // Check form labels
    await expect(todoPage.titleInput).toHaveAttribute('aria-label');
    await expect(todoPage.descriptionInput).toHaveAttribute('aria-label');
    await expect(todoPage.prioritySelect).toHaveAttribute('aria-label');

    // Check for proper form validation ARIA attributes
    const titleLabel = page.getByText(/title/i).first();
    await expect(titleLabel).toBeVisible();

    await todoPage.clickCancel();

    // Check task list accessibility
    const taskList = todoPage.taskList;
    await expect(taskList).toHaveAttribute('role', 'list');

    const taskItems = todoPage.page.locator('.task-item');
    const firstTask = taskItems.first();
    
    // Tasks should have proper roles and labels
    await expect(firstTask).toHaveAttribute('role', 'listitem');

    // Check color contrast and visual indicators
    const completedTask = todoPage.getTaskByTitle('Completed Task');
    const incompleteTask = todoPage.getTaskByTitle('High Priority Task');

    // Both should be visible and distinguishable
    await expect(completedTask).toBeVisible();
    await expect(incompleteTask).toBeVisible();

    // Priority indicators should be present and accessible
    const highPriorityIndicator = incompleteTask.locator('[data-priority="high"], .priority-high, .high').first();
    await expect(highPriorityIndicator).toBeVisible();
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Test live region updates for dynamic content
    const initialCount = await todoPage.getTaskCount();
    
    // Create a task and check for ARIA live updates
    const newTask = generateTaskData({ title: 'Live Region Test Task' });
    await todoPage.createTask(newTask);

    // The app should have live regions that announce changes
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]').first();
    
    if (await liveRegion.isVisible()) {
      // If live regions exist, they should provide meaningful updates
      const liveText = await liveRegion.textContent();
      expect(liveText).toBeTruthy();
    }

    // Complete a task and verify status changes are announced
    await todoPage.toggleTaskComplete(newTask.title);
    
    // Check for status indicators that screen readers can identify
    const completedTask = todoPage.getTaskByTitle(newTask.title);
    const completedIndicator = completedTask.locator('[aria-label*="completed"], [title*="completed"]').first();
    
    const hasAccessibleCompletedState = await completedIndicator.count() > 0 || 
                                       await completedTask.getAttribute('aria-label').then(label => label?.includes('completed'));
    
    expect(hasAccessibleCompletedState).toBeTruthy();
  });

  test('should provide high contrast and focus indicators', async ({ page }) => {
    // Test focus indicators on interactive elements
    await todoPage.createTaskBtn.focus();
    
    // Check if focus is visible (this would require visual testing tools for complete validation)
    await expect(todoPage.createTaskBtn).toBeFocused();
    
    // Test focus on filter controls
    const filterButtons = todoPage.page.locator('[data-testid*="filter"], .filter-button, button').all();
    
    for (const button of await filterButtons) {
      if (await button.isVisible()) {
        await button.focus();
        await expect(button).toBeFocused();
        
        // Brief pause to make focus visible in screenshots
        await page.waitForTimeout(100);
      }
    }

    // Test focus on task items
    const taskItems = todoPage.page.locator('.task-item').all();
    
    for (const item of (await taskItems).slice(0, 3)) { // Test first 3 items
      if (await item.isVisible()) {
        await item.focus();
        
        // Focus should be visible and clear
        const computedStyle = await item.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            border: style.border,
            boxShadow: style.boxShadow
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = computedStyle.outline !== 'none' || 
                                 computedStyle.outlineWidth !== '0px' ||
                                 computedStyle.boxShadow.includes('inset') ||
                                 computedStyle.border.includes('blue') ||
                                 computedStyle.border.includes('focus');
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    }
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Create and interact with tasks
    const task = generateTaskData({ title: 'Reduced Motion Test' });
    await todoPage.createTask(task);

    // Test modal animations respect reduced motion
    await todoPage.openCreateTaskModal();
    await expect(todoPage.taskDialog).toBeVisible();
    
    await todoPage.clickCancel();
    await expect(todoPage.taskDialog).not.toBeVisible();

    // Test task interactions
    await todoPage.toggleTaskComplete(task.title);
    
    // All interactions should still work smoothly without heavy animations
    const completedTask = todoPage.getTaskByTitle(task.title);
    await expect(completedTask).toBeVisible();
    
    // Reset motion preference
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('should maintain performance with rapid user interactions', async ({ page }) => {
    // Create several tasks quickly
    const tasks = await createTestTasks(10);
    
    console.log('Testing rapid task creation...');
    const startTime = performance.now();
    
    // Rapid task creation
    for (const task of tasks) {
      await todoPage.createTask(task, false); // Don't wait between each
      await page.waitForTimeout(50); // Very short delay
    }
    
    const creationEndTime = performance.now();
    console.log(`Rapid creation took ${creationEndTime - startTime}ms`);

    // Verify all tasks were created
    expect(await todoPage.getTaskCount()).toBe(10);

    // Test rapid filtering changes
    const filterStartTime = performance.now();
    
    await todoPage.filterByPriority('high');
    await page.waitForTimeout(100);
    
    await todoPage.filterByPriority('medium');
    await page.waitForTimeout(100);
    
    await todoPage.filterByPriority('low');
    await page.waitForTimeout(100);
    
    await todoPage.filterByPriority('all');
    await page.waitForTimeout(200);
    
    const filterEndTime = performance.now();
    console.log(`Rapid filtering took ${filterEndTime - filterStartTime}ms`);
    
    // Should handle rapid changes without breaking
    expect(await todoPage.getTaskCount()).toBe(10);
    expect(filterEndTime - filterStartTime).toBeLessThan(3000);

    // Test rapid search input
    const searchInput = todoPage.searchInput;
    await searchInput.focus();
    
    const searchStartTime = performance.now();
    await searchInput.type('test', { delay: 10 }); // Very fast typing
    await page.waitForTimeout(300); // Wait for debounce
    
    await searchInput.clear();
    await page.waitForTimeout(200);
    
    const searchEndTime = performance.now();
    console.log(`Rapid search took ${searchEndTime - searchStartTime}ms`);
    
    // Should return to showing all tasks
    expect(await todoPage.getTaskCount()).toBe(10);
  });
});