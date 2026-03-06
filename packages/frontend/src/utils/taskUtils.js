import { getDueDateStatus } from './dateUtils';

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Task status
export const TASK_STATUS = {
  ALL: 'all',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete'
};

// Sort options
export const SORT_OPTIONS = {
  DUE_DATE: 'due_date',
  PRIORITY: 'priority',
  CREATED: 'created_at',
  TITLE: 'title',
  UPDATED: 'updated_at'
};

// Sort orders
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};

/**
 * Get priority display label
 * @param {string} priority - Priority level
 * @returns {string} Display label
 */
export const getPriorityLabel = (priority) => {
  const labels = {
    [PRIORITY_LEVELS.LOW]: 'Low',
    [PRIORITY_LEVELS.MEDIUM]: 'Medium',
    [PRIORITY_LEVELS.HIGH]: 'High'
  };
  return labels[priority] || 'Medium';
};

/**
 * Get priority color based on task priority
 * @param {string} priority - Priority level
 * @returns {string} Color for priority indicator
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [PRIORITY_LEVELS.LOW]: 'success',
    [PRIORITY_LEVELS.MEDIUM]: 'warning',
    [PRIORITY_LEVELS.HIGH]: 'error'
  };
  return colors[priority] || 'warning';
};

/**
 * Get task status color based on completion and due date
 * @param {Object} task - Task object
 * @returns {string} Color for task status
 */
export const getTaskStatusColor = (task) => {
  if (task.completed) {
    return 'success';
  }
  
  const dueDateStatus = getDueDateStatus(task.due_date);
  
  switch (dueDateStatus) {
    case 'overdue':
      return 'error';
    case 'due-soon':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Filter tasks based on criteria
 * @param {Array} tasks - Array of tasks
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered tasks
 */
export const filterTasks = (tasks, filters) => {
  if (!tasks || !Array.isArray(tasks)) return [];
  
  return tasks.filter(task => {
    // Status filter
    if (filters.status && filters.status !== TASK_STATUS.ALL) {
      const isCompleted = task.completed;
      if (filters.status === TASK_STATUS.COMPLETED && !isCompleted) return false;
      if (filters.status === TASK_STATUS.INCOMPLETE && isCompleted) return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const title = task.title?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';
      
      if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Sort tasks based on criteria
 * @param {Array} tasks - Array of tasks
 * @param {string} sortBy - Sort criteria
 * @param {string} order - Sort order (asc/desc)
 * @returns {Array} Sorted tasks
 */
export const sortTasks = (tasks, sortBy = SORT_OPTIONS.CREATED, order = SORT_ORDERS.DESC) => {
  if (!tasks || !Array.isArray(tasks)) return [];
  
  return [...tasks].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case SORT_OPTIONS.DUE_DATE:
        // Handle null due dates (put them at the end)
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        aValue = new Date(a.due_date);
        bValue = new Date(b.due_date);
        break;
        
      case SORT_OPTIONS.PRIORITY:
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 2;
        bValue = priorityOrder[b.priority] || 2;
        break;
        
      case SORT_OPTIONS.TITLE:
        aValue = (a.title || '').toLowerCase();
        bValue = (b.title || '').toLowerCase();
        break;
        
      case SORT_OPTIONS.CREATED:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
        
      case SORT_OPTIONS.UPDATED:
        aValue = new Date(a.updated_at || a.created_at);
        bValue = new Date(b.updated_at || b.created_at);
        break;
        
      default:
        return 0;
    }
    
    if (aValue < bValue) return order === SORT_ORDERS.ASC ? -1 : 1;
    if (aValue > bValue) return order === SORT_ORDERS.ASC ? 1 : -1;
    return 0;
  });
};

/**
 * Get task count statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Task statistics
 */
export const getTaskStats = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) {
    return {
      total: 0,
      completed: 0,
      incomplete: 0,
      overdue: 0,
      dueSoon: 0
    };
  }
  
  const stats = {
    total: tasks.length,
    completed: 0,
    incomplete: 0,
    overdue: 0,
    dueSoon: 0
  };
  
  tasks.forEach(task => {
    if (task.completed) {
      stats.completed++;
    } else {
      stats.incomplete++;
      
      const dueDateStatus = getDueDateStatus(task.due_date);
      if (dueDateStatus === 'overdue') {
        stats.overdue++;
      } else if (dueDateStatus === 'due-soon') {
        stats.dueSoon++;
      }
    }
  });
  
  return stats;
};

/**
 * Validate task data
 * @param {Object} taskData - Task data to validate
 * @returns {Array} Array of validation errors
 */
export const validateTaskData = (taskData) => {
  const errors = [];
  
  if (!taskData.title || typeof taskData.title !== 'string' || taskData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (taskData.title && taskData.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }
  
  if (taskData.description && taskData.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  if (taskData.priority && !Object.values(PRIORITY_LEVELS).includes(taskData.priority)) {
    errors.push('Priority must be low, medium, or high');
  }
  
  if (taskData.due_date) {
    const dueDate = new Date(taskData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    }
  }
  
  return errors;
};

/**
 * Create a new task object with default values
 * @param {Object} overrides - Properties to override
 * @returns {Object} Task object with defaults
 */
export const createDefaultTask = (overrides = {}) => ({
  title: '',
  description: '',
  priority: PRIORITY_LEVELS.MEDIUM,
  due_date: null,
  completed: false,
  ...overrides
});