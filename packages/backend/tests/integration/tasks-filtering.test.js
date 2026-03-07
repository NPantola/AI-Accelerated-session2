const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks Filtering Integration', () => {
  let testTasks = [];

  beforeAll(async () => {
    // Create known test tasks for filtering
    const tasksToCreate = [
      { title: 'High Priority Task', priority: 'high', completed: false },
      { title: 'Medium Priority Task', priority: 'medium', completed: false },
      { title: 'Low Priority Task', priority: 'low', completed: true },
      { title: 'Completed High Priority', priority: 'high', completed: true },
      { title: 'Search Test Documentation', description: 'Write comprehensive docs', priority: 'medium', completed: false },
      { title: 'Code Review Task', description: 'Review pull requests', priority: 'low', completed: false },
      { title: 'Future Task', priority: 'medium', due_date: '2026-12-31 15:00:00', completed: false },
      { title: 'Past Task', priority: 'high', due_date: '2026-01-01 10:00:00', completed: true }
    ];

    for (const task of tasksToCreate) {
      const response = await request(app)
        .post('/api/tasks')
        .send(task);
      
      if (task.completed) {
        // Toggle to completed if needed
        await request(app)
          .patch(`/api/tasks/${response.body.id}/toggle`);
      }
      
      testTasks.push({ ...response.body, completed: task.completed ? 1 : 0 });
    }
  });

  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('Status Filtering', () => {
    it('should filter tasks by completion status - completed only', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed')
        .expect(200);

      expect(response.body.tasks).toHaveLength(expect.any(Number));
      expect(response.body.filters.status).toBe('completed');
      
      // All returned tasks should be completed
      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(1);
      });
    });

    it('should filter tasks by completion status - incomplete only', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete')
        .expect(200);

      expect(response.body.tasks).toHaveLength(expect.any(Number));
      expect(response.body.filters.status).toBe('incomplete');
      
      // All returned tasks should be incomplete
      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(0);
      });
    });

    it('should return all tasks when status filter is "all"', async () => {
      const allResponse = await request(app)
        .get('/api/tasks?status=all')
        .expect(200);

      const completedResponse = await request(app)
        .get('/api/tasks?status=completed')
        .expect(200);

      const incompleteResponse = await request(app)
        .get('/api/tasks?status=incomplete')  
        .expect(200);

      // Total tasks should equal completed + incomplete
      expect(allResponse.body.tasks.length).toBe(
        completedResponse.body.tasks.length + incompleteResponse.body.tasks.length
      );
    });
  });

  describe('Priority Filtering', () => {
    it('should filter tasks by high priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);

      expect(response.body.filters.priority).toBe('high');
      
      // All returned tasks should have high priority
      response.body.tasks.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    it('should filter tasks by medium priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=medium')
        .expect(200);

      expect(response.body.filters.priority).toBe('medium');
      
      // All returned tasks should have medium priority
      response.body.tasks.forEach(task => {
        expect(task.priority).toBe('medium');
      });
    });

    it('should filter tasks by low priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=low')
        .expect(200);

      expect(response.body.filters.priority).toBe('low');
      
      // All returned tasks should have low priority
      response.body.tasks.forEach(task => {
        expect(task.priority).toBe('low');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Documentation')
        .expect(200);

      expect(response.body.filters.search).toBe('Documentation');
      
      // Should find the task with "Documentation" in title
      const found = response.body.tasks.some(task => 
        task.title.includes('Documentation')
      );
      expect(found).toBe(true);
    });

    it('should search tasks by description', async () => {
      const response = await request(app)
        .get('/api/tasks?search=pull requests')
        .expect(200);

      expect(response.body.filters.search).toBe('pull requests');
      
      // Should find the task with "pull requests" in description
      const found = response.body.tasks.some(task => 
        task.description && task.description.includes('pull requests')
      );
      expect(found).toBe(true);
    });

    it('should handle case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/tasks?search=CODE')
        .expect(200);

      // Should find tasks with "code" (case insensitive)
      const found = response.body.tasks.some(task => 
        task.title.toLowerCase().includes('code') || 
        (task.description && task.description.toLowerCase().includes('code'))
      );
      expect(found).toBe(true);
    });

    it('should return empty results for non-existent search terms', async () => {
      const response = await request(app)
        .get('/api/tasks?search=nonexistentterm12345')
        .expect(200);

      expect(response.body.tasks).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should sort tasks by priority (high to low)', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=priority&order=desc')
        .expect(200);

      expect(response.body.filters.sort).toBe('priority');
      expect(response.body.filters.order).toBe('desc');
      
      const tasks = response.body.tasks;
      if (tasks.length > 1) {
        const priorities = ['high', 'medium', 'low'];
        for (let i = 0; i < tasks.length - 1; i++) {
          const currentPriorityIndex = priorities.indexOf(tasks[i].priority);
          const nextPriorityIndex = priorities.indexOf(tasks[i + 1].priority);
          expect(currentPriorityIndex).toBeLessThanOrEqual(nextPriorityIndex);
        }
      }
    });

    it('should sort tasks by title alphabetically', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=title&order=asc')
        .expect(200);

      expect(response.body.filters.sort).toBe('title');
      expect(response.body.filters.order).toBe('asc');
      
      const tasks = response.body.tasks;
      if (tasks.length > 1) {
        for (let i = 0; i < tasks.length - 1; i++) {
          expect(tasks[i].title.localeCompare(tasks[i + 1].title)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should sort tasks by due date', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=due_date&order=asc')
        .expect(200);

      const tasksWithDueDates = response.body.tasks.filter(task => task.due_date);
      if (tasksWithDueDates.length > 1) {
        for (let i = 0; i < tasksWithDueDates.length - 1; i++) {
          const current = new Date(tasksWithDueDates[i].due_date);
          const next = new Date(tasksWithDueDates[i + 1].due_date);
          expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter tasks by due date range', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateFrom=2026-06-01&dueDateTo=2026-12-31')
        .expect(200);

      const fromDate = new Date('2026-06-01');
      const toDate = new Date('2026-12-31');

      response.body.tasks.forEach(task => {
        if (task.due_date) {
          const taskDate = new Date(task.due_date);
          expect(taskDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
          expect(taskDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
        }
      });
    });

    it('should filter tasks from a specific date onwards', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateFrom=2026-06-01')
        .expect(200);

      const fromDate = new Date('2026-06-01');

      response.body.tasks.forEach(task => {
        if (task.due_date) {
          const taskDate = new Date(task.due_date);
          expect(taskDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        }
      });
    });

    it('should filter tasks up to a specific date', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateTo=2026-06-01')
        .expect(200);

      const toDate = new Date('2026-06-01');

      response.body.tasks.forEach(task => {
        if (task.due_date) {
          const taskDate = new Date(task.due_date);
          expect(taskDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
        }
      });
    });
  });

  describe('Combined Filtering', () => {
    it('should handle multiple filters simultaneously', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete&priority=high&search=Priority')
        .expect(200);

      expect(response.body.filters.status).toBe('incomplete');
      expect(response.body.filters.priority).toBe('high');
      expect(response.body.filters.search).toBe('Priority');

      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(0);
        expect(task.priority).toBe('high');
        expect(
          task.title.toLowerCase().includes('priority') ||
          (task.description && task.description.toLowerCase().includes('priority'))
        ).toBe(true);
      });
    });

    it('should combine filtering with sorting', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete&sort=priority&order=desc')
        .expect(200);

      // All tasks should be incomplete
      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(0);
      });

      // Tasks should be sorted by priority (high to low)
      const tasks = response.body.tasks;
      if (tasks.length > 1) {
        const priorities = ['high', 'medium', 'low'];
        for (let i = 0; i < tasks.length - 1; i++) {
          const currentPriorityIndex = priorities.indexOf(tasks[i].priority);
          const nextPriorityIndex = priorities.indexOf(tasks[i + 1].priority);
          expect(currentPriorityIndex).toBeLessThanOrEqual(nextPriorityIndex);
        }
      }
    });
  });

  describe('Response Structure', () => {
    it('should return consistent response structure for all filter combinations', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed&priority=medium&search=test&sort=title')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBe(response.body.tasks.length);
      
      // Verify filters object structure
      expect(response.body.filters).toHaveProperty('status');
      expect(response.body.filters).toHaveProperty('priority');
      expect(response.body.filters).toHaveProperty('search');
      expect(response.body.filters).toHaveProperty('sort');
      expect(response.body.filters).toHaveProperty('order');
    });
  });
});