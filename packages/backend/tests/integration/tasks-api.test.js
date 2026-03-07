const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Tasks API Integration', () => {
  let createdTaskId;

  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks with proper structure', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);

      // Verify task structure
      const task = response.body.tasks[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('created_at');
      expect(task).toHaveProperty('updated_at');
    });

    it('should return tasks ordered by created_at DESC by default', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      const tasks = response.body.tasks;
      if (tasks.length > 1) {
        for (let i = 0; i < tasks.length - 1; i++) {
          const current = new Date(tasks[i].created_at);
          const next = new Date(tasks[i + 1].created_at);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with minimal required data', async () => {
      const newTask = {
        title: 'Test Task for Integration'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.priority).toBe('medium'); // Default priority
      expect(response.body.completed).toBe(0); // Default completed state
      expect(response.body.description).toBeNull();
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      createdTaskId = response.body.id;
    });

    it('should create a new task with complete data', async () => {
      const newTask = {
        title: 'Complete Integration Test Task',
        description: 'This task tests the complete task creation flow',
        priority: 'high',
        due_date: '2026-03-15 14:00:00'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.priority).toBe(newTask.priority);
      expect(response.body.due_date).toBe(newTask.due_date);
      expect(response.body.completed).toBe(0);
    });

    it('should trim whitespace from title and description', async () => {
      const newTask = {
        title: '  Whitespace Test Task  ',
        description: '  Testing whitespace trimming  '
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.title).toBe('Whitespace Test Task');
      expect(response.body.description).toBe('Testing whitespace trimming');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should retrieve a specific task by ID', async () => {
      // First create a task to retrieve
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Retrieve' })
        .expect(201);

      const taskId = createResponse.body.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('Task to Retrieve');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task completely', async () => {
      // First create a task to update
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Update' })
        .expect(201);

      const taskId = createResponse.body.id;
      const originalUpdatedAt = createResponse.body.updated_at;

      // Wait a moment to ensure updated_at changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 'low',
        due_date: '2026-03-20 10:00:00'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.due_date).toBe(updateData.due_date);
      expect(response.body.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should partially update task fields', async () => {
      // Create a task with full data
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Title',
          description: 'Original Description',
          priority: 'medium'
        })
        .expect(201);

      const taskId = createResponse.body.id;

      // Update only title
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'New Title Only' })
        .expect(200);

      expect(response.body.title).toBe('New Title Only');
      expect(response.body.description).toBe('Original Description'); // Should remain unchanged
      expect(response.body.priority).toBe('medium'); // Should remain unchanged
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    it('should toggle task completion status', async () => {
      // Create a new task (default completed = 0)
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Toggle' })
        .expect(201);

      const taskId = createResponse.body.id;
      expect(createResponse.body.completed).toBe(0);

      // Toggle to completed
      const toggleResponse1 = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(toggleResponse1.body.id).toBe(taskId);
      expect(toggleResponse1.body.completed).toBe(1);

      // Toggle back to incomplete
      const toggleResponse2 = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(200);

      expect(toggleResponse2.body.completed).toBe(0);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      // Create a task to delete
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Delete' })
        .expect(201);

      const taskId = createResponse.body.id;

      // Delete the task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Task deleted successfully');
      expect(deleteResponse.body.id).toBe(taskId);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });
  });

  describe('End-to-end task workflow', () => {
    it('should complete a full CRUD workflow successfully', async () => {
      // 1. Create a task
      const createData = {
        title: 'E2E Test Task',
        description: 'Testing complete workflow',
        priority: 'high',
        due_date: '2026-03-25 16:00:00'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(createData)
        .expect(201);

      const taskId = createResponse.body.id;

      // 2. Retrieve the task
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body.title).toBe(createData.title);

      // 3. Update the task
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'Updated E2E Task', priority: 'medium' })
        .expect(200);

      expect(updateResponse.body.title).toBe('Updated E2E Task');
      expect(updateResponse.body.priority).toBe('medium');

      // 4. Toggle completion
      const toggleResponse = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(200);

      expect(toggleResponse.body.completed).toBe(1);

      // 5. Verify in task list
      const listResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      const task = listResponse.body.tasks.find(t => t.id === taskId);
      expect(task.completed).toBe(1);
      expect(task.title).toBe('Updated E2E Task');

      // 6. Delete the task
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      // 7. Verify deletion
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });
  });
});