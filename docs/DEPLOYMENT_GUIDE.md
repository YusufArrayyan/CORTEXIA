# CORTEXIA Deployment Guide

## Overview

Complete deployment guide untuk sistem CORTEXIA ke production environment dengan Docker, Kubernetes, atau VM-based deployment.

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Development/Small Scale)
### Option 2: Kubernetes (Recommended for Production)
### Option 3: Manual VM Deployment

---

## 📦 Option 1: Docker Compose Deployment

### Prerequisites
- Docker 24+ & Docker Compose 2+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Domain name (optional, for HTTPS)

### Steps

1. **Clone repository**:
```bash
git clone https://github.com/your-org/cortexia.git
cd cortexia
```

2. **Configure environment**:
```bash
cp .env.example .env
nano .env  # Edit configuration
```

**Required Environment Variables**:
```bash
# Database
DATABASE_URL=postgresql://cortexia:your_password@postgres:5432/cortexia
MONGODB_URI=mongodb://mongo:27017/cortexia_analytics
REDIS_URL=redis://redis:6379

# JWT Secrets
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_secure_refresh_secret_minimum_32_characters

# CORS
FRONTEND_URL=https://cortexia.yourschool.id

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cortexia.id
SMTP_PASSWORD=your_email_password

# AI Engine
AI_ENGINE_URL=http://ai-engine:8000
```

3. **Start services**:
```bash
docker-compose up -d
```

4. **Run migrations**:
```bash
docker-compose exec backend npx prisma migrate deploy
```

5. **Create initial admin**:
```bash
docker-compose exec backend npm run seed:admin
```

6. **Verify deployment**:
```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:8000/health
curl http://localhost:3000
```

### Production Hardening

