const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('API Integration Tests', () => {
  let studentUser, teacherUser, parentUser, adminUser;
  let studentToken, teacherToken, parentToken, adminToken;
  let classId, studentId;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    // Create admin
    adminUser = await prisma.user.create({
      data: {
        username: 'admin_integration',
        email: 'admin_integration@cortexia.id',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });

    // Create teacher with profile
    teacherUser = await prisma.user.create({
      data: {
        username: 'teacher_integration',
        email: 'teacher_integration@cortexia.id',
        passwordHash: hashedPassword,
        role: 'TEACHER',
        isActive: true,
        guru: {
          create: {
            nomorInduk: 'GTR_INT_001',
            namaLengkap: 'Integration Teacher',
            spesialisasi: 'Reading Specialist'
          }
        }
      },
      include: { guru: true }
    });

    // Create class
    const testClass = await prisma.kelas.create({
      data: {
        namaKelas: 'Integration Test Class',
        tingkat: 3,
        guruId: teacherUser.guru.id
      }
    });
    classId = testClass.id;

    // Create student with profile
    studentUser = await prisma.user.create({
      data: {
        username: 'student_integration',
        email: 'student_integration@cortexia.id',
        passwordHash: hashedPassword,
        role: 'STUDENT',
        isActive: true,
        siswa: {
          create: {
            namaLengkap: 'Integration Student',
            tanggalLahir: new Date('2015-01-01'),
            kelasId: classId
          }
        }
      },
      include: { siswa: true }
    });
    studentId = studentUser.siswa.id;

    // Create parent with profile
    parentUser = await prisma.user.create({
      data: {
        username: 'parent_integration',
        email: 'parent_integration@cortexia.id',
        passwordHash: hashedPassword,
        role: 'PARENT',
        isActive: true,
        orangTua: {
          create: {
            namaLengkap: 'Integration Parent',
            hubungan: 'IBU',
            nomorTelepon: '081234567890'
          }
        }
      },
      include: { orangTua: true }
    });

    // Create parent-student relationship
    await prisma.orangTuaSiswa.create({
      data: {
        orangTuaId: parentUser.orangTua.id,
        siswaId: studentId
      }
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_integration@cortexia.id', password: 'Test123!' });
    adminToken = adminLogin.body.data.accessToken;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher_integration@cortexia.id', password: 'Test123!' });
    teacherToken = teacherLogin.body.data.accessToken;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student_integration@cortexia.id', password: 'Test123!' });
    studentToken = studentLogin.body.data.accessToken;

    const parentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent_integration@cortexia.id', password: 'Test123!' });
    parentToken = parentLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup in correct order
    await prisma.orangTuaSiswa.deleteMany({});
    await prisma.siswa.deleteMany({});
    await prisma.orangTua.deleteMany({});
    await prisma.guru.deleteMany({});
    await prisma.kelas.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Complete Assessment Workflow', () => {
    let assessmentId;

    it('should create assessment as student', async () => {
      const assessmentData = {
        readingText: 'Sample reading text for integration test.',
        expectedDuration: 60
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(assessmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      assessmentId = response.body.data.id;
    });

    it('should submit assessment data', async () => {
      const gazeData = {
        gazePoints: [
          { x: 100, y: 200, timestamp: 0, confidence: 0.9 }
        ],
        fixations: [
          { x: 100, y: 200, duration: 200, timestamp: 0, wordIndex: 0 }
        ],
        wordData: [
          { wordIndex: 0, wordText: 'sample', fixationCount: 2, totalDuration: 400, regressionCount: 0, skipped: false }
        ],
        sessionDuration: 30000
      };

      const speechData = {
        transcript: 'Sample reading text',
        confidence: 0.85,
        pronunciation: [
          { word: 'sample', accuracy: 0.9, errorType: 'correct' }
        ],
        fluencyMetrics: {
          wpm: 120,
          cwpm: 102,
          accuracy: 0.85,
          fluencyScore: 0.80
        }
      };

      const response = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ gazeData, speechData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow teacher to view student assessment', async () => {
      const response = await request(app)
        .get(`/api/teacher/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow parent to view child assessment', async () => {
      const response = await request(app)
        .get(`/api/parent/children/${studentId}/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Learning Path Workflow', () => {
    it('should generate learning path after assessment', async () => {
      const assessmentResult = {
        overallDifficulty: 'MILD',
        skillAssessments: [
          { skill: 'DECODING', score: 0.7, difficulty: 'MILD' },
          { skill: 'FLUENCY', score: 0.65, difficulty: 'MODERATE' }
        ]
      };

      const response = await request(app)
        .post(`/api/learning-paths`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ studentId, assessmentResult });

      expect(response.status).toBe(201);
    });

    it('should allow teacher to view learning path', async () => {
      const response = await request(app)
        .get(`/api/teacher/students/${studentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('jalurBelajar');
    });
  });

  describe('Intervention Workflow', () => {
    let interventionId;

    it('should allow teacher to create intervention', async () => {
      const interventionData = {
        studentId,
        type: 'TARGETED_PRACTICE',
        description: 'Extra reading practice for fluency',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 30
      };

      const response = await request(app)
        .post('/api/teacher/interventions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(interventionData);

      expect(response.status).toBe(201);
      interventionId = response.body.data.id;
    });

    it('should allow parent to view upcoming interventions', async () => {
      const response = await request(app)
        .get(`/api/parent/children/${studentId}/interventions`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow teacher to update intervention status', async () => {
      const response = await request(app)
        .patch(`/api/teacher/interventions/${interventionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'COMPLETED', effectiveness: 4, notes: 'Good progress' });

      expect(response.status).toBe(200);
    });
  });

  describe('Feedback Workflow', () => {
    it('should allow teacher to provide feedback', async () => {
      const feedbackData = {
        studentId,
        type: 'PROGRESS',
        message: 'Great improvement in reading fluency!',
        visibility: 'PUBLIC'
      };

      const response = await request(app)
        .post('/api/teacher/feedback')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(feedbackData);

      expect(response.status).toBe(201);
    });

    it('should allow parent to view feedback', async () => {
      const response = await request(app)
        .get(`/api/parent/children/${studentId}/feedback`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Admin Management Workflow', () => {
    it('should allow admin to view all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should allow admin to view system statistics', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('assessmentStats');
    });

    it('should allow admin to view system health', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.database).toBe('connected');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should prevent student from accessing teacher routes', async () => {
      const response = await request(app)
        .get('/api/teacher/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('should prevent parent from accessing admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(403);
    });

    it('should prevent teacher from accessing admin routes', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ username: 'test', email: 'test@test.com' });

      expect(response.status).toBe(403);
    });
  });
});
