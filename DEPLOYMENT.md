# 🚀 7D Project Backend - Server Deployment Guide

## **Overview**
This guide shows how to deploy the 7D Project Backend using pre-built Docker Hub images. All configuration is baked into the images, making deployment extremely simple.

## **Pre-built Images on Docker Hub**
- **Nginx**: `christba/7d-nginx:latest` - Reverse proxy with all configuration
- **API**: `christba/7d-backend:latest` - Backend API with all code
- **Database**: `christba/7d-postgres:latest` - PostgreSQL with all SQL scripts
- **Frontend**: `christba/7dcompass-frontend:latest` - Frontend application
- **MinIO**: `minio/minio:latest` - Object storage

## **Server Deployment (Ultra-Minimal)**

### **Files needed on server:**
```
📁 Essential files (minimal):
├── docker-compose.yml          # ← Uses all pre-built images
└── .env                        # ← Environment variables
```

### **Step 1: Copy files to server**
```bash
# Create deployment directory
mkdir -p /opt/7d-project-backend
cd /opt/7d-project-backend

# Copy only the docker-compose.yml file
scp docker-compose.yml user@server:/opt/7d-project-backend/
```

### **Step 2: Create environment file**
```bash
# Create .env file on server
cat > .env << EOF
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=7d_project
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
JWT_SECRET=your_jwt_secret_here
EOF
```

### **Step 3: Deploy**
```bash
# Pull all pre-built images
docker pull christba/7d-nginx:latest
docker pull christba/7d-backend:latest
docker pull christba/7d-postgres:latest
docker pull christba/7dcompass-frontend:latest
docker pull minio/minio:latest

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### **Step 4: Verify deployment**
```bash
# Test health endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/rtr/health

# Check logs
docker-compose logs -f
```

## **Production Configuration**

### **Change ports for production:**
```yaml
# In docker-compose.yml, change:
ports:
  - "80:80"      # Instead of "8080:80"
  - "443:443"    # Instead of "8443:443"
```

### **SSL Setup:**
1. Place SSL certificates in `ssl/` folder
2. Update nginx configuration in the image
3. Rebuild and push new nginx image

### **Database persistence:**
```yaml
# Already configured in docker-compose.yml:
volumes:
  - kc_pgdata:/var/lib/postgresql/data
  - minio-data:/data
```

## **Updating Images**

### **For Nginx configuration changes:**
```bash
# 1. Update nginx/nginx.conf locally
# 2. Rebuild and push
docker-compose build nginx
docker tag 7d-project-backend-nginx christba/7d-nginx:latest
docker push christba/7d-nginx:latest

# 3. On server, pull new image
docker pull christba/7d-nginx:latest
docker-compose up -d nginx
```

### **For API changes:**
```bash
# 1. Update backend-api/ locally
# 2. Rebuild and push
docker-compose build api
docker tag 7d-project-backend-api christba/7d-backend:latest
docker push christba/7d-backend:latest

# 3. On server, pull new image
docker pull christba/7d-backend:latest
docker-compose up -d api
```

### **For database changes:**
```bash
# 1. Update database/scripts/ locally
# 2. Rebuild and push
docker build -t 7d-project-backend-postgres ./database
docker tag 7d-project-backend-postgres christba/7d-postgres:latest
docker push christba/7d-postgres:latest

# 3. On server, pull new image
docker pull christba/7d-postgres:latest
docker-compose up -d postgres
```

## **Benefits of This Approach**

✅ **Ultra-minimal deployment** - Only docker-compose.yml needed
✅ **No build time on server** - All images pre-built
✅ **Consistent configuration** - Same setup everywhere
✅ **Easy updates** - Just pull new images
✅ **No config files** - Everything baked into images
✅ **Automatic database setup** - SQL scripts run automatically
✅ **Production ready** - All services properly configured

## **Troubleshooting**

### **Check container logs:**
```bash
docker-compose logs nginx
docker-compose logs api
docker-compose logs postgres
```

### **Access containers:**
```bash
# API container
docker exec -it 7d-project-backend-api-1 /bin/bash

# Database container
docker exec -it 7d-project-backend-postgres-1 psql -U postgres -d 7d_project

# Nginx container
docker exec -it 7d-project-backend-nginx-1 /bin/sh
```

### **Common issues:**
- **Port conflicts**: Change ports in docker-compose.yml
- **Database connection**: Check .env file and container health
- **CORS issues**: Already configured in nginx image
- **File upload limits**: Already configured (100MB for RTR)

## **Service URLs**

After deployment, access your services at:
- **Frontend**: http://your-server:8080
- **API**: http://your-server:8080/api
- **Swagger Docs**: http://your-server:8080/api-docs
- **MinIO Console**: http://your-server:8080/minio-console

## **Backup and Maintenance**

### **Database backup:**
```bash
docker exec 7d-project-backend-postgres-1 pg_dump -U postgres 7d_project > backup.sql
```

### **Restore database:**
```bash
docker exec -i 7d-project-backend-postgres-1 psql -U postgres 7d_project < backup.sql
```

### **Update all images:**
```bash
docker-compose pull
docker-compose up -d
``` 