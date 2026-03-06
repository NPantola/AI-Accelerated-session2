const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks Validation and Error Handling Integration Tests', () => {
  let server;

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

  beforeEach(() => {
    // Clean up test data before each test
    db.exec('DELETE FROM tasks WHERE title LIKE "Validation%"');
  });

  afterEach(() => {
    // Clean up test data after each test
    db.exec('DELETE FROM tasks WHERE title LIKE "Validation%"');
  });

  describe('POST /api/tasks Validation', () => {
    it('should reject tasks without title', async () => {
      const taskData = {
        description: 'Task without title',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with empty title', async () => {
      const taskData = {
        title: '',
        description: 'Task with empty title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with whitespace-only title', async () => {
      const taskData = {
        title: '   \n\t  ',
        description: 'Task with whitespace title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with null title', async () => {
      const taskData = {
        title: null,
        description: 'Task with null title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with non-string title', async () => {
      const taskData = {
        title: 12345,
        description: 'Task with numeric title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should reject tasks with invalid priority', async () => {
      const taskData = {
        title: 'Validation Test Task',
        priority: 'critical'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
    });

    it('should reject tasks with invalid priority types', async () => {
      const invalidPriorities = [123, true, [], {}, null];

      for (const priority of invalidPriorities) {
        const taskData = {
          title: `Validation Test Task ${priority}`,
          priority: priority
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('Priority must be one of: low, medium, high');
      }
    });

    it('should accept valid priority values', async () => {
      const validPriorities = ['low', 'medium', 'high'];

      for (const priority of validPriorities) {
        const taskData = {
          title: `Validation Test Valid Priority ${priority}`,
          priority: priority
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(201);

        expect(response.body.priority).toBe(priority);
      }
    });

    it('should use medium as default priority when not provided', async () => {
      const taskData = {
        title: 'Validation Test Default Priority'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.priority).toBe('medium');
    });

    it('should reject tasks with invalid due date format', async () => {
      const taskData = {
        title: 'Validation Test Invalid Date',
        due_date: 'not-a-date'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Due date must be a valid date');
    });

    it('should reject tasks with invalid date objects', async () => {
      const invalidDates = ['2026-13-45', '2026-02-30', 'March 32, 2026'];

      for (const invalidDate of invalidDates) {
        const taskData = {
          title: `Validation Test Invalid Date ${invalidDate}`,
          due_date: invalidDate
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('Due date must be a valid date');
      }
    });

    it('should accept valid date formats', async () => {
      const validDates = [
        '2026-03-15',
        '2026-03-15 14:30:00',
        '2026-03-15T14:30:00.000Z',
        '2026-12-31 23:59:59'
      ];

      for (const validDate of validDates) {
        const taskData = {
          title: `Validation Test Valid Date ${validDate}`,
          due_date: validDate
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(201);

        expect(response.body.due_date).toBeDefined();
      }
    });

    it('should accept null due date', async () => {
      const taskData = {
        title: 'Validation Test Null Date',
        due_date: null
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.due_date).toBeNull();
    });

    it('should reject tasks with invalid completed field type', async () => {
      const taskData = {
        title: 'Validation Test Invalid Completed',
        completed: 'yes'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Completed must be a boolean value');
    });

    it('should trim title and description fields', async () => {
      const taskData = {
        title: '  Validation Test Trimmed Title  ',
        description: '  Trimmed description  '
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe('Validation Test Trimmed Title');
      expect(response.body.description).toBe('Trimmed description');
    });

    it('should handle multiple validation errors', async () => {
      const taskData = {
        title: '',
        priority: 'invalid',
        due_date: 'not-a-date',
        completed: 'maybe'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThanOrEqual(3);
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
      expect(response.body.details).toContain('Due date must be a valid date');
    });
  });

  describe('PUT /api/tasks/:id Validation', () => {
    let testTaskId;

    beforeEach(async () => {
      const taskData = {
        title: 'Validation Test Original Task',
        description: 'Original description',
        priority: 'medium'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      testTaskId = createResponse.body.id;
    });

    it('should validate title when updating', async () => {
      const updateData = {
        title: ''
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should validate priority when updating', async () => {
      const updateData = {
        priority: 'extreme'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Priority must be one of: low, medium, high');
    });

    it('should validate due date when updating', async () => {
      const updateData = {
        due_date: 'invalid-date'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Due date must be a valid date');
    });

    it('should allow partial updates with valid data', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(response.body.title).toBe('Validation Test Original Task'); // unchanged
    });

    it('should trim fields when updating', async () => {
      const updateData = {
        title: '  Updated Trimmed Title  ',
        description: '  Updated trimmed description  '
      };

      const response = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Trimmed Title');
      expect(response.body.description).toBe('Updated trimmed description');
    });

    it('should reject update with invalid task ID', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Valid task ID is required');
    });

    it('should reject update for non-existent task', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/tasks/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Error Handling for All Endpoints', () => {
    it('should handle invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express will handle the JSON parsing error
      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send('title=Test&description=Test')
        .expect(400);

      // Should fail validation as title won't be parsed correctly
      expect(response.status).toBe(400);
    });

    it('should handle extremely large payloads gracefully', async () => {
      const largePayload = {
        title: 'Validation Test Large Payload',
        description: 'A'.repeat(100000) // 100KB description
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(largePayload);

      // Should either succeed or fail gracefully
      expect([201, 400, 413].includes(response.status)).toBe(true);
    });

    it('should handle concurrent validation requests', async () => {
      const invalidTaskData = {
        title: '',
        priority: 'invalid'
      };

      const requests = Array(5).fill().map(() =>
        request(app)
          .post('/api/tasks')
          .send(invalidTaskData)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    it('should maintain consistent error format across endpoints', async () => {
      // Test POST validation error
      const postResponse = await request(app)
        .post('/api/tasks')
        .send({ title: '' })
        .expect(400);

      // Test PUT validation error  
      const taskData = { title: 'Test Task' };
      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      const putResponse = await request(app)
        .put(`/api/tasks/${createResponse.body.id}`)
        .send({ priority: 'invalid' })
        .expect(400);

      // Both should have consistent error structure
      expect(postResponse.body).toHaveProperty('error');
      expect(postResponse.body).toHaveProperty('details');
      expect(putResponse.body).toHaveProperty('error');
      expect(putResponse.body).toHaveProperty('details');

      expect(postResponse.body.error).toBe('Validation failed');
      expect(putResponse.body.error).toBe('Validation failed');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malicious script injection in title', async () => {
      const taskData = {
        title: '<script>alert("xss")</script>Validation Test XSS',
        description: '<img src="x" onerror="alert(1)">'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      // Data should be stored as-is (sanitization would be handled by frontend)
      expect(response.body.title).toBe('<script>alert("xss")</script>Validation Test XSS');
      expect(response.body.description).toBe('<img src="x" onerror="alert(1)">');
    });

    it('should handle Unicode characters correctly', async () => {
      const taskData = {
        title: 'Validation Test Unicode 🚀 ñáéíóú',
        description: 'Unicode description with emojis 🎉 and accents áéíóú'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
    });

    it('should handle null and undefined values in optional fields', async () => {
      const taskData = {
        title: 'Validation Test Null Fields',
        description: null,
        due_date: undefined
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.description).toBeNull();
      expect(response.body.due_date).toBeNull();
    });

    it('should handle unexpected additional fields', async () => {
      const taskData = {
        title: 'Validation Test Extra Fields',
        description: 'Task with extra fields',
        extraField: 'should be ignored',
        maliciousField: '<script>alert("hack")</script>',
        numericField: 12345
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      // Extra fields should be ignored, not stored
      expect(response.body.extraField).toBeUndefined();
      expect(response.body.maliciousField).toBeUndefined();
      expect(response.body.numericField).toBeUndefined();
    });

    it('should handle deeply nested objects', async () => {
      const taskData = {
        title: 'Validation Test Nested Object',
        description: {
          text: 'Nested description',
          metadata: {
            author: 'test',
            tags: ['tag1', 'tag2']
          }
        }
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      // Description should be converted to string or rejected
      expect(typeof response.body.description === 'string' || response.body.description === null).toBe(true);
    });

    it('should handle array values in string fields', async () => {
      const taskData = {
        title: ['Array', 'as', 'title'],
        description: ['Array', 'as', 'description']
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should handle boolean values in string fields', async () => {
      const taskData = {
        title: true,
        description: false
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Title is required and must be a non-empty string');
    });

    it('should handle extremely long field values', async () => {
      const longString = 'A'.repeat(10000);
      
      const taskData = {
        title: longString,
        description: longString
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      // Should either succeed or fail with appropriate error
      expect([201, 400].includes(response.status)).toBe(true);
      
      if (response.status === 201) {
        expect(response.body.title).toBe(longString);
        expect(response.body.description).toBe(longString);
      }
    });
  });
});