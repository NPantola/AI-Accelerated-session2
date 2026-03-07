const request = require('supertest');
const { app, db } = require('../../src/app');

describe('Health Check API', () => {
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
  });
});