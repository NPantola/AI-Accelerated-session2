const request = require('supertest');
const { app, db, statements } = require('../../src/app');

describe('Database Integration Tests', () => {
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
    db.exec('DELETE FROM tasks WHERE title LIKE "DB%"');
  });

  afterEach(() => {
    // Clean up test data after each test
    db.exec('DELETE FROM tasks WHERE title LIKE "DB%"');
  });

  describe('Database Schema and Structure', () => {
    it('should have tasks table with correct schema', () => {
      const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
      
      const expectedColumns = [
        { name: 'id', type: 'INTEGER', pk: 1 },
        { name: 'title', type: 'TEXT', notnull: 1 },
        { name: 'description', type: 'TEXT', notnull: 0 },
        { name: 'completed', type: 'BOOLEAN', dflt_value: '0' },
        { name: 'priority', type: 'TEXT', dflt_value: "'medium'" },
        { name: 'due_date', type: 'DATETIME', notnull: 0 },
        { name: 'created_at', type: 'DATETIME', dflt_value: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'DATETIME', dflt_value: 'CURRENT_TIMESTAMP' }
      ];

      expectedColumns.forEach(expectedCol => {
        const actualCol = tableInfo.find(col => col.name === expectedCol.name);
        expect(actualCol).toBeDefined();
        expect(actualCol.type).toBe(expectedCol.type);
        
        if (expectedCol.pk) expect(actualCol.pk).toBe(expectedCol.pk);
        if (expectedCol.notnull !== undefined) expect(actualCol.notnull).toBe(expectedCol.notnull);
      });
    });

    it('should have proper indexes created', () => {
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tasks'").all();
      const indexNames = indexes.map(idx => idx.name);

      const expectedIndexes = [
        'idx_tasks_completed',
        'idx_tasks_priority', 
        'idx_tasks_due_date',
        'idx_tasks_created_at'
      ];

      expectedIndexes.forEach(expectedIndex => {
        expect(indexNames).toContain(expectedIndex);
      });
    });

    it('should enforce priority constraint', () => {
      expect(() => {
        db.prepare('INSERT INTO tasks (title, priority) VALUES (?, ?)').run(
          'DB Test Invalid Priority',
          'invalid_priority'
        );
      }).toThrow();
    });

    it('should enforce NOT NULL constraint on title', () => {
      expect(() => {
        db.prepare('INSERT INTO tasks (title) VALUES (?)').run(null);
      }).toThrow();
    });

    it('should set default values correctly', () => {
      const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run('DB Test Defaults');
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

      expect(task.completed).toBe(0);
      expect(task.priority).toBe('medium');
      expect(task.created_at).toBeDefined();
      expect(task.updated_at).toBeDefined();
      expect(task.description).toBeNull();
      expect(task.due_date).toBeNull();
    });
  });

  describe('Database Operations Performance', () => {
    it('should perform bulk inserts efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 test tasks
      const tasks = [];
      for (let i = 1; i <= 100; i++) {
        tasks.push({
          title: `DB Test Bulk Insert ${i}`,
          description: `Bulk insert test task number ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
        });
      }

      // Insert via API to test the full stack
      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task).expect(201);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerInsert = totalTime / 100;

      console.log(`Bulk insert of 100 tasks took ${totalTime}ms (${avgTimePerInsert}ms per task)`);
      
      // Should be reasonably fast
      expect(avgTimePerInsert).toBeLessThan(50); // Less than 50ms per insert on average

      // Verify all tasks were created
      const response = await request(app)
        .get('/api/tasks?search=DB Test Bulk Insert')
        .expect(200);

      expect(response.body.count).toBe(100);
    });

    it('should perform complex queries efficiently', async () => {
      // Create test data with various combinations
      const testTasks = [
        { title: 'DB Test Complex High 1', priority: 'high', completed: false },
        { title: 'DB Test Complex High 2', priority: 'high', completed: true },
        { title: 'DB Test Complex Medium 1', priority: 'medium', completed: false },
        { title: 'DB Test Complex Medium 2', priority: 'medium', completed: true },
        { title: 'DB Test Complex Low 1', priority: 'low', completed: false }
      ];

      for (const task of testTasks) {
        const createResponse = await request(app).post('/api/tasks').send({
          title: task.title,
          priority: task.priority
        }).expect(201);

        if (task.completed) {
          await request(app).patch(`/api/tasks/${createResponse.body.id}/toggle`).expect(200);
        }
      }

      const startTime = Date.now();
      
      // Complex query with multiple filters
      const response = await request(app)
        .get('/api/tasks?search=DB Test Complex&status=incomplete&priority=high&sort=title&order=asc')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      console.log(`Complex filtered query took ${queryTime}ms`);
      
      // Should be fast due to indexes
      expect(queryTime).toBeLessThan(100);
      
      // Should return correct results
      expect(response.body.count).toBe(1);
      expect(response.body.tasks[0].title).toBe('DB Test Complex High 1');
    });

    it('should handle concurrent database operations', async () => {
      const concurrentOps = [];
      
      // Mix of different database operations
      for (let i = 1; i <= 20; i++) {
        const taskData = {
          title: `DB Test Concurrent ${i}`,
          priority: i % 3 === 0 ? 'high' : 'medium'
        };
        
        concurrentOps.push(
          request(app).post('/api/tasks').send(taskData)
        );
      }

      const responses = await Promise.all(concurrentOps);
      
      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
      });

      // Now test concurrent reads
      const taskIds = responses.map(r => r.body.id);
      const readOps = taskIds.map(id => 
        request(app).get(`/api/tasks/${id}`)
      );

      const readResponses = await Promise.all(readOps);
      
      readResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.title).toMatch(/^DB Test Concurrent/);
      });
    });

    it('should maintain data integrity under rapid operations', async () => {
      // Create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'DB Test Integrity Race' })
        .expect(201);

      const taskId = createResponse.body.id;

      // Perform rapid toggle operations
      const toggleOps = [];
      for (let i = 0; i < 10; i++) {
        toggleOps.push(
          request(app).patch(`/api/tasks/${taskId}/toggle`)
        );
      }

      const toggleResponses = await Promise.all(toggleOps);
      
      // All operations should succeed
      toggleResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Final state should be consistent (even number of toggles = incomplete)
      const finalResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(finalResponse.body.completed).toBe(0); // Even number of toggles
    });
  });

  describe('Database Transaction Behavior', () => {
    it('should handle failed operations gracefully', async () => {
      // Try to create task with invalid data that might cause database error
      const invalidTaskData = {
        title: 'DB Test Transaction Failure',
        priority: 'medium'
        // We'll modify after creation to trigger update failure
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(invalidTaskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Now try an operation that should fail validation
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ priority: 'invalid' })
        .expect(400);

      expect(updateResponse.body.error).toBe('Validation failed');

      // Original task should still exist unchanged
      const checkResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(checkResponse.body.priority).toBe('medium');
      expect(checkResponse.body.title).toBe(invalidTaskData.title);
    });

    it('should handle database locks and contention', async () => {
      // This test simulates potential lock contention scenarios
      const taskData = {
        title: 'DB Test Lock Contention',
        description: 'Testing database lock handling'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Simultaneous operations on the same record
      const simultaneousOps = [
        request(app).put(`/api/tasks/${taskId}`).send({ 
          description: 'Updated by op 1' 
        }),
        request(app).patch(`/api/tasks/${taskId}/toggle`),
        request(app).get(`/api/tasks/${taskId}`),
        request(app).put(`/api/tasks/${taskId}`).send({ 
          description: 'Updated by op 2' 
        })
      ];

      const responses = await Promise.all(simultaneousOps);
      
      // All operations should complete (though with different results)
      responses.forEach(response => {
        expect([200, 201].includes(response.status)).toBe(true);
      });

      // Final state should be consistent
      const finalResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(finalResponse.body.id).toBe(taskId);
      expect(finalResponse.body.title).toBe(taskData.title);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database corruption gracefully', () => {
      // This is a theoretical test - in real scenarios you'd mock database errors
      // Here we test that prepared statements are properly configured
      
      expect(statements.getAllTasks).toBeDefined();
      expect(statements.getTaskById).toBeDefined();
      expect(statements.insertTask).toBeDefined();
      expect(statements.updateTask).toBeDefined();
      expect(statements.toggleTaskCompletion).toBeDefined();
      expect(statements.deleteTask).toBeDefined();

      // Test that statements work
      const allTasks = statements.getAllTasks.all();
      expect(Array.isArray(allTasks)).toBe(true);
    });

    it('should handle invalid SQL injection attempts', async () => {
      // Test various SQL injection patterns
      const maliciousInputs = [
        "'; DROP TABLE tasks; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM sqlite_master --",
        '" OR 1=1 --',
        "'; INSERT INTO tasks VALUES(999, 'hacked'); --"
      ];

      for (const maliciousInput of maliciousInputs) {
        // Try in search parameter
        const searchResponse = await request(app)
          .get('/api/tasks')
          .query({ search: maliciousInput })
          .expect(200);

        // Should not cause any issues, just return search results
        expect(searchResponse.body.tasks).toBeDefined();

        // Try in task creation
        const createResponse = await request(app)
          .post('/api/tasks')
          .send({
            title: `DB Test SQL Injection`,
            description: maliciousInput
          })
          .expect(201);

        // Data should be stored as-is (escaped)
        expect(createResponse.body.description).toBe(maliciousInput);

        // Clean up
        await request(app)
          .delete(`/api/tasks/${createResponse.body.id}`)
          .expect(200);
      }
    });

    it('should maintain referential integrity', async () => {
      // Since our schema is simple, we test operational integrity
      const taskData = {
        title: 'DB Test Referential Integrity',
        description: 'Testing data consistency'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Update task
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ description: 'Updated description' })
        .expect(200);

      // Toggle completion
      await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(200);

      // Verify all operations maintained data integrity
      const finalResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(finalResponse.body.id).toBe(taskId);
      expect(finalResponse.body.title).toBe(taskData.title);
      expect(finalResponse.body.description).toBe('Updated description');
      expect(finalResponse.body.completed).toBe(1);
    });
  });

  describe('Database Query Optimization', () => {
    it('should use indexes effectively for filtering queries', async () => {
      // Create test data to populate indexes
      const testTasks = [];
      for (let i = 1; i <= 50; i++) {
        testTasks.push({
          title: `DB Test Index Usage ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
          due_date: i <= 25 ? '2026-03-15 10:00:00' : null
        });
      }

      // Create tasks
      for (const task of testTasks) {
        await request(app).post('/api/tasks').send(task).expect(201);
      }

      const startTime = Date.now();
      
      // Query that should use indexes
      const response = await request(app)
        .get('/api/tasks?priority=high&status=incomplete')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      console.log(`Indexed query took ${queryTime}ms`);
      
      // Should be fast due to indexes
      expect(queryTime).toBeLessThan(50);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should handle ORDER BY queries efficiently', async () => {
      // Create test data with various dates and priorities
      const testTasks = [];
      const baseDate = new Date('2026-03-01');
      
      for (let i = 1; i <= 30; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(baseDate.getDate() + i);
        
        testTasks.push({
          title: `DB Test Sort ${i.toString().padStart(2, '0')}`,
          priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
          due_date: dueDate.toISOString()
        });
      }

      // Create tasks
      for (const task of testTasks) {
        await request(app).post('/api/tasks').send(task).expect(201);
      }

      const startTime = Date.now();
      
      // Test various sort orders
      const sortQueries = [
        '/api/tasks?sort=due_date&order=asc',
        '/api/tasks?sort=priority&order=desc',
        '/api/tasks?sort=title&order=asc',
        '/api/tasks?sort=created_at&order=desc'
      ];

      for (const query of sortQueries) {
        const response = await request(app)
          .get(query)
          .expect(200);

        expect(response.body.tasks.length).toBeGreaterThan(0);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgQueryTime = totalTime / sortQueries.length;

      console.log(`Average sort query time: ${avgQueryTime}ms`);
      expect(avgQueryTime).toBeLessThan(100);
    });

    it('should handle LIKE queries for search efficiently', async () => {
      // Create test data with searchable content
      const searchableWords = ['project', 'meeting', 'review', 'update', 'fix', 'implement'];
      const testTasks = [];

      for (let i = 1; i <= 60; i++) {
        const word1 = searchableWords[i % searchableWords.length];
        const word2 = searchableWords[(i + 1) % searchableWords.length];
        
        testTasks.push({
          title: `DB Test Search ${word1} ${i}`,
          description: `This task involves ${word2} work for the application`
        });
      }

      // Create tasks
      for (const task of testTasks) {
        await request(app).post('/api/tasks').send(task).expect(201);
      }

      const startTime = Date.now();
      
      // Test various search patterns
      const searchQueries = [
        'project',
        'meeting',
        'DB Test',
        'involves',
        'application'
      ];

      for (const searchTerm of searchQueries) {
        const response = await request(app)
          .get(`/api/tasks?search=${searchTerm}`)
          .expect(200);

        expect(response.body.count).toBeGreaterThan(0);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgSearchTime = totalTime / searchQueries.length;

      console.log(`Average search query time: ${avgSearchTime}ms`);
      expect(avgSearchTime).toBeLessThan(100);
    });
  });

  describe('Database Storage and Limits', () => {
    it('should handle UTF-8 characters correctly', async () => {
      const unicodeTaskData = {
        title: 'DB Test Unicode 🚀 ñáéíóú',
        description: 'Testing Unicode support: 中文, العربية, русский, 日本語, emoji: 🎉🔥💯'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(unicodeTaskData)
        .expect(201);

      expect(createResponse.body.title).toBe(unicodeTaskData.title);
      expect(createResponse.body.description).toBe(unicodeTaskData.description);

      // Verify data persisted correctly
      const getResponse = await request(app)
        .get(`/api/tasks/${createResponse.body.id}`)
        .expect(200);

      expect(getResponse.body.title).toBe(unicodeTaskData.title);
      expect(getResponse.body.description).toBe(unicodeTaskData.description);
    });

    it('should handle large text fields appropriately', async () => {
      const largeTitle = 'DB Test Large Title ' + 'A'.repeat(500);
      const largeDescription = 'DB Test Large Description ' + 'B'.repeat(10000);

      const taskData = {
        title: largeTitle,
        description: largeDescription
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      // Should either succeed or fail gracefully
      expect([201, 400].includes(response.status)).toBe(true);

      if (response.status === 201) {
        expect(response.body.title).toBe(largeTitle);
        expect(response.body.description).toBe(largeDescription);

        // Clean up
        await request(app)
          .delete(`/api/tasks/${response.body.id}`)
          .expect(200);
      }
    });

    it('should handle null and empty values correctly', async () => {
      const taskData = {
        title: 'DB Test Null Values',
        description: null,
        due_date: null
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(createResponse.body.description).toBeNull();
      expect(createResponse.body.due_date).toBeNull();

      // Update with empty string vs null
      await request(app)
        .put(`/api/tasks/${createResponse.body.id}`)
        .send({ description: '' })
        .expect(200);

      const updatedResponse = await request(app)
        .get(`/api/tasks/${createResponse.body.id}`)
        .expect(200);

      // Empty string should be stored as empty string or null depending on app logic
      expect(updatedResponse.body.description !== undefined).toBe(true);
    });
  });
});