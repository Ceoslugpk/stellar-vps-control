
# HostPanel Pro - Universal VPS Installation Guide

A comprehensive web hosting control panel application designed for universal VPS deployment across all major providers and Linux distributions.

## VPS Compatibility Matrix

### Supported VPS Providers
- ✅ **DigitalOcean** (Droplets)
- ✅ **Linode** (Linodes)
- ✅ **Vultr** (Cloud Compute)
- ✅ **AWS EC2** (Amazon Linux, Ubuntu)
- ✅ **Google Cloud Platform** (Compute Engine)
- ✅ **Microsoft Azure** (Virtual Machines)
- ✅ **Hetzner Cloud**
- ✅ **OVHcloud**
- ✅ **Contabo**
- ✅ **Hostinger VPS**
- ✅ **Any KVM/OpenVZ VPS**

### Supported Operating Systems
- ✅ **Ubuntu** 18.04, 20.04, 22.04, 24.04 LTS
- ✅ **Debian** 10 (Buster), 11 (Bullseye), 12 (Bookworm)
- ✅ **CentOS** 7, 8, Stream 8, Stream 9
- ✅ **Rocky Linux** 8, 9
- ✅ **AlmaLinux** 8, 9
- ✅ **RHEL** 8, 9
- ✅ **Fedora** 35, 36, 37, 38
- ✅ **OpenSUSE Leap** 15.4, 15.5

## System Requirements

### Minimum VPS Specifications
```
CPU: 1 vCPU (2.4 GHz)
RAM: 2 GB
Storage: 20 GB SSD
Network: 1 Gbps
OS: Any supported Linux distribution
Root/Sudo access: Required
```

### Recommended VPS Specifications
```
CPU: 2+ vCPU (2.4+ GHz)
RAM: 4+ GB
Storage: 40+ GB NVMe SSD
Network: 1+ Gbps
Backup: Weekly automated backups
Monitoring: Basic server monitoring
```

### Production VPS Specifications
```
CPU: 4+ vCPU (3.0+ GHz)
RAM: 8+ GB
Storage: 80+ GB NVMe SSD
Network: 10+ Gbps
Backup: Daily automated backups
Monitoring: Advanced monitoring with alerts
Load Balancer: Optional for high availability
```

## Pre-Installation Requirements

### 1. Fresh VPS Setup
```bash
# Connect to your VPS via SSH
ssh root@your-vps-ip
# OR
ssh username@your-vps-ip

# Update system packages (works on all distributions)
# For Ubuntu/Debian:
apt update && apt upgrade -y

# For CentOS/RHEL/Rocky/Alma:
yum update -y
# OR (newer versions)
dnf update -y

# For Fedora:
dnf update -y

# For OpenSUSE:
zypper update -y
```

### 2. Install Essential Dependencies

#### Universal Installation Script
```bash
#!/bin/bash
# HostPanel Pro - Universal VPS Setup Script

# Detect OS and distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
else
    echo "Cannot detect OS. Please install manually."
    exit 1
fi

echo "Detected OS: $OS $VERSION"

# Install dependencies based on distribution
case $OS in
    "Ubuntu"|"Debian GNU/Linux")
        apt update
        apt install -y curl wget git nginx nodejs npm mysql-server redis-server \
                      certbot python3-certbot-nginx ufw fail2ban htop iotop \
                      build-essential software-properties-common
        
        # Install Node.js 18.x
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
        ;;
        
    "CentOS Linux"|"Red Hat Enterprise Linux"|"Rocky Linux"|"AlmaLinux")
        # Enable EPEL repository
        if command -v dnf &> /dev/null; then
            dnf install -y epel-release
            dnf update -y
            dnf install -y curl wget git nginx nodejs npm mysql-server redis \
                          certbot python3-certbot-nginx firewalld fail2ban \
                          htop iotop gcc gcc-c++ make
        else
            yum install -y epel-release
            yum update -y
            yum install -y curl wget git nginx nodejs npm mysql-server redis \
                          certbot python3-certbot-nginx firewalld fail2ban \
                          htop iotop gcc gcc-c++ make
        fi
        
        # Install Node.js 18.x
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        if command -v dnf &> /dev/null; then
            dnf install -y nodejs
        else
            yum install -y nodejs
        fi
        ;;
        
    "Fedora Linux")
        dnf update -y
        dnf install -y curl wget git nginx nodejs npm mysql-server redis \
                      certbot python3-certbot-nginx firewalld fail2ban \
                      htop iotop gcc gcc-c++ make
        ;;
        
    "openSUSE Leap")
        zypper refresh
        zypper install -y curl wget git nginx nodejs18 npm mysql redis \
                         certbot python3-certbot-nginx firewalld fail2ban \
                         htop iotop gcc gcc-c++ make
        ;;
        
    *)
        echo "Unsupported OS: $OS"
        echo "Please install dependencies manually:"
        echo "- Node.js 18.x"
        echo "- npm"
        echo "- nginx"
        echo "- mysql-server"
        echo "- redis"
        echo "- certbot"
        echo "- fail2ban"
        exit 1
        ;;
esac

echo "Dependencies installed successfully!"
```

