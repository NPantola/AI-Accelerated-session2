/**
 * Page Object Model for the Todo Application
 * Contains all selectors and methods for interacting with the main todo interface
 */
class TodoPage {
  constructor(page) {
    this.page = page;
    
    // Header elements
    this.appTitle = page.getByText('Todo Application');
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    
    // Task overview statistics
    this.taskOverview = page.getByText('Task Overview');
    this.totalTasksChip = page.locator('[data-testid="total-tasks-chip"]');
    this.completedTasksChip = page.locator('[data-testid="completed-tasks-chip"]');
    this.incompleteTasksChip = page.locator('[data-testid="incomplete-tasks-chip"]');
    this.overdueTasksChip = page.locator('[data-testid="overdue-tasks-chip"]');
    this.dueSoonTasksChip = page.locator('[data-testid="due-soon-tasks-chip"]');
    
    // Search and filters
    this.searchInput = page.getByPlaceholder('Search tasks...');
    this.searchClearButton = page.getByRole('button', { name: /clear search/i });
    this.statusFilter = page.locator('select[name="status"]').or(page.getByLabel('Status'));
    this.priorityFilter = page.locator('select[name="priority"]').or(page.getByLabel('Priority'));
    this.sortByFilter = page.locator('select[name="sort"]').or(page.getByLabel('Sort By'));
    this.orderFilter = page.locator('select[name="order"]').or(page.getByLabel('Order'));
    
    // Task list
    this.taskList = page.locator('[data-testid="task-list"]');
    this.taskItems = page.locator('.task-item');
    this.taskCheckboxes = page.locator('input[type="checkbox"]');
    this.taskTitles = page.locator('.task-title');
    this.taskDescriptions = page.locator('.task-description');
    this.editButtons = page.getByRole('button', { name: /edit/i });
    this.deleteButtons = page.getByRole('button', { name: /delete/i });
    
    // Floating Action Button
    this.addTaskFab = page.getByRole('button', { name: /add task/i });
    
    // Task Form Modal
    this.taskFormDialog = page.getByRole('dialog');
    this.taskTitleInput = page.getByLabel('Task Title');
    this.taskDescriptionInput = page.getByLabel('Description');
    this.taskPrioritySelect = page.getByLabel('Priority');
    this.dueDateInput = page.getByLabel('Select due date and time');
    this.quickDateButtons = {
      today: page.getByRole('button', { name: 'Today' }),
      tomorrow: page.getByRole('button', { name: 'Tomorrow' }),
      nextWeek: page.getByRole('button', { name: 'Next Week' }),
      clear: page.getByRole('button', { name: 'Clear' })
    };
    this.saveTaskButton = page.getByRole('button', { name: /create task|update task/i });
    this.cancelTaskButton = page.getByRole('button', { name: /cancel/i });
    
    // Loading and error states
    this.loadingIndicator = page.getByText('Loading tasks...');
    this.errorSnackbar = page.locator('[data-testid="error-snackbar"]');
    this.emptyState = page.getByText('No tasks found');
    
    // Delete confirmation
    this.deleteConfirmDialog = page.getByRole('dialog');
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm|delete|yes/i });
    this.cancelDeleteButton = page.getByRole('button', { name: /cancel|no/i });
  }

  // Navigation methods
  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  async waitForLoad() {
    // Wait for the app to load and tasks to be fetched
    await this.appTitle.waitFor();
    await this.page.waitForLoadState('networkidle');
  }

  // Task creation methods
  async openTaskForm() {
    await this.addTaskFab.click();
    await this.taskFormDialog.waitFor();
  }

  async createTask(taskData) {
    await this.openTaskForm();
    
    // Fill in required title
    await this.taskTitleInput.fill(taskData.title);
    
    // Fill in optional fields
    if (taskData.description) {
      await this.taskDescriptionInput.fill(taskData.description);
    }
    
    if (taskData.priority) {
      await this.taskPrioritySelect.selectOption(taskData.priority);
    }
    
    if (taskData.dueDate) {
      if (taskData.dueDate === 'today') {
        await this.quickDateButtons.today.click();
      } else if (taskData.dueDate === 'tomorrow') {
        await this.quickDateButtons.tomorrow.click();
      } else if (taskData.dueDate === 'nextWeek') {
        await this.quickDateButtons.nextWeek.click();
      }
    }
    
    await this.saveTaskButton.click();
    await this.taskFormDialog.waitFor({ state: 'hidden' });
  }

  // Task interaction methods
  async getTaskByTitle(title) {
    return this.page.getByText(title).first();
  }

  async toggleTaskComplete(title) {
    const taskRow = this.page.locator('.task-item').filter({ hasText: title });
    const checkbox = taskRow.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async editTask(title, newData) {
    const taskRow = this.page.locator('.task-item').filter({ hasText: title });
    const editButton = taskRow.getByRole('button', { name: /edit/i });
    await editButton.click();
    
    await this.taskFormDialog.waitFor();
    
    if (newData.title) {
      await this.taskTitleInput.clear();
      await this.taskTitleInput.fill(newData.title);
    }
    
    if (newData.description !== undefined) {
      await this.taskDescriptionInput.clear();
      if (newData.description) {
        await this.taskDescriptionInput.fill(newData.description);
      }
    }
    
    if (newData.priority) {
      await this.taskPrioritySelect.selectOption(newData.priority);
    }
    
    await this.saveTaskButton.click();
    await this.taskFormDialog.waitFor({ state: 'hidden' });
  }

  async deleteTask(title) {
    const taskRow = this.page.locator('.task-item').filter({ hasText: title });
    const deleteButton = taskRow.getByRole('button', { name: /delete/i });
    await deleteButton.click();
  }

  // Search and filter methods
  async searchTasks(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for debounced search
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async filterByPriority(priority) {
    await this.priorityFilter.selectOption(priority);
    await this.page.waitForTimeout(500);
  }

  async sortBy(sortField, order = 'desc') {
    await this.sortByFilter.selectOption(sortField);
    await this.orderFilter.selectOption(order);
    await this.page.waitForTimeout(500);
  }

  // Verification methods
  async getTaskCount() {
    await this.taskItems.first().waitFor({ timeout: 5000 }).catch(() => {});
    return await this.taskItems.count();
  }

  async getVisibleTaskTitles() {
    const titles = await this.taskTitles.allTextContents();
    return titles.filter(title => title.trim().length > 0);
  }

  async isTaskCompleted(title) {
    const taskRow = this.page.locator('.task-item').filter({ hasText: title });
    const checkbox = taskRow.locator('input[type="checkbox"]');
    return await checkbox.isChecked();
  }

  async hasTask(title) {
    const task = await this.getTaskByTitle(title);
    return await task.isVisible();
  }

  async getTaskStatistics() {
    const stats = {};
    
    try {
      // Extract numbers from chip text content
      const totalText = await this.totalTasksChip.textContent() || 'Total: 0';
      stats.total = parseInt(totalText.match(/\d+/)?.[0] || '0');
      
      const completedText = await this.completedTasksChip.textContent() || 'Completed: 0';
      stats.completed = parseInt(completedText.match(/\d+/)?.[0] || '0');
      
      const incompleteText = await this.incompleteTasksChip.textContent() || 'Incomplete: 0';
      stats.incomplete = parseInt(incompleteText.match(/\d+/)?.[0] || '0');
    } catch (error) {
      // Fallback to count actual tasks if chips are not available
      stats.total = await this.getTaskCount();
      stats.completed = 0;
      stats.incomplete = 0;
    }
    
    return stats;
  }

  // Responsive design methods
  async getViewportSize() {
    return this.page.viewportSize();
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  // Error handling methods
  async hasError() {
    return await this.errorSnackbar.isVisible();
  }

  async getErrorMessage() {
    if (await this.hasError()) {
      return await this.errorSnackbar.textContent();
    }
    return null;
  }

  async dismissError() {
    if (await this.hasError()) {
      const closeButton = this.errorSnackbar.getByRole('button', { name: /close/i });
      await closeButton.click();
    }
  }
}

module.exports = { TodoPage };