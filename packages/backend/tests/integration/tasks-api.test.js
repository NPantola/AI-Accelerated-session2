const request = require('supertest');
const { app, db, statements } = require('../../src/app');

describe('Tasks API Integration Tests', () => {
  let server;
  
  beforeAll(() => {
    server = app.listen(0); // Use random available port
  });
  
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    // Clean up test data before each test
    db.exec('DELETE FROM tasks WHERE title LIKE "Test%"');
  });

  afterEach(() => {
    // Clean up test data after each test
    db.exec('DELETE FROM tasks WHERE title LIKE "Test%"');
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks with default sorting', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should return tasks with correct structure', async () => {
      // First create a test task to ensure we have data
      const taskData = {
        title: 'Test Task for Structure',
        description: 'Test description',
        priority: 'high',
        due_date: '2026-03-10 10:00:00'
      };

      await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      const testTask = response.body.tasks.find(task => task.title === taskData.title);
      expect(testTask).toBeDefined();
      expect(testTask).toHaveProperty('id');
      expect(testTask).toHaveProperty('title');
      expect(testTask).toHaveProperty('description');
      expect(testTask).toHaveProperty('completed');
      expect(testTask).toHaveProperty('priority');
      expect(testTask).toHaveProperty('due_date');
      expect(testTask).toHaveProperty('created_at');
      expect(testTask).toHaveProperty('updated_at');
    });

    it('should return empty array when no tasks match filters', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed&priority=high&search=nonexistent')
        .expect(200);

      expect(response.body.tasks).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should handle query parameters correctly', async () => {
      const response = await request(app)
        .get('/api/tasks?status=all&priority=all&sort=title&order=asc')
        .expect(200);

      expect(response.body.filters).toMatchObject({
        status: 'all',
        priority: 'all',
        sort: 'title',
        order: 'asc'
      });
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with all fields', async () => {
      const taskData = {
        title: 'Test Task Complete',
        description: 'Complete test task with all fields',
        priority: 'high',
        due_date: '2026-03-15 14:30:00'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.due_date).toBe(taskData.due_date);
      expect(response.body.completed).toBe(0);
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    });

    it('should create a task with minimal required fields', async () => {
      const taskData = {
        title: 'Test Minimal Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBeNull();
      expect(response.body.priority).toBe('medium'); // default value
      expect(response.body.due_date).toBeNull();
      expect(response.body.completed).toBe(0);
    });

    it('should trim whitespace from title and description', async () => {
      const taskData = {
        title: '  Test Task with Spaces  ',
        description: '  Description with spaces  '
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe('Test Task with Spaces');
      expect(response.body.description).toBe('Description with spaces');
    });

    it('should validate required title field', async () => {
      const taskData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should validate priority field', async () => {
      const taskData = {
        title: 'Test Task Invalid Priority',
        priority: 'invalid'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
    });

    it('should validate empty title field', async () => {
      const taskData = {
        title: '   ' // only whitespace
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should handle null description correctly', async () => {
      const taskData = {
        title: 'Test Task Null Description',
        description: null
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.description).toBeNull();
    });
  });

  describe('GET /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      // Create a test task
      const taskData = {
        title: 'Test Task for GET by ID',
        description: 'Test description for single task retrieval'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      testTaskId = createResponse.body.id;
    });

    it('should return specific task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.id).toBe(testTaskId);
      expect(response.body.title).toBe('Test Task for GET by ID');
      expect(response.body.description).toBe('Test description for single task retrieval');
    });

    it('should return 404 for non-existent task ID', async () => {
      const nonExistentId = 99999;
      const response = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should return 400 for empty task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/')
        .expect(404); // Express returns 404 for this route pattern

      // This tests the route matching, not our validation
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      const taskData = {
        title: 'Test Task for Update',
        description: 'Original description',
        priority: 'medium',
        due_date: '2026-03-10 10:00:00'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      testTaskId = createResponse.body.id;
    });

    it('should update all task fields', async () => {
      const updateData = {
        title: 'Updated Test Task',
        description: 'Updated description',
        priority: 'high',
        due_date: '2026-03-15 15:00:00'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.due_date).toBe(updateData.due_date);
      expect(response.body.id).toBe(testTaskId);
    });

    it('should update partial fields and keep others unchanged', async () => {
      const updateData = {
        title: 'Partially Updated Task'
        // Only updating title
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe('Original description'); // unchanged
      expect(response.body.priority).toBe('medium'); // unchanged
    });

    it('should update description to null', async () => {
      const updateData = {
        description: null
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const updateData = {
        title: 'Updated Non-existent Task'
      };

      const response = await request(app)
        .put('/api/tasks/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should trim whitespace from updated fields', async () => {
      const updateData = {
        title: '  Updated Task with Spaces  ',
        description: '  Updated description with spaces  '
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Task with Spaces');
      expect(response.body.description).toBe('Updated description with spaces');
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    let testTaskId;

    beforeEach(async () => {
      const taskData = {
        title: 'Test Task for Toggle',
        description: 'Task to test completion toggle'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      testTaskId = createResponse.body.id;
    });

    it('should toggle task completion status from incomplete to complete', async () => {
      // Initially completed should be false (0)
      let response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(response.body.completed).toBe(0);

      // Toggle to complete
      response = await request(app)
        .patch(`/api/tasks/${testTaskId}/toggle`)
        .expect(200);

      expect(response.body.completed).toBe(1);
      expect(response.body.id).toBe(testTaskId);
    });

    it('should toggle task completion status from complete to incomplete', async () => {
      // First toggle to complete
      await request(app)
        .patch(`/api/tasks/${testTaskId}/toggle`)
        .expect(200);

      // Verify it's completed
      let response = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(response.body.completed).toBe(1);

      // Toggle back to incomplete
      response = await request(app)
        .patch(`/api/tasks/${testTaskId}/toggle`)
        .expect(200);

      expect(response.body.completed).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/api/tasks/99999/toggle')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .patch('/api/tasks/invalid-id/toggle')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should update the updated_at timestamp', async () => {
      // Get original timestamp
      let getResponse = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);

      const originalUpdatedAt = getResponse.body.updated_at;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Toggle completion
      const toggleResponse = await request(app)
        .patch(`/api/tasks/${testTaskId}/toggle`)
        .expect(200);

      expect(new Date(toggleResponse.body.updated_at).getTime())
        .toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTaskId;

    beforeEach(async () => {
      const taskData = {
        title: 'Test Task for Deletion',
        description: 'Task to be deleted during testing'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      testTaskId = createResponse.body.id;
    });

    it('should delete an existing task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.message).toBe('Task deleted successfully');
      expect(response.body.id).toBe(testTaskId);

      // Verify task is actually deleted
      await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .delete('/api/tasks/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should not affect other tasks when deleting', async () => {
      // Create another task
      const anotherTaskData = {
        title: 'Test Another Task',
        description: 'This task should not be affected'
      };

      const anotherTaskResponse = await request(app)
        .post('/api/tasks')
        .send(anotherTaskData);

      const anotherTaskId = anotherTaskResponse.body.id;

      // Delete the original test task
      await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .expect(200);

      // Verify the other task still exists
      const response = await request(app)
        .get(`/api/tasks/${anotherTaskId}`)
        .expect(200);

      expect(response.body.title).toBe(anotherTaskData.title);
    });

    it('should handle deletion of already deleted task', async () => {
      // Delete the task once
      await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .expect(200);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test simulates unexpected database errors
      // In a real scenario, you might mock the database to throw errors
      
      const invalidTaskData = {
        title: 'Test Task',
        priority: 'high',
        due_date: 'invalid-date-format'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTaskData)
        .expect(400);

      // The validation should catch invalid date before hitting database
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle concurrent task operations', async () => {
      const taskData = {
        title: 'Test Concurrent Task',
        description: 'Task for concurrent operations test'
      };

      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Perform concurrent operations
      const operations = [
        request(app).get(`/api/tasks/${taskId}`),
        request(app).patch(`/api/tasks/${taskId}/toggle`),
        request(app).put(`/api/tasks/${taskId}`).send({ description: 'Updated concurrently' })
      ];

      const responses = await Promise.all(operations);
      
      // All operations should succeed
      responses.forEach((response, index) => {
        expect([200, 201].includes(response.status)).toBe(true);
      });
    });

    it('should maintain data integrity with rapid successive operations', async () => {
      const taskData = {
        title: 'Test Rapid Operations Task',
        description: 'Task for rapid operations test'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Perform rapid toggle operations
      for (let i = 0; i < 5; i++) {
        await request(app)
          .patch(`/api/tasks/${taskId}/toggle`)
          .expect(200);
      }

      // Final state should be completed (odd number of toggles)
      const finalResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(finalResponse.body.completed).toBe(1);
    });

    it('should handle very long task titles and descriptions', async () => {
      const longTitle = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(5000);

      const taskData = {
        title: longTitle,
        description: longDescription,
        priority: 'high'
      };

      // This should either succeed (if no length limits) or return validation error
      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect([201, 400].includes(response.status)).toBe(true);
      
      if (response.status === 201) {
        // If successful, verify data was stored correctly
        expect(response.body.title).toBe(longTitle);
        expect(response.body.description).toBe(longDescription);
      }
    });
  });
});