## Installation Methods

### Method 1: Automated Installation (Recommended)

#### Quick Install Script
```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/your-repo/hostpanel-pro/main/scripts/install.sh | bash

# OR with wget
wget -qO- https://raw.githubusercontent.com/your-repo/hostpanel-pro/main/scripts/install.sh | bash
```

#### Custom Installation Script
```bash
#!/bin/bash
# HostPanel Pro - Automated Installation Script

set -e

# Configuration
HOSTPANEL_USER="hostpanel"
HOSTPANEL_DIR="/opt/hostpanel"
SERVICE_PORT="3000"
DOMAIN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Create hostpanel user
print_status "Creating hostpanel user..."
if ! id "$HOSTPANEL_USER" &>/dev/null; then
    useradd -m -s /bin/bash $HOSTPANEL_USER
    usermod -aG sudo $HOSTPANEL_USER
fi

# Create installation directory
print_status "Setting up directories..."
mkdir -p $HOSTPANEL_DIR
chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR

# Clone repository
print_status "Downloading HostPanel Pro..."
cd $HOSTPANEL_DIR
sudo -u $HOSTPANEL_USER git clone https://github.com/your-repo/hostpanel-pro.git .

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
sudo -u $HOSTPANEL_USER npm install

# Build application
print_status "Building application..."
sudo -u $HOSTPANEL_USER npm run build

# Setup database
print_status "Configuring database..."
mysql -e "CREATE DATABASE IF NOT EXISTS hostpanel;"
mysql -e "CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '$(openssl rand -base64 32)';"
mysql -e "GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Create systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/hostpanel.service << EOF
[Unit]
Description=HostPanel Pro Control Panel
After=network.target mysql.service redis.service
Wants=mysql.service redis.service

[Service]
Type=simple
User=$HOSTPANEL_USER
Group=$HOSTPANEL_USER
WorkingDirectory=$HOSTPANEL_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$SERVICE_PORT

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$HOSTPANEL_DIR

[Install]
WantedBy=multi-user.target
EOF

# Configure nginx
print_status "Configuring nginx..."
cat > /etc/nginx/sites-available/hostpanel << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:$SERVICE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable nginx site
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi
ln -sf /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable mysql redis-server nginx hostpanel
systemctl start mysql redis-server nginx hostpanel

# Setup SSL if domain provided
if [ ! -z "$DOMAIN" ]; then
    print_status "Setting up SSL certificate for $DOMAIN..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Final status check
print_status "Checking service status..."
systemctl is-active --quiet hostpanel && print_status "HostPanel Pro is running" || print_error "HostPanel Pro failed to start"
systemctl is-active --quiet nginx && print_status "Nginx is running" || print_error "Nginx failed to start"
systemctl is-active --quiet mysql && print_status "MySQL is running" || print_error "MySQL failed to start"

print_status "Installation completed successfully!"
print_status "Access your control panel at: http://your-server-ip"
print_warning "Default login will be created on first access"
```

### Method 2: Manual Installation

#### Step-by-Step Manual Setup

