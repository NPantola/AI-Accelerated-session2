const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks Filtering and Search Integration Tests', () => {
  let server;
  let testTasks = [];

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data
    db.exec('DELETE FROM tasks WHERE title LIKE "Filter%"');
    
    // Create diverse test data for filtering
    const tasksData = [
      {
        title: 'Filter Test High Priority Task 1',
        description: 'Important task with detailed description',
        priority: 'high',
        due_date: '2026-03-15 10:00:00'
      },
      {
        title: 'Filter Test High Priority Task 2',
        description: 'Another important task',
        priority: 'high',
        due_date: '2026-03-20 15:00:00'
      },
      {
        title: 'Filter Test Medium Priority Task',
        description: 'Moderately important task',
        priority: 'medium',
        due_date: '2026-03-10 09:00:00'
      },
      {
        title: 'Filter Test Low Priority Task',
        description: 'Task with lower importance',
        priority: 'low',
        due_date: '2026-03-25 14:00:00'
      },
      {
        title: 'Filter Test No Due Date Task',
        description: 'Task without specific deadline',
        priority: 'medium',
        due_date: null
      },
      {
        title: 'Filter Test Special Characters Task ñáéí',
        description: 'Task with special characters in content: ñáéíóú & symbols',
        priority: 'high',
        due_date: '2026-03-18 11:30:00'
      }
    ];

    testTasks = [];
    for (const taskData of tasksData) {
      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);
      testTasks.push(response.body);
    }

    // Complete some tasks for status filtering
    await request(app).patch(`/api/tasks/${testTasks[0].id}/toggle`);
    await request(app).patch(`/api/tasks/${testTasks[2].id}/toggle`);
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM tasks WHERE title LIKE "Filter%"');
  });

  describe('Status Filtering', () => {
    it('should filter completed tasks only', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed')
        .expect(200);

      expect(response.body.count).toBe(2);
      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(1);
        expect(task.title).toMatch(/^Filter Test/);
      });
    });

    it('should filter incomplete tasks only', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(4);
      
      filterTestTasks.forEach(task => {
        expect(task.completed).toBe(0);
      });
    });

    it('should return all tasks when status is "all"', async () => {
      const response = await request(app)
        .get('/api/tasks?status=all')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(6);
    });

    it('should return all tasks when no status filter is provided', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(6);
      expect(response.body.filters.status).toBe('all');
    });
  });

  describe('Priority Filtering', () => {
    it('should filter high priority tasks only', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(3);
      
      filterTestTasks.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    it('should filter medium priority tasks only', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=medium')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(2);
      
      filterTestTasks.forEach(task => {
        expect(task.priority).toBe('medium');
      });
    });

    it('should filter low priority tasks only', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=low')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(1);
      expect(filterTestTasks[0].priority).toBe('low');
    });

    it('should return all tasks when priority is "all"', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=all')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(6);
    });
  });

  describe('Search Functionality', () => {
    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=High Priority')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(2);
      
      filterTestTasks.forEach(task => {
        expect(task.title.toLowerCase()).toContain('high priority');
      });
    });

    it('should search tasks by description', async () => {
      const response = await request(app)
        .get('/api/tasks?search=detailed description')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(1);
      expect(filterTestTasks[0].description.toLowerCase()).toContain('detailed description');
    });

    it('should perform case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/tasks?search=MEDIUM PRIORITY')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(1);
      expect(filterTestTasks[0].title.toLowerCase()).toContain('medium priority');
    });

    it('should search with partial matches', async () => {
      const response = await request(app)
        .get('/api/tasks?search=important')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBeGreaterThanOrEqual(2);
      
      filterTestTasks.forEach(task => {
        const searchText = `${task.title} ${task.description || ''}`.toLowerCase();
        expect(searchText).toContain('important');
      });
    });

    it('should search with special characters', async () => {
      const response = await request(app)
        .get('/api/tasks?search=ñáéí')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(1);
      expect(filterTestTasks[0].title).toContain('ñáéí');
    });

    it('should return empty results for non-existent search terms', async () => {
      const response = await request(app)
        .get('/api/tasks?search=nonexistentword12345')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(0);
    });

    it('should handle empty search string', async () => {
      const response = await request(app)
        .get('/api/tasks?search=')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(6); // All test tasks should be returned
    });

    it('should handle search with only whitespace', async () => {
      const response = await request(app)
        .get('/api/tasks?search=   ')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(6); // All test tasks should be returned
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort tasks by title in ascending order', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=title&order=asc')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      expect(filterTestTasks.length).toBe(6);
      
      // Check if titles are sorted alphabetically
      for (let i = 1; i < filterTestTasks.length; i++) {
        expect(filterTestTasks[i].title.localeCompare(filterTestTasks[i-1].title))
          .toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort tasks by title in descending order', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=title&order=desc')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      expect(filterTestTasks.length).toBe(6);
      
      // Check if titles are sorted reverse alphabetically
      for (let i = 1; i < filterTestTasks.length; i++) {
        expect(filterTestTasks[i].title.localeCompare(filterTestTasks[i-1].title))
          .toBeLessThanOrEqual(0);
      }
    });

    it('should sort tasks by priority (high to low)', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=priority&order=desc')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      expect(filterTestTasks.length).toBe(6);
      
      // Check priority order: high (1), medium (2), low (3)
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      for (let i = 1; i < filterTestTasks.length; i++) {
        expect(priorityOrder[filterTestTasks[i].priority])
          .toBeGreaterThanOrEqual(priorityOrder[filterTestTasks[i-1].priority]);
      }
    });

    it('should sort tasks by due date', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=due_date&order=asc')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      ).filter(task => task.due_date !== null); // Filter out null due dates for comparison
      
      // Check if due dates are sorted chronologically
      for (let i = 1; i < filterTestTasks.length; i++) {
        const currentDate = new Date(filterTestTasks[i].due_date);
        const previousDate = new Date(filterTestTasks[i-1].due_date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime());
      }
    });

    it('should sort tasks by created_at by default', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.filters.sort).toBe('created_at');
      expect(response.body.filters.order).toBe('desc');
    });

    it('should handle invalid sort field gracefully', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=invalid_field&order=asc')
        .expect(200);

      // Should fallback to default sorting (created_at DESC)
      expect(response.body.filters.sort).toBe('invalid_field');
      expect(response.body.tasks).toBeDefined();
    });
  });

  describe('Combined Filters', () => {
    it('should combine status and priority filters', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete&priority=high')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      filterTestTasks.forEach(task => {
        expect(task.completed).toBe(0);
        expect(task.priority).toBe('high');
      });
    });

    it('should combine search with status filter', async () => {
      const response = await request(app)
        .get('/api/tasks?search=High Priority&status=completed')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      filterTestTasks.forEach(task => {
        expect(task.completed).toBe(1);
        expect(task.title.toLowerCase()).toContain('high priority');
      });
    });

    it('should combine search with priority filter', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Task&priority=medium')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      filterTestTasks.forEach(task => {
        expect(task.priority).toBe('medium');
        const searchText = `${task.title} ${task.description || ''}`.toLowerCase();
        expect(searchText).toContain('task');
      });
    });

    it('should combine all filters with sorting', async () => {
      const response = await request(app)
        .get('/api/tasks?status=incomplete&priority=high&search=Task&sort=title&order=asc')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      
      filterTestTasks.forEach(task => {
        expect(task.completed).toBe(0);
        expect(task.priority).toBe('high');
        const searchText = `${task.title} ${task.description || ''}`.toLowerCase();
        expect(searchText).toContain('task');
      });

      // Check sorting
      for (let i = 1; i < filterTestTasks.length; i++) {
        expect(filterTestTasks[i].title.localeCompare(filterTestTasks[i-1].title))
          .toBeGreaterThanOrEqual(0);
      }
    });

    it('should return empty results when filters have no matches', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed&priority=low&search=High Priority')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test')
      );
      expect(filterTestTasks.length).toBe(0);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter tasks by due date from', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateFrom=2026-03-15')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test') && task.due_date !== null
      );
      
      filterTestTasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const fromDate = new Date('2026-03-15');
        expect(dueDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      });
    });

    it('should filter tasks by due date to', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateTo=2026-03-17')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test') && task.due_date !== null
      );
      
      filterTestTasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const toDate = new Date('2026-03-17');
        expect(dueDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
      });
    });

    it('should filter tasks by due date range', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateFrom=2026-03-10&dueDateTo=2026-03-20')
        .expect(200);

      const filterTestTasks = response.body.tasks.filter(task => 
        task.title.startsWith('Filter Test') && task.due_date !== null
      );
      
      filterTestTasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const fromDate = new Date('2026-03-10');
        const toDate = new Date('2026-03-20');
        expect(dueDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(dueDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
      });
    });

    it('should handle invalid date range gracefully', async () => {
      const response = await request(app)
        .get('/api/tasks?dueDateFrom=invalid-date&dueDateTo=2026-03-20')
        .expect(200);

      // Should not crash and return some results
      expect(response.body.tasks).toBeDefined();
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple query parameters in URL encoding', async () => {
      const searchTerm = 'special characters & symbols';
      const encodedSearch = encodeURIComponent(searchTerm);
      
      const response = await request(app)
        .get(`/api/tasks?search=${encodedSearch}&priority=high`)
        .expect(200);

      expect(response.body.filters.search).toBe(searchTerm);
    });

    it('should handle very long search strings', async () => {
      const longSearch = 'A'.repeat(1000);
      
      const response = await request(app)
        .get('/api/tasks')
        .query({ search: longSearch })
        .expect(200);

      expect(response.body.filters.search).toBe(longSearch);
      expect(response.body.tasks).toBeDefined();
    });

    it('should maintain consistent results with repeated requests', async () => {
      const queryParams = '?status=incomplete&priority=high&sort=title&order=asc';
      
      const response1 = await request(app)
        .get(`/api/tasks${queryParams}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/tasks${queryParams}`)
        .expect(200);

      expect(response1.body.count).toBe(response2.body.count);
      expect(response1.body.tasks).toEqual(response2.body.tasks);
    });

    it('should handle rapid filtering requests', async () => {
      const requests = [
        request(app).get('/api/tasks?priority=high'),
        request(app).get('/api/tasks?priority=medium'),
        request(app).get('/api/tasks?priority=low'),
        request(app).get('/api/tasks?status=completed'),
        request(app).get('/api/tasks?search=Task')
      ];

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.tasks).toBeDefined();
        expect(Array.isArray(response.body.tasks)).toBe(true);
      });
    });
  });
});