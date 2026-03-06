import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3030';

class TaskService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  /**
   * Get all tasks with optional filtering and sorting
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status: 'all', 'completed', 'incomplete'
   * @param {string} options.priority - Filter by priority: 'all', 'high', 'medium', 'low'
   * @param {string} options.search - Search term for title/description
   * @param {string} options.sort - Sort by: 'due_date', 'priority', 'created_at', 'title'
   * @param {string} options.order - Sort order: 'asc', 'desc'
   * @param {string} options.dueDateFrom - Filter due date from
   * @param {string} options.dueDateTo - Filter due date to
   * @returns {Promise<Object>} Response with tasks array and metadata
   */
  async getTasks(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.status && options.status !== 'all') {
        params.append('status', options.status);
      }
      if (options.priority && options.priority !== 'all') {
        params.append('priority', options.priority);
      }
      if (options.search && options.search.trim()) {
        params.append('search', options.search.trim());
      }
      if (options.sort) {
        params.append('sort', options.sort);
      }
      if (options.order) {
        params.append('order', options.order);
      }
      if (options.dueDateFrom) {
        params.append('dueDateFrom', options.dueDateFrom);
      }
      if (options.dueDateTo) {
        params.append('dueDateTo', options.dueDateTo);
      }

      const response = await this.api.get(`/api/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch tasks'
      );
    }
  }

  /**
   * Get a specific task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Task object
   */
  async getTask(id) {
    try {
      const response = await this.api.get(`/api/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch task'
      );
    }
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.title - Task title (required)
   * @param {string} taskData.description - Task description (optional)
   * @param {string} taskData.priority - Priority: 'low', 'medium', 'high'
   * @param {string} taskData.due_date - Due date in ISO format (optional)
   * @returns {Promise<Object>} Created task object
   */
  async createTask(taskData) {
    try {
      const response = await this.api.post('/api/tasks', {
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.details) {
        throw new Error(error.response.data.details.join(', '));
      }
      throw new Error(
        error.response?.data?.error || 'Failed to create task'
      );
    }
  }

  /**
   * Update an existing task
   * @param {number} id - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise<Object>} Updated task object
   */
  async updateTask(id, taskData) {
    try {
      const response = await this.api.put(`/api/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.details) {
        throw new Error(error.response.data.details.join(', '));
      }
      throw new Error(
        error.response?.data?.error || 'Failed to update task'
      );
    }
  }

  /**
   * Toggle task completion status
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Updated task object
   */
  async toggleTaskCompletion(id) {
    try {
      const response = await this.api.patch(`/api/tasks/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 'Failed to toggle task completion'
      );
    }
  }

  /**
   * Delete a task
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteTask(id) {
    try {
      const response = await this.api.delete(`/api/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 'Failed to delete task'
      );
    }
  }
}

// Export singleton instance
const taskService = new TaskService();
export default taskService;