1. **Use HTTPS** (Let's Encrypt with Nginx):
```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d cortexia.yourschool.id

# Auto-renewal
certbot renew --dry-run
```

2. **Configure Nginx** (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name cortexia.yourschool.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cortexia.yourschool.id;
    
    ssl_certificate /etc/letsencrypt/live/cortexia.yourschool.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cortexia.yourschool.id/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

3. **Database Backups**:
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U cortexia cortexia > backup_$DATE.sql
gzip backup_$DATE.sql
# Upload to S3 or backup server
```

---

## ☸️ Option 2: Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.25+)
- kubectl configured
- Helm 3+
- Persistent storage (NFS/EBS/GCE PD)

### Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer (Ingress)       │
│         cortexia.yourschool.id          │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
   ┌────▼────┐       ┌────▼────┐
   │ Frontend│       │ Backend │
   │  (3 pods)│       │ (3 pods)│
   └────┬────┘       └────┬────┘
        │                  │
        │          ┌───────▼────────┐
        │          │   AI Engine    │
        │          │   (2 pods)     │
        │          └───────┬────────┘
        │                  │
   ┌────▼──────────────────▼────┐
   │      Databases (StatefulSet)│
   │  PostgreSQL | MongoDB | Redis│
   └─────────────────────────────┘
```

### Deployment Steps

1. **Create namespace**:
```bash
kubectl create namespace cortexia
```

2. **Create secrets**:
```bash
kubectl create secret generic cortexia-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  --from-literal=jwt-refresh-secret="..." \
  -n cortexia
```

3. **Deploy PostgreSQL** (StatefulSet):
```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: cortexia
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: cortexia
        - name: POSTGRES_USER
          value: cortexia
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: cortexia-secrets
              key: postgres-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
```

4. **Deploy Backend**:
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: cortexia
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: cortexia/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cortexia-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cortexia-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: cortexia
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

5. **Deploy AI Engine**:
```yaml
# ai-engine-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-engine
  namespace: cortexia
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-engine
  template:
    metadata:
      labels:
        app: ai-engine
    spec:
      containers:
      - name: ai-engine
        image: cortexia/ai-engine:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: ai-engine
  namespace: cortexia
spec:
  selector:
    app: ai-engine
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

6. **Deploy Frontend**:
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: cortexia
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: cortexia/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: cortexia
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

7. **Setup Ingress**:
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cortexia-ingress
  namespace: cortexia
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - cortexia.yourschool.id
    secretName: cortexia-tls
  rules:
  - host: cortexia.yourschool.id
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

8. **Apply manifests**:
```bash
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f ai-engine-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

9. **Verify deployment**:
```bash
kubectl get pods -n cortexia
kubectl get svc -n cortexia
kubectl get ingress -n cortexia
kubectl logs -f deployment/backend -n cortexia
```

---

## 🖥️ Option 3: Manual VM Deployment

### System Requirements

**Minimum**:
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Ubuntu 22.04 LTS

**Recommended**:
- 8 CPU cores
- 16GB RAM
- 100GB SSD
- Ubuntu 22.04 LTS

### Installation Steps

1. **Update system**:
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Install Python**:
```bash
sudo apt install -y python3.11 python3-pip python3-venv
```

4. **Install PostgreSQL**:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE cortexia;
CREATE USER cortexia WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cortexia TO cortexia;
\q
```

5. **Install MongoDB**:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

6. **Install Redis**:
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

7. **Install Nginx**:
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

8. **Deploy Backend**:
```bash
cd /opt
sudo git clone https://github.com/your-org/cortexia.git
cd cortexia/backend
sudo npm install
sudo cp .env.example .env
sudo nano .env  # Configure
sudo npx prisma migrate deploy
```

9. **Deploy AI Engine**:
```bash
cd /opt/cortexia/ai-models
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

10. **Deploy Frontend**:
```bash
cd /opt/cortexia/frontend
sudo npm install
sudo npm run build
```

11. **Setup systemd services**:

**Backend service** (`/etc/systemd/system/cortexia-backend.service`):
```ini
[Unit]
Description=CORTEXIA Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cortexia/backend
Environment="NODE_ENV=production"
EnvironmentFile=/opt/cortexia/backend/.env
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**AI Engine service** (`/etc/systemd/system/cortexia-ai.service`):
```ini
[Unit]
Description=CORTEXIA AI Engine
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cortexia/ai-models
Environment="PYTHONPATH=/opt/cortexia/ai-models"
ExecStart=/opt/cortexia/ai-models/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

12. **Start services**:
```bash
sudo systemctl daemon-reload
sudo systemctl start cortexia-backend
sudo systemctl start cortexia-ai
sudo systemctl enable cortexia-backend
sudo systemctl enable cortexia-ai
```

13. **Configure Nginx** (use the nginx.conf from Docker Compose section)

14. **Setup firewall**:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 📊 Monitoring & Logging

### Prometheus + Grafana

1. **Install Prometheus**:
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cortexia-backend'
    static_configs:
      - targets: ['localhost:5000']
  
  - job_name: 'cortexia-ai'
    static_configs:
      - targets: ['localhost:8000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

2. **Setup Grafana dashboards** for:
- API response times
- Error rates
- Database connections
- Memory & CPU usage
- Active users
- Assessment completion rates

### Logging

**ELK Stack (Elasticsearch, Logstash, Kibana)**:
- Centralized logging
- Log aggregation from all services
- Search and analysis
- Alerting

**Alternative: Loki + Grafana**:
- Lighter than ELK
- Better integration with Grafana
- Efficient log querying

---

## 🔒 Security Checklist

- [ ] HTTPS enabled with valid certificates
- [ ] Database credentials secured (secrets management)
- [ ] JWT secrets rotated regularly
- [ ] Firewall configured (only necessary ports)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [ ] DDoS protection (CloudFlare/AWS Shield)
- [ ] WAF enabled
- [ ] Regular penetration testing

---

## 🔄 Maintenance

### Regular Tasks

**Daily**:
- Monitor system health
- Check error logs
- Verify backups

**Weekly**:
- Review performance metrics
- Check disk space
- Update dependencies (security patches)

**Monthly**:
- Full system backup test
- Security audit
- Performance optimization
- Database maintenance (VACUUM, REINDEX)

### Scaling Strategies

**Horizontal Scaling**:
- Add more backend/AI engine replicas
- Use load balancer
- Session persistence with Redis

**Vertical Scaling**:
- Increase RAM/CPU per instance
- Optimize queries
- Add database read replicas

**Database Scaling**:
- Read replicas for PostgreSQL
- MongoDB sharding
- Redis cluster

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Backend won't start
```bash
# Check logs
docker-compose logs backend
# or
sudo journalctl -u cortexia-backend -f

# Common causes:
# - Database not ready
# - Missing environment variables
# - Port already in use
```

**Issue**: High memory usage
```bash
# Check processes
docker stats
# or
htop

# Solutions:
# - Increase memory limits
# - Optimize queries
# - Add caching
```

**Issue**: Slow API responses
```bash
# Check database performance
# Check network latency
# Review slow query logs
# Enable caching
```

### Getting Help

- Documentation: https://docs.cortexia.id
- GitHub Issues: https://github.com/your-org/cortexia/issues
- Email: support@cortexia.id

---

**Deployment Checklist**: Use this guide with the TESTING_STRATEGY.md to ensure production-ready deployment.
