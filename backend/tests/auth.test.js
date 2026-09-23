const request = require('supertest');
const { app } = require('../src/app');
const { prisma } = require('../src/config/database.config');

describe('Authentication Endpoints', () => {
  // Clean up database before tests
  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  // Clean up after tests
  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    });
    
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student user', async () => {
      const userData = {
        email: 'test_student@example.com',
        username: 'test_student',
        password: 'TestPass123',
        role: 'siswa',
        profile: {
          namaLengkap: 'Test Student',
          tanggalLahir: '2010-01-01',
          jenisKelamin: 'Laki-laki',
          kelas: '5A',
          sekolah: 'SD Test',
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'test_student@example.com', // Same as above
        username: 'test_student2',
        password: 'TestPass123',
        role: 'siswa',
        profile: {
          namaLengkap: 'Test Student 2',
          tanggalLahir: '2010-01-01',
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'test2',
        password: '123', // Too short
        role: 'siswa',
        profile: {
          namaLengkap: 'Test User',
          tanggalLahir: '2010-01-01',
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'test3',
        password: 'TestPass123',
        role: 'siswa',
        profile: {
          namaLengkap: 'Test User',
          tanggalLahir: '2010-01-01',
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        emailOrUsername: 'test_student@example.com',
        password: 'TestPass123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should login with username', async () => {
      const loginData = {
        emailOrUsername: 'test_student',
        password: 'TestPass123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with wrong password', async () => {
      const loginData = {
        emailOrUsername: 'test_student@example.com',
        password: 'WrongPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const loginData = {
        emailOrUsername: 'nonexistent@example.com',
        password: 'TestPass123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'test_student@example.com',
          password: 'TestPass123',
        });

      accessToken = response.body.data.accessToken;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('role');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'test_student@example.com',
          password: 'TestPass123',
        });

      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/check-availability', () => {
    it('should check email availability', async () => {
      const response = await request(app)
        .post('/api/auth/check-availability')
        .send({ email: 'available@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailAvailable).toBe(true);
    });

    it('should detect taken email', async () => {
      const response = await request(app)
        .post('/api/auth/check-availability')
        .send({ email: 'test_student@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailAvailable).toBe(false);
    });

    it('should check username availability', async () => {
      const response = await request(app)
        .post('/api/auth/check-availability')
        .send({ username: 'available_username' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usernameAvailable).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'test_student@example.com',
          password: 'TestPass123',
        });

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail to use logged out refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