```bash
# 1. Create dedicated user
useradd -m -s /bin/bash hostpanel
usermod -aG sudo hostpanel
su - hostpanel

# 2. Clone repository
cd /opt
sudo mkdir hostpanel
sudo chown hostpanel:hostpanel hostpanel
cd hostpanel
git clone https://github.com/your-repo/hostpanel-pro.git .

# 3. Install dependencies
npm install

# 4. Build application
npm run build

# 5. Configure environment
cp .env.example .env
nano .env

# 6. Setup database
sudo mysql -u root -p
CREATE DATABASE hostpanel;
CREATE USER 'hostpanel'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 7. Initialize database
npm run db:migrate

# 8. Start application
npm start
```

### Method 3: Docker Installation

#### Docker Compose Setup
```yaml
version: '3.8'

services:
  hostpanel:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://hostpanel:password@mysql:3306/hostpanel
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=hostpanel
      - MYSQL_USER=hostpanel
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - hostpanel
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Docker Installation Commands
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy HostPanel Pro
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro
docker-compose up -d
```

## VPS Provider Specific Instructions

### DigitalOcean Droplets
```bash
# Create droplet with doctl
doctl compute droplet create hostpanel \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID

# Or use DigitalOcean 1-Click App
# Search for "HostPanel Pro" in marketplace (when available)
```

### AWS EC2
```bash
# Launch instance with AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-12345678 \
  --user-data file://userdata.sh
```

### Google Cloud Platform
```bash
# Create VM instance
gcloud compute instances create hostpanel-vm \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=40GB \
  --metadata-from-file startup-script=startup.sh
```

### Linode
```bash
# Create Linode with CLI
linode-cli linodes create \
  --type g6-standard-2 \
  --region us-east \
  --image linode/ubuntu22.04 \
  --root_pass YOUR_ROOT_PASSWORD \
  --label hostpanel-server
```

## Configuration Files

### Environment Variables (.env)
```env
# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com
APP_NAME="HostPanel Pro"

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostpanel
DB_USER=hostpanel
DB_PASSWORD=secure_random_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Settings
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Email Configuration
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your_smtp_password
SMTP_FROM="HostPanel Pro <noreply@your-domain.com>"

# SSL Configuration
SSL_AUTO=true
SSL_EMAIL=admin@your-domain.com

# Backup Configuration
BACKUP_PATH=/var/backups/hostpanel
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION=true

# Monitoring
MONITORING_ENABLED=true
MONITORING_INTERVAL=60

# API Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=900

# File Upload Limits
MAX_FILE_SIZE=100MB
UPLOAD_PATH=/var/www/uploads
```

## Security Hardening

### SSL/TLS Configuration
```bash
# Generate strong DH parameters
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Configure strong SSL in nginx
cat >> /etc/nginx/sites-available/hostpanel << 'EOF'
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_dhparam /etc/ssl/certs/dhparam.pem;
ssl_session_timeout 10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;

# Security Headers
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
EOF
```

### Firewall Rules
```bash
# UFW (Ubuntu/Debian)
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 21/tcp   # FTP
ufw allow 22/tcp   # SSH
ufw allow 25/tcp   # SMTP
ufw allow 53       # DNS
ufw allow 80/tcp   # HTTP
ufw allow 110/tcp  # POP3
ufw allow 143/tcp  # IMAP
ufw allow 443/tcp  # HTTPS
ufw allow 465/tcp  # SMTPS
ufw allow 587/tcp  # SMTP Submission
ufw allow 993/tcp  # IMAPS
ufw allow 995/tcp  # POP3S
ufw --force enable

# Firewalld (CentOS/RHEL/Fedora)
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=smtp
firewall-cmd --permanent --add-service=pop3
firewall-cmd --permanent --add-service=imap
firewall-cmd --permanent --add-service=ftp
firewall-cmd --permanent --add-port=587/tcp
firewall-cmd --permanent --add-port=465/tcp
firewall-cmd --permanent --add-port=993/tcp
firewall-cmd --permanent --add-port=995/tcp
firewall-cmd --reload
```

## Performance Optimization

### System Optimization
```bash
# Optimize system limits
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Optimize kernel parameters
cat >> /etc/sysctl.conf << 'EOF'
# Network optimization
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 65536 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File system optimization
fs.file-max = 2097152
vm.swappiness = 10
vm.vfs_cache_pressure = 50
EOF

sysctl -p
```

