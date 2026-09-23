# Admin Dashboard Guide

## Overview

Admin Dashboard adalah interface untuk administrator sistem CORTEXIA. Dashboard ini memberikan kontrol penuh atas user management, class management, system monitoring, dan reporting.

---

## Features

### 1. Dashboard Overview
- Total users by role (STUDENT, TEACHER, PARENT, ADMIN)
- Active users (last 30 days)
- Total classes dan assessments
- Active learning paths
- Difficulty distribution
- Recent system activities

### 2. User Management
**CRUD Operations:**
- List all users dengan filter (role, search, pagination)
- View user details dengan role-specific profiles
- Create new users (dengan role-specific data)
- Update user information
- Toggle user status (activate/deactivate)
- Delete users (except admins)
- Bulk import users dari CSV/JSON

**User Roles:**
- STUDENT: Dengan student profile dan class assignment
- TEACHER: Dengan teacher profile dan class assignments
- PARENT: Dengan parent profile dan children links
- ADMIN: System administrator

### 3. Class Management
- List all classes dengan teacher dan student count
- Create new class dengan teacher assignment
- Update class information
- Delete class (only if empty)
- View class details dengan students

### 4. System Monitoring
- System health check (database, uptime, memory)
- Activity logs (user logins, system events)
- Performance metrics
- Real-time statistics

### 5. Statistics & Reports
**System-wide Statistics:**
- Assessment statistics by difficulty level
- Daily assessment counts (time series)
- User growth over time
- Intervention statistics by type dan status
- Top performing students

---

## API Endpoints

### Dashboard & Overview

