
#!/bin/bash
# HostPanel Pro - Universal VPS Installation Script
# Compatible with Ubuntu, Debian, CentOS, Rocky Linux, AlmaLinux, Fedora, OpenSUSE

set -e

# Configuration
HOSTPANEL_USER="hostpanel"
HOSTPANEL_DIR="/opt/hostpanel"
SERVICE_PORT="3000"
DOMAIN=""
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  HostPanel Pro Installation${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Detect OS and distribution
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION_ID=$VERSION_ID
        ID=$ID
    else
        print_error "Cannot detect OS. Please install manually."
        exit 1
    fi
    
    print_status "Detected OS: $OS $VERSION"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
       print_error "This script must be run as root"
       exit 1
    fi
}

# Install dependencies based on distribution
install_dependencies() {
    # Check if the OS is CentOS
    if [ "$ID" != "centos" ]; then
        print_error "This script is only compatible with CentOS. Detected OS: $OS"
        exit 1
    fi

    print_status "Installing system dependencies..."

    # Enable EPEL repository for CentOS
    print_status "Enabling EPEL repository..."
    sudo yum install -y epel-release
    sudo yum update -y

    # Install core dependencies
    print_status "Installing core dependencies..."
    sudo yum install -y curl wget git nginx mysql-server redis \\
                      certbot python3-certbot-nginx firewalld fail2ban \\
                      htop iotop gcc gcc-c++ make unzip

    # Remove potentially conflicting existing nodejs and npm packages
    print_status \"Removing conflicting Node.js packages...\"\
    sudo yum remove -y nodejs npm

    # Install Node.js based on CentOS version
    print_status "Adding NodeSource repository for Node.js..."
    if [[ "$VERSION_ID" == "7" ]]; then
        print_warning "Detected CentOS 7. Installing Node.js 12 (LTS) as Node.js 18 requires newer system libraries."
        curl -fsSL https://rpm.nodesource.com/setup_12.x | bash -
        sudo yum install -y nodejs
    else
        print_status \"Installing Node.js 18.x...\"\
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        sudo yum install -y nodejs
    fi

    # Ensure npm is installed
    sudo yum install -y npm

    print_status "Dependencies installed successfully!"
}

# Create hostpanel user
create_user() {
    print_status "Creating hostpanel user..."
    if ! id "$HOSTPANEL_USER" &>/dev/null; then
        useradd -m -s /bin/bash $HOSTPANEL_USER
        usermod -aG sudo $HOSTPANEL_USER 2>/dev/null || usermod -aG wheel $HOSTPANEL_USER 2>/dev/null || true
    fi
}

# Setup directories
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p $HOSTPANEL_DIR
    mkdir -p /var/log/hostpanel
    mkdir -p /var/backups/hostpanel
    mkdir -p /var/www/html
    
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR
    chown $HOSTPANEL_USER:$HOSTPANEL_USER /var/log/hostpanel
    chown $HOSTPANEL_USER:$HOSTPANEL_USER /var/backups/hostpanel
}

