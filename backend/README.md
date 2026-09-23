# CORTEXIA Backend API

Backend server untuk sistem CORTEXIA - Multimodal AI-Based Reading Difficulty Profiling.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- MongoDB 5+ (optional, for analytics)
- Redis (for caching)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate Prisma Client**
```bash
npx prisma generate
```

4. **Run database migrations**
```bash
npx prisma migrate dev
```

5. **Start development server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models (Mongoose)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── app.js           # Main application file
├── prisma/
│   └── schema.prisma    # Prisma schema
├── tests/               # Test files
├── uploads/             # File uploads (gitignored)
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🗄️ Database

### PostgreSQL (Primary Database)
Menggunakan Prisma ORM untuk interaksi dengan PostgreSQL.

**Migrations:**
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

**Prisma Studio:**
```bash
npx prisma studio
```

### MongoDB (Analytics)
Digunakan untuk menyimpan data analytics dan time-series data.

### Redis (Cache)
Digunakan untuk caching dan session management.

## 🔐 Authentication

API menggunakan JWT (JSON Web Tokens) untuk authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Token Expiration:**
- Access Token: 15 minutes
- Refresh Token: 7 days

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token

### Students
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `GET /api/students/dashboard` - Get student dashboard

### Assessments
- `POST /api/assessments/calibration` - Start calibration
- `POST /api/assessments/start` - Start assessment
- `POST /api/assessments/:id/gaze-data` - Submit gaze data
- `POST /api/assessments/:id/speech-data` - Submit speech data
- `POST /api/assessments/:id/complete` - Complete assessment
- `GET /api/assessments/:id/results` - Get assessment results

### Materials
- `GET /api/materials` - Get reading materials
- `GET /api/materials/:id` - Get material details
- `POST /api/materials` - Create material (Admin/Teacher)

### More endpoints...
See [API Documentation](../docs/API_DOCUMENTATION.md) for complete list.

## 🔌 WebSocket Events

### Client → Server
- `authenticate` - Authenticate WebSocket connection
- `assessment:start` - Start assessment session
- `gaze:data` - Send real-time gaze data
- `speech:start` - Start speech recording
- `speech:stop` - Stop speech recording

### Server → Client
- `authenticated` - Authentication successful
- `assessment:update` - Assessment progress update
- `gaze:update` - Gaze data processed
- `analysis:result` - Analysis results ready
- `notification` - New notification

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Debugging

Development mode includes detailed error messages and stack traces.

**Debug logs:**
```bash
DEBUG=cortexia:* npm run dev
```

## 📝 Logging

Logs are stored in `logs/` directory:
- `cortexia-YYYY-MM-DD.log` - All logs
- `cortexia-error-YYYY-MM-DD.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🔒 Security

- Helmet.js untuk security headers
- CORS dengan whitelist origins
- Rate limiting untuk API endpoints
- Input validation dengan express-validator
- Password hashing dengan bcrypt
- JWT dengan refresh token rotation

## 🚀 Deployment

### Using Docker

```bash
# Build image
docker build -t cortexia-backend .

# Run container
docker run -p 5000:5000 --env-file .env cortexia-backend
```

### Using Docker Compose

```bash
# From project root
docker-compose up -d backend
```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Prometheus metrics: `GET /metrics` (to be implemented)
- Application logs: `logs/` directory

## 🔄 Database Backups

```bash
# PostgreSQL backup
pg_dump -U cortexia_user cortexia_db > backup.sql

# Restore
psql -U cortexia_user cortexia_db < backup.sql
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## 📄 License

[To be determined]

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: [email]