### Database Optimization
```bash
# MySQL/MariaDB optimization
cat >> /etc/mysql/mysql.conf.d/hostpanel.cnf << 'EOF'
[mysqld]
# Basic settings
max_connections = 200
max_allowed_packet = 64M
thread_cache_size = 16
table_open_cache = 4000
query_cache_type = 1
query_cache_size = 64M

# InnoDB settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
EOF

systemctl restart mysql
```

## Monitoring and Maintenance

### System Monitoring Script
```bash
#!/bin/bash
# HostPanel Pro - System Monitoring Script

LOGFILE="/var/log/hostpanel-monitor.log"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOGFILE
}

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
if (( $(echo "$CPU_USAGE > $THRESHOLD_CPU" | bc -l) )); then
    log_message "HIGH CPU USAGE: ${CPU_USAGE}%"
fi

# Memory Usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE > $THRESHOLD_MEMORY" | bc -l) )); then
    log_message "HIGH MEMORY USAGE: ${MEMORY_USAGE}%"
fi

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt $THRESHOLD_DISK ]; then
    log_message "HIGH DISK USAGE: ${DISK_USAGE}%"
fi

# Service Status
if ! systemctl is-active --quiet hostpanel; then
    log_message "HOSTPANEL SERVICE DOWN"
    systemctl restart hostpanel
fi

if ! systemctl is-active --quiet nginx; then
    log_message "NGINX SERVICE DOWN"
    systemctl restart nginx
fi

if ! systemctl is-active --quiet mysql; then
    log_message "MYSQL SERVICE DOWN"
    systemctl restart mysql
fi
```

### Automated Backup Script
```bash
#!/bin/bash
# HostPanel Pro - Backup Script

BACKUP_DIR="/var/backups/hostpanel"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u hostpanel -p hostpanel > $BACKUP_DIR/database_$DATE.sql
gzip $BACKUP_DIR/database_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/application_$DATE.tar.gz -C /opt hostpanel

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/mysql /etc/hostpanel

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Service Won't Start
```bash
# Check service status
systemctl status hostpanel
journalctl -u hostpanel -f

# Common fixes
sudo systemctl daemon-reload
sudo systemctl restart hostpanel
```

#### 2. Database Connection Issues
```bash
# Test database connection
mysql -u hostpanel -p hostpanel

# Reset database password
sudo mysql -u root -p
ALTER USER 'hostpanel'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

#### 3. SSL Certificate Issues
```bash
# Renew certificates
certbot renew --dry-run
certbot renew

# Force renewal
certbot certonly --force-renewal -d your-domain.com
```

#### 4. High Resource Usage
```bash
# Check processes
htop
iotop

# Check disk usage
df -h
du -sh /var/log/*

# Clean logs
journalctl --vacuum-time=30d
logrotate -f /etc/logrotate.conf
```

#### 5. Permission Issues
```bash
# Fix file permissions
chown -R hostpanel:hostpanel /opt/hostpanel
chmod -R 755 /opt/hostpanel
```

### Log Locations
```
Application Logs: /var/log/hostpanel/
System Logs: /var/log/syslog
Nginx Logs: /var/log/nginx/
MySQL Logs: /var/log/mysql/
```

## Updates and Maintenance

### Update Process
```bash
# 1. Backup current installation
./scripts/backup.sh

# 2. Pull latest changes
cd /opt/hostpanel
git pull origin main

# 3. Update dependencies
npm install

# 4. Run database migrations
npm run db:migrate

# 5. Rebuild application
npm run build

# 6. Restart service
systemctl restart hostpanel
```

### Maintenance Schedule
- **Daily**: Automated backups, log rotation
- **Weekly**: Security updates, certificate renewal checks
- **Monthly**: Full system update, performance review
- **Quarterly**: Security audit, disaster recovery test

## Support and Documentation

### Getting Help
- **Documentation**: https://docs.hostpanel.pro
- **Community Forum**: https://community.hostpanel.pro
- **GitHub Issues**: https://github.com/your-repo/hostpanel-pro/issues
- **Discord Support**: https://discord.gg/hostpanel
- **Email Support**: support@hostpanel.pro

### Professional Services
- **Installation Service**: Professional VPS setup
- **Custom Configuration**: Tailored for your needs
- **24/7 Support**: Enterprise support available
- **Training**: Administrator training programs

---

**HostPanel Pro** - Universal VPS hosting control panel for the modern web.