# Download and setup application
setup_application() {
    print_status "Setting up HostPanel Pro application..."
    cd $HOSTPANEL_DIR
    
    # If this is a git repository, clone it
    if [ -n "$GITHUB_REPO" ]; then
        sudo -u $HOSTPANEL_USER git clone $GITHUB_REPO .
    else
        # Create basic application structure
        sudo -u $HOSTPANEL_USER mkdir -p src public scripts
        
        # Create package.json
        cat > package.json << 'EOF'
{
  "name": "hostpanel-pro",
  "version": "2.1.0",
  "description": "Universal VPS Hosting Control Panel",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "redis": "^4.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
EOF
        
        chown $HOSTPANEL_USER:$HOSTPANEL_USER package.json
    fi
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    sudo -u $HOSTPANEL_USER npm install
}

# Setup database
setup_database() {
    print_status "Configuring database..."
    
    # Start MySQL service  
    if command -v systemctl &> /dev/null; then
        systemctl start mysql 2>/dev/null || systemctl start mysqld 2>/dev/null || systemctl start mariadb 2>/dev/null || true
        systemctl enable mysql 2>/dev/null || systemctl enable mysqld 2>/dev/null || systemctl enable mariadb 2>/dev/null || true
    fi
    
    # Secure MySQL installation
    mysql -e "DELETE FROM mysql.user WHERE User='';"
    mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -e "DROP DATABASE IF EXISTS test;"
    mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -e "FLUSH PRIVILEGES;"
    
    # Create database and user
    mysql -e "CREATE DATABASE IF NOT EXISTS hostpanel;"
    mysql -e "CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    mysql -e "GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    cat > $HOSTPANEL_DIR/.env << EOF
# Application Settings
NODE_ENV=production
PORT=$SERVICE_PORT
APP_URL=http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT
APP_NAME="HostPanel Pro"

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostpanel
DB_USER=hostpanel
DB_PASSWORD=$DB_PASSWORD

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Settings
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Email Configuration (Configure with your SMTP settings)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HostPanel Pro <noreply@$(hostname -f)>"

# SSL Configuration
SSL_AUTO=false
SSL_EMAIL=admin@$(hostname -f)

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
EOF
    
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/.env
    chmod 600 $HOSTPANEL_DIR/.env
}

# Create systemd service
create_systemd_service() {
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
EnvironmentFile=$HOSTPANEL_DIR/.env

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$HOSTPANEL_DIR
ReadWritePaths=/var/log/hostpanel
ReadWritePaths=/var/backups/hostpanel
ReadWritePaths=/var/www

[Install]
WantedBy=multi-user.target
EOF
}

# Configure nginx
configure_nginx() {
    print_status "Configuring nginx..."
    
    cat > /etc/nginx/sites-available/hostpanel << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
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
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Static file handling
    location /static/ {
        alias $HOSTPANEL_DIR/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Rate limiting zone
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
EOF
    
    # Enable site
    if [ -d /etc/nginx/sites-enabled ]; then
        if [ -f /etc/nginx/sites-enabled/default ]; then
            rm /etc/nginx/sites-enabled/default
        fi
        ln -sf /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/
    else
        # For CentOS/RHEL/Fedora
        mkdir -p /etc/nginx/conf.d
        cp /etc/nginx/sites-available/hostpanel /etc/nginx/conf.d/hostpanel.conf
    fi
    
    # Test nginx configuration
    nginx -t
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # CentOS firewall
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ftp
    firewall-cmd --permanent --add-service=smtp
    firewall-cmd --permanent --add-service=pop3
    firewall-cmd --permanent --add-service=imap
    firewall-cmd --permanent --add-port=587/tcp
    firewall-cmd --permanent --add-port=465/tcp
    firewall-cmd --permanent --add-port=993/tcp
    firewall-cmd --permanent --add-port=995/tcp
    firewall-cmd --reload
}

# Setup fail2ban
setup_fail2ban() {
    print_status "Configuring fail2ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[hostpanel]
enabled = true
port = http,https
logpath = /var/log/hostpanel/access.log
maxretry = 5
EOF
    
    if command -v systemctl &> /dev/null; then
        systemctl enable fail2ban
        systemctl start fail2ban
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    if command -v systemctl &> /dev/null; then
        systemctl daemon-reload
        
        # Enable and start services
        systemctl enable redis-server 2>/dev/null || systemctl enable redis 2>/dev/null || true
        systemctl enable nginx
        systemctl enable hostpanel
        
        systemctl start redis-server 2>/dev/null || systemctl start redis 2>/dev/null || true
        systemctl start nginx
        systemctl start hostpanel
    fi
}

# Create WordPress files for auto-installer
setup_wordpress_installer() {
    print_status "Setting up WordPress auto-installer..."
    
    mkdir -p $HOSTPANEL_DIR/installers/wordpress
    cd $HOSTPANEL_DIR/installers/wordpress
    
    # Download latest WordPress
    wget https://wordpress.org/latest.tar.gz
    tar -xzf latest.tar.gz
    rm latest.tar.gz
    
    # Create WordPress installer script
    cat > install-wordpress.sh << 'EOF'
#!/bin/bash
# WordPress Installation Script for HostPanel Pro

DOMAIN=$1
PATH_INSTALL=$2
DB_NAME=$3
DB_USER=$4
DB_PASS=$5
WP_ADMIN_USER=$6
WP_ADMIN_PASS=$7
WP_ADMIN_EMAIL=$8

if [ -z "$DOMAIN" ] || [ -z "$DB_NAME" ]; then
    echo "Usage: $0 <domain> <path> <db_name> <db_user> <db_pass> <admin_user> <admin_pass> <admin_email>"
    exit 1
fi

INSTALL_DIR="/var/www/html/$DOMAIN$PATH_INSTALL"
mkdir -p "$INSTALL_DIR"

# Copy WordPress files
cp -r wordpress/* "$INSTALL_DIR/"

# Create wp-config.php
cd "$INSTALL_DIR"
cp wp-config-sample.php wp-config.php

# Generate salts
SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)

# Update wp-config.php
sed -i "s/database_name_here/$DB_NAME/" wp-config.php
sed -i "s/username_here/$DB_USER/" wp-config.php
sed -i "s/password_here/$DB_PASS/" wp-config.php
sed -i "/put your unique phrase here/c\\$SALTS" wp-config.php

# Set permissions
chown -R www-data:www-data "$INSTALL_DIR"
find "$INSTALL_DIR" -type d -exec chmod 755 {} \;
find "$INSTALL_DIR" -type f -exec chmod 644 {} \;

echo "WordPress installed successfully at $INSTALL_DIR"
EOF
    
    chmod +x install-wordpress.sh
    chown -R $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/installers
}

# Create monitoring and backup scripts
create_maintenance_scripts() {
    print_status "Creating maintenance scripts..."
    
    mkdir -p $HOSTPANEL_DIR/scripts
    
    # System monitoring script
    cat > $HOSTPANEL_DIR/scripts/monitor.sh << 'EOF'
#!/bin/bash
# HostPanel Pro - System Monitoring Script

LOGFILE="/var/log/hostpanel/monitor.log"
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
EOF
    
    # Backup script
    cat > $HOSTPANEL_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
# HostPanel Pro - Backup Script

BACKUP_DIR="/var/backups/hostpanel"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u hostpanel -p$(grep DB_PASSWORD /opt/hostpanel/.env | cut -d'=' -f2) hostpanel > $BACKUP_DIR/database_$DATE.sql
gzip $BACKUP_DIR/database_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/application_$DATE.tar.gz -C /opt hostpanel

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/mysql

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x $HOSTPANEL_DIR/scripts/*.sh
    chown -R $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/scripts
    
    # Add crontab entries
    (crontab -l 2>/dev/null; echo "0 2 * * * $HOSTPANEL_DIR/scripts/backup.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * $HOSTPANEL_DIR/scripts/monitor.sh") | crontab -
}

# Final status check and summary
final_status() {
    print_status "Installation completed! Checking services..."
    
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Installation Summary${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # Check service status
    if systemctl is-active --quiet hostpanel; then
        echo -e "HostPanel Pro: ${GREEN}✓ Running${NC}"
    else
        echo -e "HostPanel Pro: ${RED}✗ Not running${NC}"
    fi
    
    if systemctl is-active --quiet nginx; then
        echo -e "Nginx: ${GREEN}✓ Running${NC}"
    else
        echo -e "Nginx: ${RED}✗ Not running${NC}"
    fi
    
    if systemctl is-active --quiet mysql; then
        echo -e "MySQL: ${GREEN}✓ Running${NC}"
    else
        echo -e "MySQL: ${RED}✗ Not running${NC}"
    fi
    
    if systemctl is-active --quiet redis-server || systemctl is-active --quiet redis; then
        echo -e "Redis: ${GREEN}✓ Running${NC}"
    else
        echo -e "Redis: ${RED}✗ Not running${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Access your control panel at:${NC}"
    echo -e "  ${BLUE}http://$(hostname -I | awk '{print $1}')${NC}"
    echo ""
    echo -e "${YELLOW}Important files:${NC}"
    echo -e "  Configuration: ${HOSTPANEL_DIR}/.env"
    echo -e "  Logs: /var/log/hostpanel/"
    echo -e "  Backups: /var/backups/hostpanel/"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Configure your domain in nginx"
    echo -e "  2. Set up SSL certificate with: certbot --nginx -d yourdomain.com"
    echo -e "  3. Configure SMTP settings in .env file"
    echo -e "  4. Review firewall settings"
    echo ""
    echo -e "${GREEN}Installation completed successfully!${NC}"
}

# Main installation process
main() {
    print_header
    
    check_root
    detect_os
    install_dependencies
    create_user
    setup_directories
    setup_application
    setup_database
    create_env_config
    create_systemd_service
    configure_nginx
    configure_firewall
    setup_fail2ban
    setup_wordpress_installer
    create_maintenance_scripts
    start_services
    final_status
}

# Run main installation
main "$@"
EOF

chmod +x scripts/install.sh
