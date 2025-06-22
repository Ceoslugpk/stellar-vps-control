
# HostPanel Pro - Installation Guide

A comprehensive web hosting control panel application that replicates the core functionalities of cPanel and Plesk, designed for VPS deployment.

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS, Debian 11, or CentOS 8
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB free space
- **Network**: Public IP address

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS (recommended)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: Public IP with reverse DNS

## Prerequisites

Before installing HostPanel Pro, ensure your system has the following:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required system packages
sudo apt install -y curl wget git nginx nodejs npm certbot python3-certbot-nginx ufw fail2ban
```

## Installation Steps

### Step 1: System Preparation

1. **Create a dedicated user:**
```bash
sudo adduser hostpanel
sudo usermod -aG sudo hostpanel
su - hostpanel
```

2. **Configure firewall:**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 8080/tcp  # HostPanel Pro default port
```

### Step 2: Install Node.js and Dependencies

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Download and Install HostPanel Pro

```bash
# Clone the repository
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro

# Install dependencies
npm install

# Build the production version
npm run build
```

### Step 4: Configure Environment

```bash
# Create configuration directory
sudo mkdir -p /etc/hostpanel
sudo chown hostpanel:hostpanel /etc/hostpanel

# Copy configuration template
cp config/hostpanel.conf.example /etc/hostpanel/hostpanel.conf

# Edit configuration
sudo nano /etc/hostpanel/hostpanel.conf
```

### Step 5: Database Setup

```bash
# Install MySQL/MariaDB
sudo apt install -y mariadb-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE hostpanel;
CREATE USER 'hostpanel'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Web Server Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hostpanel
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Step 8: System Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/hostpanel.service
```

```ini
[Unit]
Description=HostPanel Pro Control Panel
After=network.target

[Service]
Type=simple
User=hostpanel
WorkingDirectory=/home/hostpanel/hostpanel-pro
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable hostpanel
sudo systemctl start hostpanel
```

## Docker Installation (Alternative)

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Docker Deployment
```bash
# Clone repository
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro

# Start with Docker Compose
docker-compose up -d
```

## Configuration

### Main Configuration File (`/etc/hostpanel/hostpanel.conf`)

```ini
[general]
server_name = your-domain.com
admin_email = admin@your-domain.com
timezone = UTC

[database]
host = localhost
port = 3306
name = hostpanel
user = hostpanel
password = secure_password

[security]
session_timeout = 1800
max_login_attempts = 5
enable_2fa = true

[backup]
backup_path = /var/backups/hostpanel
retention_days = 30
auto_backup = true

[ssl]
auto_ssl = true
ssl_provider = letsencrypt
ssl_email = admin@your-domain.com
```

## First-Time Setup

1. **Access the web interface:**
   - Open your browser and go to `https://your-domain.com`
   - Complete the initial setup wizard

2. **Create admin account:**
   - Username: admin
   - Password: (strong password)
   - Email: your-email@domain.com

3. **Configure system settings:**
   - Set timezone
   - Configure email settings
   - Set up backup schedule

## Security Hardening

### Firewall Configuration
```bash
# Configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 8080/tcp
sudo ufw enable
```

### Fail2Ban Configuration
```bash
# Configure Fail2Ban for HostPanel
sudo nano /etc/fail2ban/jail.local
```

```ini
[hostpanel]
enabled = true
port = 8080
logpath = /var/log/hostpanel/access.log
maxretry = 3
bantime = 3600
```

### SSH Hardening
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

## Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update HostPanel Pro
cd /home/hostpanel/hostpanel-pro
git pull origin main
npm install
npm run build
sudo systemctl restart hostpanel
```

### Backup
```bash
# Manual backup
sudo /usr/local/bin/hostpanel-backup

# Automated backup (cron)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/hostpanel-backup
```

### Log Management
```bash
# View logs
sudo journalctl -u hostpanel -f

# Log rotation
sudo nano /etc/logrotate.d/hostpanel
```

```
/var/log/hostpanel/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Troubleshooting

### Common Issues

1. **Service won't start:**
```bash
sudo systemctl status hostpanel
sudo journalctl -u hostpanel
```

2. **Database connection error:**
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u hostpanel -p hostpanel
```

3. **SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew --nginx
```

4. **Permission issues:**
```bash
# Fix file permissions
sudo chown -R hostpanel:hostpanel /home/hostpanel/hostpanel-pro
sudo chmod -R 755 /home/hostpanel/hostpanel-pro
```

### Performance Optimization

1. **Enable caching:**
```bash
# Install Redis
sudo apt install redis-server
sudo systemctl enable redis-server
```

2. **Database optimization:**
```bash
# MySQL tuning
sudo mysql_secure_installation
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

3. **Nginx optimization:**
```bash
# Enable gzip compression
sudo nano /etc/nginx/nginx.conf
```

## Uninstallation

```bash
# Stop services
sudo systemctl stop hostpanel
sudo systemctl disable hostpanel

# Remove files
sudo rm -rf /home/hostpanel/hostpanel-pro
sudo rm -f /etc/systemd/system/hostpanel.service
sudo rm -f /etc/nginx/sites-enabled/hostpanel
sudo rm -f /etc/nginx/sites-available/hostpanel

# Remove database
mysql -u root -p -e "DROP DATABASE hostpanel; DROP USER 'hostpanel'@'localhost';"

# Remove SSL certificate
sudo certbot delete --cert-name your-domain.com
```

## Support and Documentation

- **Official Documentation**: https://docs.hostpanel.pro
- **Community Forum**: https://community.hostpanel.pro
- **GitHub Issues**: https://github.com/your-repo/hostpanel-pro/issues
- **Security Reports**: security@hostpanel.pro

For additional support, please refer to the troubleshooting section or contact our support team.
