
# HostPanel Pro - Deployment Guide

## Quick Installation

### One-Line Installation
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/hostpanel-pro/main/scripts/install.sh | sudo bash
```

### Manual Installation
```bash
# Download the installer
wget https://raw.githubusercontent.com/your-repo/hostpanel-pro/main/scripts/install.sh

# Make it executable
chmod +x install.sh

# Run the installer
sudo ./install.sh
```

## VPS Requirements

### Minimum Requirements
- **CPU**: 1 vCPU (2.4 GHz)
- **RAM**: 2 GB
- **Storage**: 20 GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 18.04+, Debian 10+, CentOS 7+, Rocky Linux 8+

### Recommended Requirements
- **CPU**: 2+ vCPU (2.4+ GHz)
- **RAM**: 4+ GB
- **Storage**: 40+ GB NVMe SSD
- **Network**: 1+ Gbps

## Supported Platforms

### VPS Providers
- ✅ DigitalOcean
- ✅ Linode
- ✅ Vultr
- ✅ AWS EC2
- ✅ Google Cloud
- ✅ Microsoft Azure
- ✅ Hetzner Cloud
- ✅ OVHcloud
- ✅ Contabo

### Operating Systems
- ✅ Ubuntu 18.04, 20.04, 22.04, 24.04 LTS
- ✅ Debian 10, 11, 12
- ✅ CentOS 7, 8, Stream 8, 9
- ✅ Rocky Linux 8, 9
- ✅ AlmaLinux 8, 9
- ✅ RHEL 8, 9
- ✅ Fedora 35+
- ✅ OpenSUSE Leap 15.4+

## Post-Installation Configuration

### 1. Access Your Panel
After installation, access your control panel at:
```
http://your-server-ip
```

### 2. Configure Domain (Optional)
```bash
# Point your domain to your server IP
# Then configure nginx with your domain
sudo nano /etc/nginx/sites-available/hostpanel

# Replace server_name _ with your domain
server_name yourdomain.com www.yourdomain.com;

# Restart nginx
sudo systemctl restart nginx
```

### 3. Enable SSL Certificate
```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 4. Configure Email Settings
Edit the environment file:
```bash
sudo nano /opt/hostpanel/.env
```

Update SMTP settings:
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM="HostPanel Pro <noreply@yourdomain.com>"
```

## Service Management

### Control Services
```bash
# HostPanel Pro
sudo systemctl start hostpanel
sudo systemctl stop hostpanel
sudo systemctl restart hostpanel
sudo systemctl status hostpanel

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# MySQL
sudo systemctl restart mysql
sudo systemctl status mysql

# Redis
sudo systemctl restart redis
sudo systemctl status redis
```

### View Logs
```bash
# Application logs
sudo tail -f /var/log/hostpanel/app.log

# System logs
sudo journalctl -u hostpanel -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Security Hardening

### 1. Change Default Passwords
```bash
# MySQL root password
sudo mysql_secure_installation

# HostPanel admin password (via web interface)
```

### 2. Configure Firewall
The installer automatically configures the firewall, but you can customize it:

```bash
# Ubuntu/Debian (UFW)
sudo ufw status
sudo ufw allow from trusted.ip.address

# CentOS/RHEL/Fedora (firewalld)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-source=trusted.ip.address
sudo firewall-cmd --reload
```

### 3. Enable Additional Security
```bash
# Install additional security tools
sudo apt install rkhunter chkrootkit lynis  # Ubuntu/Debian
sudo dnf install rkhunter chkrootkit lynis  # Fedora/CentOS

# Run security audit
sudo lynis audit system
```

## Backup and Restore

### Automated Backups
Backups are automatically created daily at 2:00 AM. Configure retention:

```bash
# Edit backup script
sudo nano /opt/hostpanel/scripts/backup.sh

# Change RETENTION_DAYS value
RETENTION_DAYS=30
```

