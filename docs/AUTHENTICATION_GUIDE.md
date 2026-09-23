# CORTEXIA Authentication Guide

## Overview

CORTEXIA menggunakan JWT (JSON Web Token) authentication dengan access dan refresh token untuk keamanan optimal.

## Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Server  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  1. POST /api/auth/register or login        │
     │  { email, password }                        │
     │─────────────────────────────────────────────>│
     │                                              │
     │                                              │ 2. Verify credentials
     │                                              │    Hash password
     │                                              │    Generate tokens
     │                                              │
     │  3. Return tokens                            │
     │  { accessToken, refreshToken, user }        │
     │<─────────────────────────────────────────────│
     │                                              │
     │  4. Store tokens                             │
     │     - accessToken in memory/state           │
     │     - refreshToken in httpOnly cookie       │
     │                                              │
     │  5. API Request                              │
     │  Authorization: Bearer {accessToken}         │
     │─────────────────────────────────────────────>│
     │                                              │
     │                                              │ 6. Verify JWT
     │                                              │
     │  7. Response with data                       │
     │<─────────────────────────────────────────────│
     │                                              │
     │  8. Access token expires (after 15 min)     │
     │                                              │
     │  9. POST /api/auth/refresh                   │
     │  { refreshToken }                            │
     │─────────────────────────────────────────────>│
     │                                              │
     │                                              │ 10. Verify refresh token
     │                                              │     Generate new tokens
     │                                              │
     │  11. New tokens                              │
     │  { accessToken, refreshToken }              │
     │<─────────────────────────────────────────────│
     │                                              │
```

---

## Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "student@example.com",
  "username": "student123",
  "password": "SecurePass123",
  "role": "siswa",
  "profile": {
    "namaLengkap": "John Doe",
    "tanggalLahir": "2010-05-15",
    "jenisKelamin": "Laki-laki",
    "kelas": "5A",
    "sekolah": "SD Negeri 1",
    "nomorInduk": "123456",
    "alamat": "Jl. Example No. 123",
    "nomorTelepon": "081234567890"
  }
}
```

**Role-Specific Profiles:**

**Siswa (Student):**
```json
{
  "profile": {
    "namaLengkap": "John Doe",
    "tanggalLahir": "2010-05-15",
    "jenisKelamin": "Laki-laki",
    "kelas": "5A",
    "sekolah": "SD Negeri 1",
    "nomorInduk": "123456",
    "alamat": "Jl. Example No. 123",
    "nomorTelepon": "081234567890",
    "orangTuaId": "uuid-of-parent",
    "guruId": "uuid-of-teacher"
  }
}
```

**Guru (Teacher):**
```json
{
  "profile": {
    "namaLengkap": "Jane Smith",
    "nip": "198501012010012001",
    "mataPelajaran": "Bahasa Indonesia",
    "sekolah": "SD Negeri 1",
    "nomorTelepon": "081234567890",
    "spesialisasi": "Reading Specialist"
  }
}
```

**Orang Tua (Parent):**
```json
{
  "profile": {
    "namaLengkap": "Bob Johnson",
    "hubunganDenganAnak": "ayah",
    "nomorTelepon": "081234567890",
    "pekerjaan": "Engineer",
    "alamat": "Jl. Example No. 123"
  }
}
```

**Admin:**
```json
{
  "profile": {
    "namaLengkap": "Admin User",
    "level": "super_admin",
    "permissions": {}
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "username": "student123",
      "role": "siswa",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "emailOrUsername": "student@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "username": "student123",
      "role": "siswa",
      "siswa": {
        "namaLengkap": "John Doe",
        "kelas": "5A"
      }
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "username": "student123",
      "role": "siswa",
      "siswa": {
        "namaLengkap": "John Doe",
        "tanggalLahir": "2010-05-15",
        "kelas": "5A",
        "sekolah": "SD Negeri 1"
      }
    }
  }
}
```

---

### 4. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### 5. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 6. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 7. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link will be sent"
}
```

---

### 8. Check Availability

**Endpoint:** `POST /api/auth/check-availability`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newusername"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Availability checked",
  "data": {
    "emailAvailable": true,
    "usernameAvailable": false
  }
}
```

---

## Client Implementation

### React Example

```typescript
// authService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async register(userData: RegisterData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    this.setTokens(response.data.data);
    return response.data;
  }

  async login(emailOrUsername: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      emailOrUsername,
      password,
    });
    this.setTokens(response.data.data);
    return response.data;
  }

  async logout() {
    const response = await axios.post(
      `${API_URL}/auth/logout`,
      { refreshToken: this.refreshToken },
      { headers: this.getAuthHeader() }
    );
    this.clearTokens();
    return response.data;
  }

  async refreshAccessToken() {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });
      this.setTokens(response.data.data);
      return response.data.data.accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser() {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data.user;
  }

  private setTokens(data: { accessToken: string; refreshToken: string }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refreshToken');
  }

  private getAuthHeader() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  getAccessToken() {
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }
}

export const authService = new AuthService();
```

### Axios Interceptor for Auto Token Refresh

```typescript
// axiosInstance.ts
import axios from 'axios';
import { authService } from './authService';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Request interceptor - add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authService.refreshAccessToken();
        
        // Retry original request with new token
        const token = authService.getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Security Best Practices

### 1. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Recommended: Special characters

### 2. Token Storage
- **Access Token**: Store in memory (React state/Redux)
- **Refresh Token**: Store in httpOnly cookie or secure localStorage
- **Never** store in regular localStorage for production

### 3. Token Expiration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- Implement automatic token refresh

### 4. Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour

### 5. HTTPS Only
- Always use HTTPS in production
- Set secure flags on cookies

### 6. CORS
- Configure allowed origins
- Never use `*` in production

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid token |
| `UNAUTHORIZED` | Invalid credentials |
| `FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AUTH_RATE_LIMIT_EXCEEDED` | Too many auth attempts |
| `EMAIL_ALREADY_EXISTS` | Email already registered |
| `USERNAME_TAKEN` | Username already taken |
| `TOKEN_EXPIRED` | Token has expired |
| `REFRESH_TOKEN_INVALID` | Invalid refresh token |

---

## Testing

Run authentication tests:
```bash
npm test tests/auth.test.js
```

---

## Troubleshooting

### Token keeps expiring
- Check system clock
- Verify JWT secret is consistent
- Ensure token expiration is set correctly

### Cannot login after registration
- Verify email is confirmed (if email verification enabled)
- Check account status is 'active'
- Verify database connections

### Refresh token not working
- Ensure refresh token exists in database
- Check expiration date
- Verify refresh token hasn't been used (single use)

---

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT debugger
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
