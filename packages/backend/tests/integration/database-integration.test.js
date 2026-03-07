const request = require('supertest');
const { app, db, statements } = require('../../src/app');

describe('Database Integration', () => {
  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('Database Initialization', () => {
    it('should have a working database connection', () => {
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it('should have tasks table with correct structure', () => {
      const result = db.prepare('PRAGMA table_info(tasks)').all();
      const columns = result.map(col => col.name);
      
      const expectedColumns = [
        'id', 'title', 'description', 'completed', 
        'priority', 'due_date', 'created_at', 'updated_at'
      ];
      
      expectedColumns.forEach(column => {
        expect(columns).toContain(column);
      });
    });

    it('should have proper indexes created', () => {
      const indexes = db.prepare('PRAGMA index_list(tasks)').all();
      const indexNames = indexes.map(idx => idx.name);
      
      expect(indexNames).toContain('idx_tasks_completed');
      expect(indexNames).toContain('idx_tasks_priority');
      expect(indexNames).toContain('idx_tasks_due_date');
      expect(indexNames).toContain('idx_tasks_created_at');
    });

    it('should have sample data loaded', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);
      
      expect(response.body.tasks.length).toBeGreaterThan(0);
      
      // Check that sample tasks exist
      const taskTitles = response.body.tasks.map(task => task.title);
      expect(taskTitles).toContain('Complete project documentation');
      expect(taskTitles).toContain('Review code changes');
    });
  });

  describe('Database Prepared Statements', () => {
    it('should have all required prepared statements available', () => {
      expect(statements.getAllTasks).toBeDefined();
      expect(statements.getTaskById).toBeDefined();
      expect(statements.insertTask).toBeDefined();
      expect(statements.updateTask).toBeDefined();
      expect(statements.toggleTaskCompletion).toBeDefined();
      expect(statements.deleteTask).toBeDefined();
    });

    it('should execute getAllTasks statement correctly', () => {
      const tasks = statements.getAllTasks.all();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      // Verify task structure
      const task = tasks[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('priority');
    });

    it('should execute getTaskById statement correctly', async () => {
      // First get a task ID
      const allTasks = statements.getAllTasks.all();
      const existingTaskId = allTasks[0].id;
      
      const task = statements.getTaskById.get(existingTaskId);
      expect(task).toBeDefined();
      expect(task.id).toBe(existingTaskId);
    });

    it('should execute insertTask statement correctly', () => {
      const beforeCount = statements.getAllTasks.all().length;
      
      const result = statements.insertTask.run(
        'Database Test Task',
        'Testing database insertion',
        'medium',
        '2026-03-20 15:00:00'
      );
      
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);
      
      const afterCount = statements.getAllTasks.all().length;
      expect(afterCount).toBe(beforeCount + 1);
      
      // Verify the inserted task
      const insertedTask = statements.getTaskById.get(result.lastInsertRowid);
      expect(insertedTask.title).toBe('Database Test Task');
      expect(insertedTask.description).toBe('Testing database insertion');
      expect(insertedTask.priority).toBe('medium');
    });

    it('should execute updateTask statement correctly', () => {
      // First create a task
      const insertResult = statements.insertTask.run(
        'Task to Update',
        'Original description',
        'low',
        null
      );
      const taskId = insertResult.lastInsertRowid;
      
      // Then update it
      const updateResult = statements.updateTask.run(
        'Updated Task Title',
        'Updated description',
        'high',
        '2026-03-25 12:00:00',
        taskId
      );
      
      expect(updateResult.changes).toBe(1);
      
      // Verify the update
      const updatedTask = statements.getTaskById.get(taskId);
      expect(updatedTask.title).toBe('Updated Task Title');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.due_date).toBe('2026-03-25 12:00:00');
    });

    it('should execute toggleTaskCompletion statement correctly', () => {
      // First create a task
      const insertResult = statements.insertTask.run(
        'Task to Toggle',
        null,
        'medium',
        null
      );
      const taskId = insertResult.lastInsertRowid;
      
      // Get initial completed state
      const initialTask = statements.getTaskById.get(taskId);
      expect(initialTask.completed).toBe(0);
      
      // Toggle to completed
      const toggleResult = statements.toggleTaskCompletion.run(1, taskId);
      expect(toggleResult.changes).toBe(1);
      
      const toggledTask = statements.getTaskById.get(taskId);
      expect(toggledTask.completed).toBe(1);
      
      // Toggle back
      statements.toggleTaskCompletion.run(0, taskId);
      const toggledBackTask = statements.getTaskById.get(taskId);
      expect(toggledBackTask.completed).toBe(0);
    });

    it('should execute deleteTask statement correctly', () => {
      // First create a task
      const insertResult = statements.insertTask.run(
        'Task to Delete',
        null,
        'medium',
        null
      );
      const taskId = insertResult.lastInsertRowid;
      
      // Verify it exists
      const taskBeforeDelete = statements.getTaskById.get(taskId);
      expect(taskBeforeDelete).toBeDefined();
      
      // Delete it
      const deleteResult = statements.deleteTask.run(taskId);
      expect(deleteResult.changes).toBe(1);
      
      // Verify it's gone
      const taskAfterDelete = statements.getTaskById.get(taskId);
      expect(taskAfterDelete).toBeUndefined();
    });
  });

  describe('Database Constraints and Types', () => {
    it('should enforce NOT NULL constraint on title', () => {
      expect(() => {
        db.prepare('INSERT INTO tasks (title) VALUES (?)').run(null);
      }).toThrow();
    });

    it('should enforce priority CHECK constraint', () => {
      expect(() => {
        db.prepare('INSERT INTO tasks (title, priority) VALUES (?, ?)').run('Test', 'invalid');
      }).toThrow();
    });

    it('should allow valid priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      validPriorities.forEach(priority => {
        expect(() => {
          const result = db.prepare('INSERT INTO tasks (title, priority) VALUES (?, ?)').run(
            `Test ${priority} priority`,
            priority
          );
          expect(result.changes).toBe(1);
        }).not.toThrow();
      });
    });

    it('should default completed to 0 (false)', () => {
      const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run('Default Completed Test');
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      expect(task.completed).toBe(0);
    });

    it('should default priority to medium', () => {
      const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run('Default Priority Test');
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      expect(task.priority).toBe('medium');
    });

    it('should auto-populate created_at and updated_at', () => {
      const beforeTime = new Date().toISOString();
      const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run('Timestamp Test');
      const afterTime = new Date().toISOString();
      
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      expect(task.created_at).toBeDefined();
      expect(task.updated_at).toBeDefined();
      
      // Check that timestamps are reasonable (within our test timeframe)
      expect(task.created_at >= beforeTime.slice(0, 19)).toBe(true);
      expect(task.created_at <= afterTime.slice(0, 19)).toBe(true);
    });

    it('should update updated_at when using UPDATE', async () => {
      // Create a task
      const insertResult = db.prepare('INSERT INTO tasks (title) VALUES (?)').run('Update Timestamp Test');
      const taskId = insertResult.lastInsertRowid;
      const originalTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update the task
      db.prepare('UPDATE tasks SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('Updated Title', taskId);
      
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      expect(updatedTask.updated_at).not.toBe(originalTask.updated_at);
      expect(updatedTask.created_at).toBe(originalTask.created_at); // Should remain the same
    });
  });

  describe('Database Performance', () => {
    it('should handle multiple operations efficiently', () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        const result = statements.insertTask.run(
          `Performance Test Task ${i}`,
          `Description ${i}`,
          i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          null
        );
        statements.getTaskById.get(result.lastInsertRowid);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 200 operations (100 inserts + 100 selects) in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should benefit from indexes on filtered queries', () => {
      // This test verifies that indexed queries perform well
      const startTime = Date.now();
      
      // Query using indexed fields
      db.prepare('SELECT * FROM tasks WHERE completed = ? AND priority = ?').all(0, 'high');
      db.prepare('SELECT * FROM tasks WHERE due_date IS NOT NULL ORDER BY due_date').all();
      db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10').all();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Indexed queries should be fast
      expect(duration).toBeLessThan(100); // Less than 100ms
    });
  });

  describe('Database Transaction Safety', () => {
    it('should maintain data integrity during concurrent operations', () => {
      const initialCount = statements.getAllTasks.all().length;
      
      // Simulate concurrent operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(() => {
          const result = statements.insertTask.run(
            `Concurrent Task ${i}`,
            null,
            'medium',
            null
          );
          return result.lastInsertRowid;
        });
      }
      
      // Execute operations
      const insertedIds = operations.map(op => op());
      
      // Verify all tasks were inserted
      const finalCount = statements.getAllTasks.all().length;
      expect(finalCount).toBe(initialCount + 10);
      
      // Verify all inserted tasks exist and have correct data
      insertedIds.forEach((id, index) => {
        const task = statements.getTaskById.get(id);
        expect(task).toBeDefined();
        expect(task.title).toBe(`Concurrent Task ${index}`);
      });
    });

    it('should handle database errors gracefully', () => {
      // Attempt to insert invalid data
      expect(() => {
        db.prepare('INSERT INTO tasks (title, priority) VALUES (?, ?)').run('Test', 'invalid_priority');
      }).toThrow();
      
      // Database should still be functional
      const result = statements.insertTask.run('Recovery Test', null, 'medium', null);
      expect(result.changes).toBe(1);
      
      const task = statements.getTaskById.get(result.lastInsertRowid);
      expect(task.title).toBe('Recovery Test');
    });
  });
});