const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const jwt = require('../src/utils/jwt');

const prisma = new PrismaClient();

describe('Teacher API Tests', () => {
  let teacherToken;
  let teacherId;
  let classId;
  let studentId;

  beforeAll(async () => {
    // Create test teacher
    const teacher = await prisma.user.create({
      data: {
        username: 'test_teacher',
        email: 'teacher_test@cortexia.id',
        passwordHash: 'hashed_password',
        role: 'TEACHER',
        guru: {
          create: {
            nomorInduk: 'GTR001',
            namaLengkap: 'Test Teacher',
            spesialisasi: 'Reading Specialist'
          }
        }
      },
      include: { guru: true }
    });

    teacherId = teacher.id;
    teacherToken = jwt.generateAccessToken({ userId: teacher.id, role: 'TEACHER' });

    // Create test class
    const testClass = await prisma.kelas.create({
      data: {
        namaKelas: 'Test Class 3A',
        tingkat: 3,
        guruId: teacher.guru.id
      }
    });
    classId = testClass.id;

    // Create test student
    const student = await prisma.user.create({
      data: {
        username: 'test_student',
        email: 'student_test@cortexia.id',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
        siswa: {
          create: {
            namaLengkap: 'Test Student',
            tanggalLahir: new Date('2015-01-01'),
            kelasId: testClass.id
          }
        }
      },
      include: { siswa: true }
    });
    studentId = student.siswa.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.siswa.deleteMany({ where: { userId: { in: [studentId] } } });
    await prisma.guru.deleteMany({ where: { userId: teacherId } });
    await prisma.kelas.deleteMany({ where: { id: classId } });
    await prisma.user.deleteMany({ where: { id: { in: [teacherId] } } });
    await prisma.$disconnect();
  });

  describe('GET /api/teacher/dashboard', () => {
    it('should return teacher dashboard data', async () => {
      const response = await request(app)
        .get('/api/teacher/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('classes');
      expect(response.body.data).toHaveProperty('pendingInterventions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/teacher/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/teacher/classes', () => {
    it('should return teacher classes', async () => {
      const response = await request(app)
        .get('/api/teacher/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/teacher/classes/:classId', () => {
    it('should return class details', async () => {
      const response = await request(app)
        .get(`/api/teacher/classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('namaKelas');
      expect(response.body.data).toHaveProperty('tingkat');
      expect(response.body.data).toHaveProperty('siswa');
    });

    it('should return 404 for non-existent class', async () => {
      const response = await request(app)
        .get('/api/teacher/classes/99999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/teacher/students/:studentId', () => {
    it('should return student details', async () => {
      const response = await request(app)
        .get(`/api/teacher/students/${studentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('namaLengkap');
      expect(response.body.data).toHaveProperty('kelas');
    });
  });

  describe('POST /api/teacher/interventions', () => {
    it('should create intervention successfully', async () => {
      const interventionData = {
        studentId: studentId,
        type: 'TARGETED_PRACTICE',
        description: 'Extra reading practice',
        scheduledDate: new Date().toISOString(),
        duration: 30
      };

      const response = await request(app)
        .post('/api/teacher/interventions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(interventionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'TARGETED_PRACTICE');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/teacher/interventions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/teacher/feedback', () => {
    it('should create feedback successfully', async () => {
      const feedbackData = {
        studentId: studentId,
        type: 'PROGRESS',
        message: 'Great improvement!',
        visibility: 'PUBLIC'
      };

      const response = await request(app)
        .post('/api/teacher/feedback')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(feedbackData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('PATCH /api/teacher/interventions/:interventionId', () => {
    let interventionId;

    beforeAll(async () => {
      const intervention = await prisma.intervensi.create({
        data: {
          siswaId: studentId,
          type: 'TARGETED_PRACTICE',
          description: 'Test intervention',
          status: 'SCHEDULED',
          tanggalTerjadwal: new Date(),
          durasi: 30
        }
      });
      interventionId = intervention.id;
    });

    it('should update intervention status', async () => {
      const response = await request(app)
        .patch(`/api/teacher/interventions/${interventionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'COMPLETED', effectiveness: 4 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });
});
