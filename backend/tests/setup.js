// Test setup configuration
const { PrismaClient } = require('@prisma/client');

// Use test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/cortexia_test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';

const prisma = new PrismaClient();

// Global setup
beforeAll(async () => {
  console.log('Setting up test database...');
  // Run migrations
  // exec('npx prisma migrate deploy');
});

// Global teardown
afterAll(async () => {
  console.log('Cleaning up test database...');
  await prisma.$disconnect();
});

// Helper function to cleanup test data
global.cleanupTestData = async () => {
  await prisma.intervensi.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.jalurBelajar.deleteMany();
  await prisma.asesmen.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.orangTua.deleteMany();
  await prisma.guru.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();
};

module.exports = {
  prisma
};
