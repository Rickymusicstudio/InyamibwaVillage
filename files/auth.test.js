const request = require('supertest');
const app = require('../app');
require('dotenv').config();

describe('Auth Routes', () => {
  it('should fail login with invalid credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      national_id: 'invalid_id',
      password: 'wrongpassword'
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  // Add more tests if sample credentials available
});
