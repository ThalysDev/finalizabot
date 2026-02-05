# PRODUCTION DEPLOYMENT GUIDE - FinalizaBOT

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Linting passed (npm run lint)
- [ ] No console.logs in production code
- [ ] No hardcoded credentials
- [ ] All dependencies up to date

### Testing
- [ ] Responsive design verified (all breakpoints)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance: Lighthouse >= 90
- [ ] All user flows tested

### Security
- [ ] Environment variables configured
- [ ] Clerk auth keys set
- [ ] Database secured
- [ ] CORS properly configured
- [ ] API rate limiting enabled
- [ ] Input validation implemented

### Performance
- [ ] Image optimization completed
- [ ] Bundle size analyzed
- [ ] Caching headers configured
- [ ] CDN configured
- [ ] Core Web Vitals met

## Environment Configuration

### Production Environment Variables
Create `.env.production`:

```bash
# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Database (Switch to PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:5432/finalizabot

# Google Analytics (Production)
NEXT_PUBLIC_GA_ID=G-PRODUCTION_ID

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://finalizabot.com
NEXT_PUBLIC_API_URL=https://api.finalizabot.com

# Security
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://finalizabot.com
```

### Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Migration (SQLite → PostgreSQL)

### Step 1: Export SQLite Data
```bash
# Backup current database
cp prisma/dev.db prisma/dev.db.backup

# Generate migration
npx prisma migrate dev --name switch_to_postgres
```

### Step 2: Create PostgreSQL Database
```bash
# Create database
createdb finalizabot

# Set connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/finalizabot"
```

### Step 3: Migrate Schema
```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed production data
npx prisma db seed
```

### Step 4: Verify Data
```bash
# Open Prisma Studio to verify
npx prisma studio
```

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

#### Setup
1. Push code to GitHub
2. Go to vercel.com and sign up
3. Import project from GitHub
4. Configure environment variables
5. Deploy

#### Configure
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Environment Variables in Vercel Dashboard
- Go to Settings → Environment Variables
- Add all production variables
- Ensure PostgreSQL connection string included

### Option 2: AWS EC2 + RDS

#### Setup
1. Create EC2 instance (Ubuntu 22.04)
2. Create RDS PostgreSQL database
3. Configure security groups
4. Deploy application

#### Steps
```bash
# Connect to EC2
ssh -i key.pem ec2-user@instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/ThalysDev/finalizabot.git
cd finalizabot

# Install dependencies
npm install

# Configure environment
nano .env.production

# Build application
npm run build

# Start with PM2
npm install -g pm2
pm2 start "npm run start" --name "finalizabot"
pm2 startup
pm2 save

# Configure Nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
# Configure to proxy to localhost:3000
```

### Option 3: Railway.app

#### Setup
1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

### Option 4: Docker Container

#### Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

#### Build and Push
```bash
# Build image
docker build -t finalizabot:latest .

# Tag for registry
docker tag finalizabot:latest username/finalizabot:latest

# Push to Docker Hub
docker push username/finalizabot:latest
```

## SSL/HTTPS Configuration

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d finalizabot.com -d www.finalizabot.com

# Auto-renew
sudo certbot renew --dry-run
```

### Configure Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name finalizabot.com;

    ssl_certificate /etc/letsencrypt/live/finalizabot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finalizabot.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name finalizabot.com;
    return 301 https://$server_name$request_uri;
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        run: npx vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# Monitor application
pm2 monit
pm2 logs
```

### Error Tracking
```bash
npm install @sentry/nextjs

# Configure in next.config.ts
withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'finalizabot',
})
```

### Database Monitoring
```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Connections check
psql -U postgres -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

## Performance Optimization for Production

### Caching Strategy
```typescript
// next.config.ts
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=3600, stale-while-revalidate=86400',
      },
    ],
  },
],
```

### Image Optimization
- Use Next.js Image component
- Set width/height
- Use priority for LCP images
- Implement lazy loading

### Code Splitting
```typescript
// Dynamic imports
import dynamic from 'next/dynamic';

const HeroSection = dynamic(() => import('@/components/landing/HeroSection'), {
  loading: () => <LoadingSpinner />,
});
```

## Backup & Disaster Recovery

### Database Backups
```bash
# Automated daily backup
0 2 * * * /usr/bin/pg_dump finalizabot > /backups/finalizabot-$(date +\%Y\%m\%d).sql

# Upload to S3
aws s3 cp /backups/finalizabot-*.sql s3://finalizabot-backups/
```

### Recovery Procedure
```bash
# Restore from backup
pg_restore -U postgres -d finalizabot < backup-file.sql

# Verify recovery
npx prisma studio
```

## Post-Deployment Checklist

- [ ] Website loads without errors
- [ ] All pages accessible
- [ ] Authentication works
- [ ] Database connections stable
- [ ] Analytics tracking working
- [ ] SSL certificate valid
- [ ] Email notifications working
- [ ] Backups running
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

## Rollback Procedure

If issues occur:

```bash
# Vercel
vercel --prod # (select previous deployment)

# Manual
git revert <commit-hash>
npm run build
npm start

# Docker
docker run -d -p 80:3000 username/finalizabot:previous-tag
```

## Support & Documentation

- **Documentation:** https://docs.finalizabot.com
- **Status Page:** https://status.finalizabot.com
- **Support Email:** support@finalizabot.com
- **Incident Report:** Follow incident protocol
