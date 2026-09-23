const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const jwt = require('../src/utils/jwt');

const prisma = new PrismaClient();

describe('Admin API Tests', () => {
  let adminToken;
  let adminId;
  let testUserId;

  beforeAll(async () => {
    // Create test admin
    const admin = await prisma.user.create({
      data: {
        username: 'test_admin',
        email: 'admin_test@cortexia.id',
        passwordHash: 'hashed_password',
        role: 'ADMIN'
      }
    });

    adminId = admin.id;
    adminToken = jwt.generateAccessToken({ userId: admin.id, role: 'ADMIN' });
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return admin dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('userStats');
      expect(response.body.data).toHaveProperty('recentActivities');
    });

    it('should require admin role', async () => {
      const userToken = jwt.generateAccessToken({ userId: 999, role: 'STUDENT' });
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated user list', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(user => user.role === 'ADMIN')).toBe(true);
    });

    it('should search by query', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create new user successfully', async () => {
      const userData = {
        username: 'new_test_user',
        email: 'newuser_test@cortexia.id',
        password: 'Test123!',
        role: 'STUDENT',
        namaLengkap: 'New Test User',
        tanggalLahir: '2015-01-01',
        classId: null
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('username', 'new_test_user');
      
      testUserId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'incomplete' });

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate email', async () => {
      const userData = {
        username: 'duplicate_user',
        email: 'admin_test@cortexia.id', // Already exists
        password: 'Test123!',
        role: 'STUDENT'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/users/:userId', () => {
    it('should update user successfully', async () => {
      if (!testUserId) {
        // Create user if not exists
        const user = await prisma.user.create({
          data: {
            username: 'update_test',
            email: 'update_test@cortexia.id',
            passwordHash: 'hash',
            role: 'STUDENT'
          }
        });
        testUserId = user.id;
      }

      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'updated_test@cortexia.id' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/admin/users/:userId/status', () => {
    it('should toggle user status', async () => {
      if (!testUserId) return;

      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    it('should prevent deleting admin users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('admin');
    });

    it('should delete non-admin user successfully', async () => {
      if (!testUserId) return;

      const response = await request(app)
        .delete(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      testUserId = null; // Mark as deleted
    });
  });

  describe('GET /api/admin/statistics', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/admin/statistics?period=30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('assessmentStats');
      expect(response.body.data).toHaveProperty('userGrowth');
    });
  });

  describe('GET /api/admin/health', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
    });
  });

  describe('POST /api/admin/users/bulk-import', () => {
    it('should import multiple users', async () => {
      const users = [
        {
          username: 'bulk1',
          email: 'bulk1@test.com',
          password: 'Test123!',
          role: 'STUDENT'
        },
        {
          username: 'bulk2',
          email: 'bulk2@test.com',
          password: 'Test123!',
          role: 'STUDENT'
        }
      ];

      const response = await request(app)
        .post('/api/admin/users/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data.successful).toBeGreaterThan(0);

      // Cleanup
      await prisma.user.deleteMany({
        where: { username: { in: ['bulk1', 'bulk2'] } }
      });
    });

    it('should handle errors in bulk import', async () => {
      const users = [
        {
          username: 'invalid',
          email: 'invalid', // Invalid email
          password: 'weak', // Weak password
          role: 'STUDENT'
        }
      ];

      const response = await request(app)
        .post('/api/admin/users/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users });

      expect(response.status).toBe(200);
      expect(response.body.data.failed).toBeGreaterThan(0);
    });
  });
});
