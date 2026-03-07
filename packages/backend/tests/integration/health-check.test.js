const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Health Check Integration', () => {
  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('GET /', () => {
    it('should return server status successfully', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        message: 'Todo API server is running'
      });
    });

    it('should respond quickly (under 100ms)', async () => {
      const start = Date.now();
      await request(app).get('/').expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});