### Manual Backup
```bash
# Run backup manually
sudo /opt/hostpanel/scripts/backup.sh

# Backup location
ls -la /var/backups/hostpanel/
```

### Restore from Backup
```bash
# Stop services
sudo systemctl stop hostpanel nginx

# Restore database
gunzip < /var/backups/hostpanel/database_YYYYMMDD_HHMMSS.sql.gz | mysql -u hostpanel -p hostpanel

# Restore application files  
cd /opt
sudo tar -xzf /var/backups/hostpanel/application_YYYYMMDD_HHMMSS.tar.gz

# Restore configuration
sudo tar -xzf /var/backups/hostpanel/config_YYYYMMDD_HHMMSS.tar.gz -C /

# Start services
sudo systemctl start nginx hostpanel
```

## Performance Optimization

### 1. System Optimization
```bash
# Optimize system limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. Database Optimization
```bash
# Optimize MySQL
sudo nano /etc/mysql/mysql.conf.d/hostpanel.cnf
```

Add optimization settings:
```ini
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
query_cache_size = 64M
max_connections = 200
```

### 3. Redis Optimization
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Set memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Monitoring

### System Monitoring
The monitoring script runs every 5 minutes and logs to `/var/log/hostpanel/monitor.log`.

```bash
# View monitoring logs
sudo tail -f /var/log/hostpanel/monitor.log

# Check system resources
htop
iotop
```

### Application Monitoring
```bash
# Monitor application performance
sudo systemctl status hostpanel

# Check resource usage
ps aux | grep node
netstat -tlnp | grep :3000
```

## Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check service status and logs
sudo systemctl status hostpanel
sudo journalctl -u hostpanel -n 50

# Check configuration
sudo nano /opt/hostpanel/.env
```

#### 2. Database Connection Issues
```bash
# Test database connection
mysql -u hostpanel -p hostpanel

# Reset database password
sudo mysql -u root -p
ALTER USER 'hostpanel'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;

# Update .env file
sudo nano /opt/hostpanel/.env
```

#### 3. Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot certonly --force-renewal -d yourdomain.com
```

### Performance Issues

#### High CPU Usage
```bash
# Check processes
top -c
ps aux --sort=-%cpu | head -10

# Monitor in real-time
htop
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check for memory leaks
sudo systemctl restart hostpanel
```

#### High Disk Usage
```bash
# Check disk usage
df -h
du -sh /var/log/*
du -sh /var/www/*

# Clean up logs
sudo journalctl --vacuum-time=30d
sudo logrotate -f /etc/logrotate.conf
```

## Updates and Maintenance

### Update HostPanel Pro
```bash
# Backup before updating
sudo /opt/hostpanel/scripts/backup.sh

# Pull latest updates
cd /opt/hostpanel
sudo git pull origin main

# Update dependencies
sudo -u hostpanel npm install

# Restart service
sudo systemctl restart hostpanel
```

### System Updates
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL/Fedora
sudo dnf update -y

# Restart if kernel updated
sudo reboot
```

### Database Maintenance
```bash
# Optimize database tables
mysql -u hostpanel -p hostpanel -e "OPTIMIZE TABLE table_name;"

# Check database integrity
mysql -u hostpanel -p hostpanel -e "CHECK TABLE table_name;"
```

## Support

### Documentation
- Installation Guide: `INSTALLATION.md`
- API Documentation: `/docs/api`
- User Manual: `/docs/user-guide`

### Community Support
- GitHub Issues: [Report Issues](https://github.com/your-repo/hostpanel-pro/issues)
- Community Forum: [Join Discussion](https://community.hostpanel.pro)
- Discord: [Get Help](https://discord.gg/hostpanel)

### Professional Support
- Email: support@hostpanel.pro
- Priority Support: Available for enterprise customers
- Custom Installation: Professional setup service available

---

**HostPanel Pro** - Universal VPS hosting control panel for the modern web.
