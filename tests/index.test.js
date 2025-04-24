const request = require('supertest');
const app = require('../app'); // Adjust the path as necessary

describe('API Endpoints', () => {
    test('GET /api/example', async () => {
        const response = await request(app).get('/api/example');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    test('POST /api/example', async () => {
        const response = await request(app).post('/api/example').send({ name: 'Test' });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Created');
    });
});