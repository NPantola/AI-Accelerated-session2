import { useState, useEffect, useCallback } from 'react';
import TaskService from '../services/TaskService';
import { filterTasks, sortTasks, SORT_OPTIONS, SORT_ORDERS } from '../utils/taskUtils';

/**
 * Custom hook for managing tasks with filtering, sorting, and CRUD operations
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Task management state and functions
 */
export const useTasks = (initialFilters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    sort: SORT_OPTIONS.CREATED,
    order: SORT_ORDERS.DESC,
    ...initialFilters
  });

  // Fetch tasks from API
  const fetchTasks = useCallback(async (queryFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await TaskService.getTasks(queryFilters);
      setTasks(response.tasks || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create a new task
  const createTask = useCallback(async (taskData) => {
    try {
      setError(null);
      const newTask = await TaskService.createTask(taskData);
      setTasks(prevTasks => [newTask, ...prevTasks]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update an existing task
  const updateTask = useCallback(async (id, taskData) => {
    try {
      setError(null);
      const updatedTask = await TaskService.updateTask(id, taskData);
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Toggle task completion
  const toggleTaskCompletion = useCallback(async (id) => {
    try {
      setError(null);
      const updatedTask = await TaskService.toggleTaskCompletion(id);
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id) => {
    try {
      setError(null);
      await TaskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchTasks(updatedFilters);
  }, [filters, fetchTasks]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Get filtered and sorted tasks for display
  const displayTasks = useCallback(() => {
    const filtered = filterTasks(tasks, filters);
    return sortTasks(filtered, filters.sort, filters.order);
  }, [tasks, filters]);

  return {
    // Data
    tasks: displayTasks(),
    allTasks: tasks,
    loading,
    error,
    filters,
    
    // Actions
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    updateFilters,
    refreshTasks,
    clearError,
    
    // Utilities
    taskCount: tasks.length,
    hasError: !!error,
    isLoading: loading
  };
};

export default useTasks;