#### GET /api/admin/dashboard
Get comprehensive admin dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "activeUsers": 120,
      "totalClasses": 10,
      "totalAssessments": 450,
      "recentAssessments": 45,
      "activeLearningPaths": 100
    },
    "userStats": {
      "STUDENT": 100,
      "TEACHER": 20,
      "PARENT": 25,
      "ADMIN": 5
    },
    "difficultyDistribution": {
      "NONE": 60,
      "MILD": 25,
      "MODERATE": 10,
      "SEVERE": 5
    },
    "recentActivities": [...]
  }
}
```

#### GET /api/admin/statistics?period=30
Get system statistics untuk periode tertentu.

**Response includes:**
- Assessment statistics by difficulty
- Daily assessment counts (time series)
- User growth data
- Intervention statistics
- Top performing students

### User Management

#### GET /api/admin/users?role=STUDENT&search=ahmad&page=1&limit=50
List users dengan filters dan pagination.

#### GET /api/admin/users/:userId
Get detailed user information termasuk role-specific profiles.

#### POST /api/admin/users
Create new user.

**Request Body:**
```json
{
  "username": "newstudent",
  "email": "student@example.com",
  "password": "SecurePass123",
  "fullName": "New Student",
  "role": "STUDENT",
  "profileData": {
    "classId": 1
  }
}
```

#### PATCH /api/admin/users/:userId
Update user information.

#### PATCH /api/admin/users/:userId/status
Toggle user active status.

**Request Body:**
```json
{
  "isActive": false
}
```

#### DELETE /api/admin/users/:userId
Delete user (cannot delete admins).

#### POST /api/admin/users/bulk-import
Bulk import users.

**Request Body:**
```json
{
  "users": [
    {
      "username": "student1",
      "email": "student1@example.com",
      "password": "Pass123",
      "fullName": "Student One",
      "role": "STUDENT"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": 45,
    "failed": 5,
    "errors": [
      {
        "email": "duplicate@example.com",
        "error": "User already exists"
      }
    ]
  }
}
```

### Class Management

#### GET /api/admin/classes
List all classes dengan teacher info dan student count.

#### POST /api/admin/classes
Create new class.

**Request Body:**
```json
{
  "name": "Kelas 1A",
  "grade": "1",
  "teacherId": 2,
  "academicYear": "2024/2025",
  "description": "Kelas untuk siswa kelas 1"
}
```

#### PATCH /api/admin/classes/:classId
Update class information.

#### DELETE /api/admin/classes/:classId
Delete class (only if no students).

### System Monitoring

#### GET /api/admin/logs?level=ERROR&limit=100
Get system logs dengan filter.

#### GET /api/admin/health
Check system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-20T10:00:00Z",
    "database": {
      "status": "connected",
      "users": 150,
      "assessments": 450,
      "learningPaths": 100
    },
    "uptime": 86400,
    "memory": {
      "rss": 54321,
      "heapTotal": 12345,
      "heapUsed": 9876
    }
  }
}
```

---

## Security Best Practices

### Access Control
✅ All admin routes require ADMIN role
✅ JWT authentication dengan token verification
✅ Role-based access control (RBAC)
✅ Admin actions logged untuk audit

### Password Security
✅ Passwords hashed dengan bcrypt (12 rounds)
✅ Default passwords untuk bulk import harus diubah
✅ Password complexity requirements enforced

### Data Protection
✅ Sensitive data (passwords) never returned in responses
✅ User deletion restricted (cannot delete admins)
✅ Class deletion only allowed if empty
✅ Audit logging untuk important actions

### Input Validation
✅ All inputs validated dengan express-validator
✅ Email normalization
✅ SQL injection protection (Prisma ORM)
✅ XSS protection (input sanitization)

---

## Common Operations

### 1. Create New Student
```bash
POST /api/admin/users
{
  "username": "ahmad123",
  "email": "ahmad@student.com",
  "password": "SecurePass123",
  "fullName": "Ahmad Rizki",
  "role": "STUDENT",
  "profileData": {
    "classId": 1
  }
}
```

### 2. Create New Teacher
```bash
POST /api/admin/users
{
  "username": "sarah_teacher",
  "email": "sarah@teacher.com",
  "password": "SecurePass123",
  "fullName": "Ibu Sarah",
  "role": "TEACHER",
  "profileData": {
    "specialization": "Reading Education",
    "yearsOfExperience": 10
  }
}
```

### 3. Create New Class
```bash
POST /api/admin/classes
{
  "name": "Kelas 1A",
  "grade": "1",
  "teacherId": 2,
  "academicYear": "2024/2025",
  "description": "Kelas untuk siswa tahun pertama"
}
```

### 4. Deactivate User
```bash
PATCH /api/admin/users/10/status
{
  "isActive": false
}
```

### 5. Bulk Import Students
```bash
POST /api/admin/users/bulk-import
{
  "users": [
    {"username": "student1", "email": "s1@school.com", "password": "Pass123", "fullName": "Student 1", "role": "STUDENT"},
    {"username": "student2", "email": "s2@school.com", "password": "Pass123", "fullName": "Student 2", "role": "STUDENT"}
  ]
}
```

---

## Troubleshooting

### Issue: Cannot delete user
**Possible Causes:**
- User is an admin (admins cannot be deleted)
- User has active data (assessments, learning paths)

**Solution:**
- For non-admins: Deactivate instead of delete
- For data cleanup: Manual database intervention required

### Issue: Cannot create duplicate user
**Cause:** Email atau username already exists

**Solution:** Check existing users with search feature

### Issue: Cannot delete class
**Cause:** Class has students assigned

**Solution:** 
1. Reassign students to other classes
2. Then delete the class

---

## Monitoring Checklist

### Daily
- [ ] Check system health status
- [ ] Review error logs
- [ ] Monitor active users
- [ ] Check recent assessments count

### Weekly
- [ ] Review user growth statistics
- [ ] Check intervention completion rates
- [ ] Monitor top performing students
- [ ] Review system resource usage

### Monthly
- [ ] Generate comprehensive reports
- [ ] Review difficulty distribution trends
- [ ] Analyze user engagement metrics
- [ ] Plan system maintenance

---

## Summary

Admin Dashboard provides:

✅ Complete user management (CRUD)  
✅ Class administration  
✅ System monitoring & health checks  
✅ Comprehensive statistics & reporting  
✅ Bulk operations support  
✅ Audit logging  
✅ Security controls  

**Production Ready:** Backend controllers, routes, validation ✓  
**API Documented:** 15+ endpoints dengan examples ✓  
**Security Hardened:** RBAC, validation, logging ✓  
**Scalable:** Pagination, filtering, bulk operations ✓  

Admin Dashboard complete dan ready untuk deployment!
