# Technology Decisions & Rationale

## Stack Selection Rationale

### Frontend: React + TypeScript

**Chosen**: React 18+ with TypeScript

**Reasons**:
1. **Component-based architecture** - Perfect for complex dashboard interfaces
2. **WebGazer.js compatibility** - Best support for eye tracking library
3. **Large ecosystem** - Extensive libraries for charts, UI components
4. **TypeScript** - Type safety crucial for handling complex data structures (gaze data, speech analysis)
5. **Real-time updates** - Great support for WebSocket integration
6. **Team familiarity** - Most common frontend framework

**Alternatives Considered**:
- Vue.js - Good but smaller ecosystem for specialized libraries
- Angular - Too heavy for our needs
- Svelte - Less mature ecosystem for eye tracking

---

### Backend: Node.js + Express

**Chosen**: Node.js with Express

**Reasons**:
1. **JavaScript everywhere** - Same language as frontend
2. **Non-blocking I/O** - Perfect for handling real-time gaze data streams
3. **WebSocket support** - Native Socket.io integration
4. **Fast development** - Rapid prototyping capabilities
5. **Large ecosystem** - Many packages available
6. **Easy deployment** - Works well with Docker

**Alternatives Considered**:
- Python (Django/Flask) - Slower for real-time data but better for ML integration
- Go - Fast but longer development time
- Java Spring Boot - Overkill for our needs

**Decision**: Use Node.js for main API + Python FastAPI for AI-specific services

---

### Database: PostgreSQL (Primary) + MongoDB (Analytics)

**Primary Database: PostgreSQL**

**Reasons**:
1. **ACID compliance** - Critical for user data, assessments
2. **Relationships** - Complex relationships between students, assessments, profiles
3. **JSON support** - JSONB for flexible data like gaze patterns
4. **Mature** - Battle-tested, reliable
5. **Good ORM support** - Prisma/Sequelize work well

**Secondary: MongoDB**

**Reasons**:
1. **Time-series data** - Good for storing raw gaze tracking data
2. **Analytics** - Flexible schema for analytics queries
3. **Aggregation pipeline** - Powerful for complex analytics
4. **Scalability** - Easy to scale horizontally

**Alternatives Considered**:
- MySQL - Less advanced JSON support
- MongoDB only - Not ideal for relational data
- TimescaleDB - Overkill for our time-series needs

---

### Gaze Tracking: WebGazer.js

**Chosen**: WebGazer.js

**Reasons**:
1. **Browser-based** - No installation required
2. **Machine learning** - Uses facial feature detection
3. **Calibration support** - Built-in calibration system
4. **Active development** - Well-maintained
5. **Privacy-friendly** - Runs entirely in browser
6. **Free and open-source**

**Alternatives Considered**:
- Eye Tribe - Requires hardware
- Tobii - Expensive hardware
- Custom TensorFlow.js - Too much development time

**Note**: WebGazer.js accuracy ~300-500px is acceptable for word-level tracking

---

### Speech Recognition: Web Speech API + Custom Analysis

**Chosen**: Web Speech API + Python backend for analysis

**Reasons**:
1. **Native browser support** - No external API calls needed
2. **Real-time transcription** - Immediate feedback
3. **Free** - No API costs
4. **Privacy** - Processes locally first
5. **Good accuracy** - For Indonesian language

**Backend Analysis**: Python with Librosa

**Reasons**:
1. **Audio processing** - Librosa excellent for fluency analysis
2. **Pronunciation checking** - Can analyze phonemes
3. **Pause detection** - Detect reading difficulties
4. **Feature extraction** - Rich audio features

**Alternatives Considered**:
- Google Speech-to-Text - Cost issues, privacy concerns
- Whisper API - Overkill for simple transcription
- Amazon Transcribe - Same concerns as Google

---

### ML Framework: TensorFlow + Scikit-learn

**Chosen**: Hybrid approach

**TensorFlow** for:
- Deep learning models (if needed)
- Future expansion (image analysis)
- Production deployment (TF Serving)

**Scikit-learn** for:
- Classification models (difficulty profiling)
- Recommendation systems
- Simpler, faster training
- Good enough for initial models

**Reasons**:
1. **Flexibility** - Use right tool for each task
2. **Performance** - Scikit-learn faster for simple models
3. **Scalability** - TensorFlow better for complex models
4. **Deployment** - Both have good deployment options

---

### Authentication: JWT

**Chosen**: JWT with refresh tokens

**Reasons**:
1. **Stateless** - Scalable architecture
2. **Standard** - Industry best practice
3. **Secure** - When implemented correctly
4. **Multi-device** - Works across platforms
5. **Token refresh** - Better security with short-lived tokens

**Security Measures**:
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- HTTP-only cookies for refresh tokens
- Token rotation on refresh
- Blacklist for logout

---

### Caching: Redis

**Chosen**: Redis

**Reasons**:
1. **Fast** - In-memory performance
2. **Versatile** - Can be used for sessions, cache, pub/sub
3. **TTL support** - Automatic expiration
4. **Widely supported** - Great libraries
5. **Scalable** - Redis Cluster for production

**Use Cases**:
- Session storage
- Frequently accessed user profiles
- Assessment results cache
- Rate limiting counters

---

### File Storage Strategy

**Development**: Local filesystem
**Production**: AWS S3 or equivalent

**Reasons**:
1. **Scalability** - Unlimited storage
2. **CDN integration** - Fast content delivery
3. **Durability** - 99.999999999% durability
4. **Cost-effective** - Pay for what you use
5. **Backup** - Automatic replication

**File Types**:
- Audio recordings (speech)
- Profile images
- Reading materials
- Generated reports

---

