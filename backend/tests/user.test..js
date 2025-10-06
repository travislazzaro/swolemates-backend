// tests/user.test.js
const request = require('supertest');
const app = require('../server');
const { connect, closeDatabase, clearDatabase } = require('./setup');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('User Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        age: 25,
        experience: 'Beginner',
        goals: ['Build Muscle'],
        schedule: 'Morning',
        gym: 'Test Gym',
        bio: 'Test bio'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should login existing user', async () => {
    // First register
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        age: 25,
        experience: 'Beginner',
        goals: ['Build Muscle'],
        schedule: 'Morning',
        gym: 'Test Gym',
        bio: 'Test bio'
      });

    // Then login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
