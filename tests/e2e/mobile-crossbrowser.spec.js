const { test, expect, devices } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');
const { generateTaskData, createTestTasks, handleTestError } = require('./utils/testHelpers');

// Test on different devices and viewports
const testDevices = [
  devices['iPhone 12'],
  devices['iPad'],
  devices['Desktop Chrome'],
  devices['Desktop Firefox'],
  devices['Desktop Safari']
];

test.describe('Mobile Responsiveness and Cross-Browser Compatibility', () => {
  testDevices.forEach(device => {
    test.describe(`${device.name || 'Custom Device'}`, () => {
      let todoPage;

      test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        todoPage = new TodoPage(page);
        await todoPage.goto();
      });

      test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status === 'failed') {
          await handleTestError(page, new Error('Test failed'), testInfo.title);
        }
        await page.context().close();
      });

      test('should display and function correctly', async () => {
        // Basic functionality test for each device
        const task = generateTaskData({ title: `${device.name || 'Device'} Test Task` });
        
        // Create task should work on all devices
        await todoPage.createTask(task);
        await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();

        // Task interaction should work
        await todoPage.toggleTaskComplete(task.title);
        
        // Filtering should work
        await todoPage.filterByStatus('completed');
        await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();
      });

      test('should have responsive layout', async ({ page }) => {
        const viewport = page.viewportSize();
        
        // Create several tasks to test layout
        const tasks = await createTestTasks(5);
        for (const task of tasks) {
          await todoPage.createTask(task);
        }

        // Check if layout adapts to viewport
        if (viewport && viewport.width < 768) {
          // Mobile layout tests
          await test.step('Mobile layout should stack elements vertically', async () => {
            // On mobile, elements should be stacked
            const createButton = todoPage.createTaskBtn;
            const taskList = todoPage.taskList;
            
            await expect(createButton).toBeVisible();
            await expect(taskList).toBeVisible();

            // Check if create button is easily tappable (minimum 44px target size)
            const buttonBox = await createButton.boundingBox();
            expect(buttonBox.height).toBeGreaterThanOrEqual(40);
          });

          await test.step('Mobile modal should fill screen appropriately', async () => {
            await todoPage.openCreateTaskModal();
            
            const modal = todoPage.taskDialog;
            const modalBox = await modal.boundingBox();
            
            // Modal should not be too small on mobile
            expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8);
            
            await todoPage.clickCancel();
          });

        } else if (viewport && viewport.width >= 768 && viewport.width < 1024) {
          // Tablet layout tests
          await test.step('Tablet layout should use available space efficiently', async () => {
            const taskList = todoPage.taskList;
            const listBox = await taskList.boundingBox();
            
            // Should use reasonable portion of screen width
            expect(listBox.width).toBeGreaterThan(viewport.width * 0.7);
          });

        } else {
          // Desktop layout tests
          await test.step('Desktop layout should have proper spacing and alignment', async () => {
            const container = todoPage.page.locator('.app-container, main, [role="main"]').first();
            
            if (await container.isVisible()) {
              const containerBox = await container.boundingBox();
              
              // Desktop should not use full width (better readability)
              expect(containerBox.width).toBeLessThan(viewport.width);
            }
          });
        }
      });

      test('should handle touch gestures (mobile only)', async ({ page }) => {
        const viewport = page.viewportSize();
        
        // Only run touch tests on mobile devices
        if (!viewport || viewport.width >= 768) {
          test.skip('Touch gesture test only applies to mobile devices');
          return;
        }

        const task = generateTaskData({ title: 'Touch Gesture Test' });
        await todoPage.createTask(task);

        const taskElement = todoPage.getTaskByTitle(task.title);
        
        // Test tap to complete (if implemented)
        await taskElement.tap();
        
        // On some implementations, single tap might complete task
        // On others, it might open edit modal
        const isCompleted = await taskElement.locator('[data-completed="true"]').isVisible();
        const isModalOpen = await todoPage.taskDialog.isVisible();
        
        expect(isCompleted || isModalOpen).toBeTruthy();
        
        if (isModalOpen) {
          await todoPage.clickCancel();
        }

        // Test touch interaction with buttons
        const createBtn = todoPage.createTaskBtn;
        await createBtn.tap();
        await expect(todoPage.taskDialog).toBeVisible();
        
        // Touch targets should be large enough
        const btnBox = await createBtn.boundingBox();
        expect(btnBox.height).toBeGreaterThanOrEqual(40);
        expect(btnBox.width).toBeGreaterThanOrEqual(40);
        
        await todoPage.clickCancel();
      });
    });
  });

  test.describe('Cross-Browser Feature Compatibility', () => {
    let todoPage;

    test.beforeEach(async ({ page }) => {
      todoPage = new TodoPage(page);
      await todoPage.goto();
    });

    test('should handle date input across browsers', async ({ page, browserName }) => {
      const task = generateTaskData({ title: 'Date Input Test' });
      await todoPage.openCreateTaskModal();
      
      await todoPage.titleInput.fill(task.title);
      
      // Date input behavior varies across browsers
      const dueDateInput = todoPage.dueDateInput;
      const inputType = await dueDateInput.getAttribute('type');
      
      if (inputType === 'date') {
        // Modern browsers support date input
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        
        await dueDateInput.fill(dateString);
        
        const enteredValue = await dueDateInput.inputValue();
        expect(enteredValue).toBe(dateString);
        
      } else {
        // Fallback for browsers without date input support
        console.log(`Browser ${browserName} using text input fallback for dates`);
        
        await dueDateInput.fill('2024-12-31');
        const enteredValue = await dueDateInput.inputValue();
        expect(enteredValue.length).toBeGreaterThan(0);
      }
      
      await todoPage.clickSaveTask();
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();
    });

    test('should handle modern CSS features gracefully', async ({ page, browserName }) => {
      // Create tasks to test styling
      const tasks = await createTestTasks(3);
      for (const task of tasks) {
        await todoPage.createTask(task);
      }

      // Check if modern CSS features are supported
      const taskElement = todoPage.page.locator('.task-item').first();
      
      const computedStyles = await taskElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          flexDirection: styles.flexDirection,
          borderRadius: styles.borderRadius,
          boxShadow: styles.boxShadow,
          transition: styles.transition
        };
      });

      // Modern features should either work or have graceful fallbacks
      if (browserName === 'chromium' || browserName === 'firefox') {
        // Modern browsers should support flexbox, border-radius, etc.
        expect(['flex', 'grid', 'block'].some(display => 
          computedStyles.display.includes(display)
        )).toBeTruthy();
        
      } else {
        // Older browsers should at least show basic layout
        expect(computedStyles.display).not.toBe('none');
      }

      // Task should be visible and functional regardless of CSS support
      await expect(taskElement).toBeVisible();
    });

    test('should handle JavaScript features across browsers', async ({ page, browserName }) => {
      // Test modern JavaScript features with fallbacks
      const task = generateTaskData({ title: 'JavaScript Compatibility Test' });
      
      // Test async/await functionality (used in API calls)
      await todoPage.createTask(task);
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();

      // Test array methods and modern syntax
      await todoPage.searchTasks('JavaScript');
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();

      // Clear search
      await todoPage.clearSearch();

      // Test event handling
      await todoPage.filterByPriority('medium');
      await todoPage.filterByPriority('all');
      
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();

      console.log(`All JavaScript features working in ${browserName}`);
    });

    test('should maintain functionality with slow connections', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      const task = generateTaskData({ title: 'Slow Network Test' });
      
      // App should still work with network delays
      await todoPage.createTask(task);
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible({ timeout: 10000 });

      // Clear the network throttling
      await page.unroute('**/*');
    });

    test('should handle storage availability', async ({ page }) => {
      // Test behavior when localStorage might not be available
      await page.evaluate(() => {
        // Temporarily disable localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage not available');
        };
        
        // Restore after a short delay
        setTimeout(() => {
          localStorage.setItem = originalSetItem;
        }, 1000);
      });

      // App should still function without localStorage
      const task = generateTaskData({ title: 'Storage Fallback Test' });
      await todoPage.createTask(task);
      
      // Task should be created (using server storage)
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();
    });
  });

  test.describe('Offline Capability', () => {
    let todoPage;

    test.beforeEach(async ({ page }) => {
      todoPage = new TodoPage(page);
      await todoPage.goto();
    });

    test('should show appropriate message when offline', async ({ page, context }) => {
      // Create a task while online
      const task = generateTaskData({ title: 'Offline Test Task' });
      await todoPage.createTask(task);
      await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();

      // Simulate going offline
      await context.setOffline(true);

      try {
        // Try to create another task while offline
        const offlineTask = generateTaskData({ title: 'Offline Task' });
        await todoPage.openCreateTaskModal();
        await todoPage.titleInput.fill(offlineTask.title);
        await todoPage.clickSaveTask();

        // Should either:
        // 1. Show offline message
        // 2. Queue the task for later sync
        // 3. Show error message

        // Wait a moment for any error messages to appear
        await page.waitForTimeout(2000);

        // Look for offline indicators or error messages
        const offlineMessages = [
          'offline',
          'no internet',
          'network error',
          'connection lost',
          'cannot connect'
        ];

        let foundOfflineMessage = false;
        for (const message of offlineMessages) {
          const elements = page.getByText(new RegExp(message, 'i'));
          if (await elements.count() > 0) {
            foundOfflineMessage = true;
            break;
          }
        }

        // App should handle offline state gracefully
        expect(foundOfflineMessage).toBeTruthy();

      } finally {
        // Restore online state
        await context.setOffline(false);
        
        // Give time for reconnection
        await page.waitForTimeout(1000);
        
        // Original task should still be visible
        await expect(todoPage.getTaskByTitle(task.title)).toBeVisible();
      }
    });
  });
});