### Real-time Communication: Socket.io

**Chosen**: Socket.io

**Reasons**:
1. **Easy to use** - Simple API
2. **Fallback support** - Works even if WebSocket unavailable
3. **Room support** - For different user sessions
4. **Reconnection** - Automatic reconnection handling
5. **Broadcasting** - Easy to send to multiple clients

**Use Cases**:
- Real-time gaze data streaming
- Live assessment progress
- Notifications
- Teacher monitoring student assessments

---

### Containerization: Docker

**Chosen**: Docker + Docker Compose

**Reasons**:
1. **Consistency** - Same environment everywhere
2. **Isolation** - Each service independent
3. **Easy deployment** - Simple to move to production
4. **Development** - Quick setup for new developers
5. **Orchestration** - Easy to use Kubernetes later

---

### API Design: RESTful + WebSocket

**Chosen**: REST for most operations, WebSocket for real-time

**REST API**:
- CRUD operations
- Standard HTTP methods
- JSON responses
- Pagination, filtering, sorting

**WebSocket**:
- Real-time gaze data
- Live notifications
- Assessment progress updates
- Chat/messaging

**Reasons**:
1. **Standard** - REST is universal
2. **Caching** - HTTP caching works with REST
3. **Real-time** - WebSocket for data streams
4. **Separation** - Clear use case separation

---

## Performance Targets

### Frontend
- **Initial load**: < 3 seconds
- **Time to interactive**: < 5 seconds
- **Gaze data sampling**: 10Hz (100ms intervals)
- **UI response**: < 100ms

### Backend
- **API response**: < 200ms (95th percentile)
- **Assessment processing**: < 10 seconds
- **ML inference**: < 5 seconds
- **Database queries**: < 50ms average

### System
- **Concurrent users**: 1000+
- **Assessments per hour**: 500+
- **Uptime**: 99.9%
- **Data retention**: 5 years

---

## Security Considerations

1. **Authentication**
   - JWT with short expiration
   - Refresh token rotation
   - Password hashing with bcrypt (cost factor 12)

2. **Authorization**
   - Role-based access control (RBAC)
   - Resource-level permissions
   - API rate limiting

3. **Data Protection**
   - HTTPS everywhere
   - Encrypted sensitive data at rest
   - Personal data anonymization for analytics
   - GDPR compliance considerations

4. **Input Validation**
   - Server-side validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

5. **Privacy**
   - Gaze data processed locally first
   - Minimal PII storage
   - Data retention policies
   - Right to deletion

---

## Scalability Strategy

### Phase 1: Monolith (Current)
- Single backend server
- Vertical scaling
- Target: 100 concurrent users

### Phase 2: Horizontal Scaling
- Load balancer
- Multiple API instances
- Redis for session sharing
- Target: 1000 concurrent users

### Phase 3: Microservices (Future)
- Separate services for:
  - Authentication
  - Assessment
  - Analysis
  - Recommendations
- Message queue (RabbitMQ)
- Target: 10,000+ concurrent users

---

## Development Workflow

1. **Local Development**
   ```bash
   docker-compose up -d
   # All services available locally
   ```

2. **Testing**
   - Unit tests: Jest (frontend), Mocha (backend)
   - Integration tests: Supertest
   - E2E tests: Cypress
   - ML model tests: pytest

3. **CI/CD Pipeline**
   ```
   Push to GitHub
     → GitHub Actions
       → Run tests
       → Build Docker images
       → Deploy to staging
       → (Manual approval)
       → Deploy to production
   ```

4. **Code Quality**
   - ESLint for JavaScript/TypeScript
   - Prettier for formatting
   - Pylint for Python
   - Pre-commit hooks
   - Code review required

---

## Future Considerations

1. **Mobile App**
   - React Native
   - Share code with web app
   - Native eye tracking libraries

2. **Offline Support**
   - Progressive Web App (PWA)
   - Service workers
   - Local database (IndexedDB)

3. **Multi-language Support**
   - i18n implementation
   - Indonesian + English initially
   - Extensible for more languages

4. **Advanced ML Models**
   - Transfer learning
   - Personalized models per student
   - Federated learning for privacy

5. **Integration**
   - LMS integration (Moodle, Canvas)
   - School management systems
   - Educational APIs

---

## Cost Estimation (Monthly)

### Infrastructure (Production)
- **Hosting**: $200-500 (AWS/GCP/Azure)
- **Database**: $100-200 (Managed PostgreSQL)
- **Storage**: $50-100 (S3 for audio/images)
- **CDN**: $50-100
- **Monitoring**: $50 (Prometheus/Grafana)

**Total**: ~$450-950/month for 1000 active users

### Development Tools
- **GitHub**: Free (public) or $4/user
- **Domain**: $10-20/year
- **SSL**: Free (Let's Encrypt)
- **Third-party APIs**: Minimal (using free tiers)

---

## Risks & Mitigation

1. **WebGazer.js Accuracy**
   - **Risk**: May not be accurate enough
   - **Mitigation**: Extensive calibration, use as supplementary data

2. **Browser Compatibility**
   - **Risk**: Old browsers may not support features
   - **Mitigation**: Minimum browser requirements, polyfills

3. **Performance with Large Data**
   - **Risk**: Slow queries with millions of gaze points
   - **Mitigation**: Data aggregation, archiving old data

4. **ML Model Accuracy**
   - **Risk**: Models may not perform well initially
   - **Mitigation**: Continuous training, human-in-the-loop

5. **Privacy Concerns**
   - **Risk**: Parents/teachers concerned about tracking
   - **Mitigation**: Transparent privacy policy, local processing

---

This document should be updated as the project evolves and new decisions are made.
