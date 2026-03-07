const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks Validation Integration', () => {
  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('POST /api/tasks - Validation', () => {
    it('should reject tasks with empty title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ description: 'Task without title' })
        .expect(400);

      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with only whitespace title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with non-string title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 123 })
        .expect(400);

      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with invalid priority', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ 
          title: 'Valid Title',
          priority: 'urgent' 
        })
        .expect(400);

      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
    });

    it('should reject tasks with invalid due date format', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ 
          title: 'Valid Title',
          due_date: 'invalid-date' 
        })
        .expect(400);

      expect(response.body.details).toContain('Due date must be a valid date');
    });

    it('should reject tasks with non-boolean completed value', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ 
          title: 'Valid Title',
          completed: 'yes' 
        })
        .expect(400);

      expect(response.body.details).toContain('Completed must be a boolean value');
    });

    it('should accumulate multiple validation errors', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ 
          title: '',
          priority: 'invalid',
          due_date: 'bad-date',
          completed: 'maybe'
        })
        .expect(400);

      expect(response.body.details).toHaveLength(4);
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
      expect(response.body.details).toContain('Due date must be a valid date');
      expect(response.body.details).toContain('Completed must be a boolean value');
    });

    it('should accept valid task data', async () => {
      const validTask = {
        title: 'Valid Task',
        description: 'This is a valid task description',
        priority: 'high',
        due_date: '2026-03-15 14:30:00'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(validTask)
        .expect(201);

      expect(response.body.title).toBe(validTask.title);
      expect(response.body.description).toBe(validTask.description);
      expect(response.body.priority).toBe(validTask.priority);
      expect(response.body.due_date).toBe(validTask.due_date);
    });

    it('should accept task with null/undefined optional fields', async () => {
      const validTask = {
        title: 'Minimal Task',
        description: null,
        due_date: null
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(validTask)
        .expect(201);

      expect(response.body.title).toBe(validTask.title);
      expect(response.body.description).toBeNull();
      expect(response.body.due_date).toBeNull();
      expect(response.body.priority).toBe('medium'); // Default value
    });
  });

  describe('PUT /api/tasks/:id - Validation', () => {
    let taskId;

    beforeAll(async () => {
      // Create a task to update
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task for Update Validation' })
        .expect(201);
      taskId = response.body.id;
    });

    it('should reject update with empty title', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject update with invalid priority', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ 
          title: 'Valid Title',
          priority: 'critical' 
        })
        .expect(400);

      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
    });

    it('should reject update with invalid due date', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ 
          title: 'Valid Title',
          due_date: '2026-13-45' 
        })
        .expect(400);

      expect(response.body.details).toContain('Due date must be a valid date');
    });

    it('should allow partial updates with valid data', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ priority: 'low' })
        .expect(200);

      expect(response.body.priority).toBe('low');
      expect(response.body.title).toBe('Task for Update Validation'); // Should remain unchanged
    });

    it('should allow update with null values for optional fields', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ 
          title: 'Updated Title',
          description: null,
          due_date: null 
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBeNull();
      expect(response.body.due_date).toBeNull();
    });
  });

  describe('GET /api/tasks/:id - ID Validation', () => {
    it('should reject non-numeric ID', async () => {
      const response = await request(app)
        .get('/api/tasks/abc')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should reject empty ID', async () => {
      const response = await request(app)
        .get('/api/tasks/')
        .expect(404); // Note: This becomes a 404 because the route doesn't match

      // The route /api/tasks/ doesn't match /api/tasks/:id, so it's handled as a different endpoint
    });

    it('should handle non-existent numeric ID gracefully', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should accept valid numeric ID', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task for ID validation' })
        .expect(201);

      const taskId = createResponse.body.id;

      // Then retrieve it with valid ID
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
    });
  });

  describe('PUT /api/tasks/:id - ID Validation', () => {
    it('should reject non-numeric ID for updates', async () => {
      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .send({ title: 'Updated Title' })
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should handle non-existent ID for updates', async () => {
      const response = await request(app)
        .put('/api/tasks/99999')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id/toggle - ID Validation', () => {
    it('should reject non-numeric ID for toggle', async () => {
      const response = await request(app)
        .patch('/api/tasks/invalid-id/toggle')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should handle non-existent ID for toggle', async () => {
      const response = await request(app)
        .patch('/api/tasks/99999/toggle')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id - ID Validation', () => {
    it('should reject non-numeric ID for deletion', async () => {
      const response = await request(app)
        .delete('/api/tasks/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should handle non-existent ID for deletion', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task titles', async () => {
      const longTitle = 'A'.repeat(1000); // Very long title
      
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: longTitle })
        .expect(201);

      expect(response.body.title).toBe(longTitle);
    });

    it('should handle special characters in task data', async () => {
      const specialTask = {
        title: 'Task with special chars: !@#$%^&*()_+[]{}|;:,.<>?',
        description: 'Unicode test: 你好 🚀 émojis and åccénts',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(specialTask)
        .expect(201);

      expect(response.body.title).toBe(specialTask.title);
      expect(response.body.description).toBe(specialTask.description);
    });

    it('should handle boundary date values', async () => {
      const boundaryTask = {
        title: 'Boundary Date Test',
        due_date: '1970-01-01 00:00:00'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(boundaryTask)
        .expect(201);

      expect(response.body.due_date).toBe(boundaryTask.due_date);
    });

    it('should preserve data types in validation errors', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ 
          title: null,  // null instead of string
          priority: 123, // number instead of string
          completed: 'true' // string instead of boolean
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });
});