#!/bin/bash
# HostPanel Pro - Universal VPS Installation Script
# Compatible with Ubuntu, Debian, CentOS, Rocky Linux, AlmaLinux, Fedora, OpenSUSEAdd commentMore actions

set -e

# --- Configuration ---
# Configuration
HOSTPANEL_USER="hostpanel"
HOSTPANEL_DIR="/opt/hostpanel"
SERVICE_PORT="3000"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=\+\/')
DOMAIN=""
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)
# The GITHUB_REPO environment variable can be set to clone a specific repo.
# Example: export GITHUB_REPO="https://github.com/user/repo.git"

# --- Colors for output ---
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}
@@ -37,134 +36,134 @@ print_error() {

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   HostPanel Pro Installation   ${NC}"
    echo -e "${BLUE}  HostPanel Pro Installation${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# --- Pre-flight Checks ---
check_root() {
    if [[ $EUID -ne 0 ]]; then
       print_error "This script must be run as root or with sudo."
       exit 1
    fi
}

# Detect OS and distribution
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION_ID=$VERSION_ID
        ID_LIKE=${ID_LIKE:-$ID}
        ID=$ID
    else
        print_error "Cannot detect operating system. Exiting."
        print_error "Cannot detect OS. Please install manually."
        exit 1
    fi
    print_status "Detected OS: $OS $VERSION_ID"
    
    print_status "Detected OS: $OS $VERSION"
}

# --- Installation Steps ---
# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
       print_error "This script must be run as root"
       exit 1
    fi
}

# Install dependencies based on distribution
install_dependencies() {
    print_status "Updating package lists and installing system dependencies..."

    case "$ID_LIKE" in
        *debian*|*ubuntu*)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update -y
            apt-get install -y curl wget git nginx mariadb-server redis-server certbot python3-certbot-nginx firewalld fail2ban htop iotop build-essential unzip
            
            print_status "Installing Node.js v18..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            apt-get install -y nodejs
            ;;
        *rhel*|*fedora*|*centos*)
            # For CentOS, Rocky, AlmaLinux, Fedora
            yum update -y
            yum install -y epel-release || true # Fails gracefully if not needed
            
            # CentOS 7 has different package names and requirements
            if [[ "$VERSION_ID" == "7" ]]; then
                print_warning "Detected CentOS 7. Using compatible packages (python2-certbot, nodejs-16)."
                yum install -y curl wget git nginx mariadb-server redis certbot python2-certbot-nginx firewalld fail2ban htop iotop gcc gcc-c++ make unzip
                
                print_status "Installing Node.js v16 (LTS for CentOS 7 compatibility)..."
                curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
            else
                yum install -y curl wget git nginx mariadb-server redis certbot python3-certbot-nginx firewalld fail2ban htop iotop gcc gcc-c++ make unzip
                
                print_status "Installing Node.js v18..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
            fi
            
            yum remove -y nodejs npm # Remove conflicting old versions
            yum install -y nodejs
            ;;
        *suse*)
            zypper refresh
            zypper install -y curl wget git nginx mariadb redis certbot python3-certbot-nginx firewalld fail2ban htop iotop gcc make unzip patterns-devel-base_basis
            
            print_status "Installing Node.js v18..."
            zypper remove -y nodejs npm
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
            zypper install -y nodejs
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
    sudo yum install -y curl wget git nginx mysql-server redis certbot python3-certbot-nginx firewalld fail2ban htop iotop gcc gcc-c++ make unzip

    # Remove potentially conflicting existing nodejs and npm packages
    print_status "Removing conflicting Node.js packages..."
    sudo yum remove -y nodejs npm

    # Install Node.js based on CentOS version
    print_status "Adding NodeSource repository for Node.js..."
    case "$VERSION_ID" in # Corrected case statement
        "7")
            print_warning "Detected CentOS 7. Installing Node.js 12 (LTS) as Node.js 18 requires newer system libraries."
            curl -fsSL -o /tmp/nodesource_setup.sh https://rpm.nodesource.com/setup_12.x
            sudo bash /tmp/nodesource_setup.sh
            ;;
        *)
            print_error "Unsupported distribution: $OS"
            exit 1
        *) # For CentOS 8, 9, and other future versions
            print_status "Installing Node.js 18.x..."
            curl -fsSL -o /tmp/nodesource_setup.sh https://rpm.nodesource.com/setup_18.x
 sudo bash /tmp/nodesource_setup.sh
            ;;
    esac

    print_status "Dependencies installed successfully."
    # Install Node.js and npm after adding the repository
    sudo yum install -y nodejs
    sudo yum install -y npm

    print_status "Dependencies installed successfully!"
}

# Create hostpanel user
create_user() {
    print_status "Creating dedicated user '$HOSTPANEL_USER'..."
    print_status "Creating hostpanel user..."
    if ! id "$HOSTPANEL_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$HOSTPANEL_USER"
        # Grant sudo for specific tasks if needed, wheel for RHEL/SUSE, sudo for Debian
        usermod -aG sudo "$HOSTPANEL_USER" 2>/dev/null || usermod -aG wheel "$HOSTPANEL_USER"
        useradd -m -s /bin/bash $HOSTPANEL_USER
        usermod -aG sudo $HOSTPANEL_USER 2>/dev/null || usermod -aG wheel $HOSTPANEL_USER 2>/dev/null || true
    fi
}

# Setup directories
setup_directories() {
    print_status "Setting up application directories..."
    mkdir -p "$HOSTPANEL_DIR" /var/log/hostpanel /var/backups/hostpanel /var/www/html
    print_status "Setting up directories..."
    mkdir -p $HOSTPANEL_DIR
    mkdir -p /var/log/hostpanel
    mkdir -p /var/backups/hostpanel
    mkdir -p /var/www/html

    chown -R "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR" /var/log/hostpanel /var/backups/hostpanel
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
        print_status "Cloning from GITHUB_REPO: $GITHUB_REPO"
        sudo -u "$HOSTPANEL_USER" git clone "$GITHUB_REPO" "$HOSTPANEL_DIR"
        sudo -u $HOSTPANEL_USER git clone $GITHUB_REPO .
    else
        print_status "Creating boilerplate application structure..."
        sudo -u "$HOSTPANEL_USER" mkdir -p "$HOSTPANEL_DIR"/{src,public,scripts}
        # Create basic application structure
        sudo -u $HOSTPANEL_USER mkdir -p src public scripts

        # Create a basic package.json
        sudo -u "$HOSTPANEL_USER" tee "$HOSTPANEL_DIR/package.json" > /dev/null << 'EOF'
        # Create package.json
        cat > package.json << 'EOF'
{
  "name": "hostpanel-pro",
  "version": "2.1.0",
  "description": "Universal VPS Hosting Control Panel",
  "main": "dist/server.js",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "redis": "^4.6.0"
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "redis": "^4.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
@@ -175,43 +174,48 @@ setup_application() {
  }
}
EOF
        
        chown $HOSTPANEL_USER:$HOSTPANEL_USER package.json
    fi

    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    cd "$HOSTPANEL_DIR"
    sudo -u "$HOSTPANEL_USER" npm install
    sudo -u $HOSTPANEL_USER npm install
}

# Setup database
setup_database() {
    print_status "Starting and configuring database..."
    print_status "Configuring database..."

    # Start and enable MariaDB/MySQL
    systemctl enable mariadb --now 2>/dev/null || systemctl enable mysql --now 2>/dev/null || systemctl enable mysqld --now
    # Start MySQL service  
    if command -v systemctl &> /dev/null; then
        systemctl start mysql 2>/dev/null || systemctl start mysqld 2>/dev/null || systemctl start mariadb 2>/dev/null || true
        systemctl enable mysql 2>/dev/null || systemctl enable mysqld 2>/dev/null || systemctl enable mariadb 2>/dev/null || true
    fi

    # Basic non-interactive security
    print_status "Securing database and creating application user..."
    mysql -u root -e "DELETE FROM mysql.user WHERE User='';"
    mysql -u root -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -u root -e "DROP DATABASE IF EXISTS test;"
    mysql -u root -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    # Secure MySQL installation
    mysql -e "DELETE FROM mysql.user WHERE User='';"
    mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -e "DROP DATABASE IF EXISTS test;"
    mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -e "FLUSH PRIVILEGES;"

    # Create database and user
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS hostpanel;"
    mysql -u root -e "CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';"
    mysql -u root -e "FLUSH PRIVILEGES;"
    mysql -e "CREATE DATABASE IF NOT EXISTS hostpanel;"
    mysql -e "CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    mysql -e "GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration file..."
    local IP_ADDRESS
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    tee "$HOSTPANEL_DIR/.env" > /dev/null << EOF
    print_status "Creating environment configuration..."
    
    cat > $HOSTPANEL_DIR/.env << EOF
# Application Settings
NODE_ENV=production
PORT=$SERVICE_PORT
APP_URL=http://${DOMAIN:-$IP_ADDRESS}
APP_URL=http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT
APP_NAME="HostPanel Pro"

# Database Configuration
@@ -236,62 +240,82 @@ SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="HostPanel Pro <noreply@${DOMAIN:-$IP_ADDRESS}>"
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

    chown "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR/.env"
    chmod 600 "$HOSTPANEL_DIR/.env"
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/.env
    chmod 600 $HOSTPANEL_DIR/.env
}

# Create systemd service
create_systemd_service() {
    print_status "Creating systemd service for HostPanel..."
    tee /etc/systemd/system/hostpanel.service > /dev/null << EOF
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/hostpanel.service << EOF
[Unit]
Description=HostPanel Pro Control Panel
After=network.target mariadb.service redis.service
Wants=mariadb.service redis.service
After=network.target mysql.service redis.service
Wants=mysql.service redis.service

[Service]
Type=simple
User=$HOSTPANEL_USER
Group=$HOSTPANEL_USER
WorkingDirectory=$HOSTPANEL_DIR
ExecStart=$(command -v npm) start
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$SERVICE_PORT
EnvironmentFile=$HOSTPANEL_DIR/.env

# Security Hardening
# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$HOSTPANEL_DIR /var/log/hostpanel /var/backups/hostpanel /var/www
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
    print_status "Configuring Nginx reverse proxy..."
    
    # Define server name based on user input or IP
    local SERVER_NAME="${DOMAIN:-_}"
    print_status "Configuring nginx..."

    local NGINX_CONF_CONTENT
    NGINX_CONF_CONTENT=$(cat <<EOF
# Rate limiting zone, defined once
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    cat > /etc/nginx/sites-available/hostpanel << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
@@ -305,202 +329,329 @@ server {
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 900s; # 15 minutes
        proxy_read_timeout 86400;
        
        # Apply rate limiting
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Static file handling (optional, if your app serves static files)
    # Static file handling
    location /static/ {
        alias $HOSTPANEL_DIR/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
)

    if [ -d /etc/nginx/sites-available ]; then
        # Debian/Ubuntu style
        echo "$NGINX_CONF_CONTENT" > /etc/nginx/sites-available/hostpanel
        rm -f /etc/nginx/sites-enabled/default
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
        # RHEL/SUSE style
        echo "$NGINX_CONF_CONTENT" > /etc/nginx/conf.d/hostpanel.conf
        # Safely remove default config if it exists
        rm -f /etc/nginx/conf.d/default.conf
        # For CentOS/RHEL/Fedora
        mkdir -p /etc/nginx/conf.d
        cp /etc/nginx/sites-available/hostpanel /etc/nginx/conf.d/hostpanel.conf
    fi

    print_status "Testing Nginx configuration..."
    sudo nginx -t
    # Test nginx configuration
    nginx -t
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    systemctl enable firewalld --now

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
    
    print_warning "Firewall enabled for SSH, HTTP, and HTTPS. Review and add other ports if needed."
}

# Setup fail2ban
setup_fail2ban() {
    print_status "Configuring Fail2Ban..."
    tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
    print_status "Configuring fail2ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
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

    systemctl enable fail2ban --now
    if command -v systemctl &> /dev/null; then
        systemctl enable fail2ban
        systemctl start fail2ban
    fi
}

setup_wordpress_installer() {
    print_status "Setting up WordPress one-click installer..."
# Start services
start_services() {
    print_status "Starting services..."

    # Determine web server user
    local WEB_USER="www-data" # Default for Debian/Ubuntu
    case "$ID_LIKE" in
        *rhel*|*fedora*|*centos*|*suse*) WEB_USER="nginx" ;;
    esac
    print_status "Detected web server user as: $WEB_USER"
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

    local WP_INSTALLER_DIR="$HOSTPANEL_DIR/installers/wordpress"
    mkdir -p "$WP_INSTALLER_DIR"
# Create WordPress files for auto-installer
setup_wordpress_installer() {
    print_status "Setting up WordPress auto-installer..."
    
    mkdir -p $HOSTPANEL_DIR/installers/wordpress
    cd $HOSTPANEL_DIR/installers/wordpress

    print_status "Downloading latest WordPress..."
    wget -qO- https://wordpress.org/latest.tar.gz | tar -xz -C "$WP_INSTALLER_DIR"
    # Download latest WordPress
    wget https://wordpress.org/latest.tar.gz
    tar -xzf latest.tar.gz
    rm latest.tar.gz

    # Create the installer script
    tee "$WP_INSTALLER_DIR/install-wordpress.sh" > /dev/null <<EOF
    # Create WordPress installer script
    cat > install-wordpress.sh << 'EOF'
#!/bin/bash
# WordPress Installation Script for HostPanel Pro
set -e

DOMAIN="\$1"
INSTALL_PATH="/var/www/html/\$DOMAIN"

if [ -z "\$DOMAIN" ]; then
    echo "Usage: \$0 <domain-name>"
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

mkdir -p "\$INSTALL_PATH"
cp -r ${WP_INSTALLER_DIR}/wordpress/* "\$INSTALL_PATH/"
cd "\$INSTALL_PATH"
INSTALL_DIR="/var/www/html/$DOMAIN$PATH_INSTALL"
mkdir -p "$INSTALL_DIR"

# Copy WordPress files
cp -r wordpress/* "$INSTALL_DIR/"

# Create wp-config.php
cd "$INSTALL_DIR"
cp wp-config-sample.php wp-config.php

# Generate salts
SALTS=\$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
sed -i "/put your unique phrase here/c\\\$SALTS" wp-config.php
SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)

# Note: DB credentials must be configured manually in wp-config.php by the user
# or passed as arguments to a more advanced version of this script.
# Update wp-config.php
sed -i "s/database_name_here/$DB_NAME/" wp-config.php
sed -i "s/username_here/$DB_USER/" wp-config.php
sed -i "s/password_here/$DB_PASS/" wp-config.php
sed -i "/put your unique phrase here/c\\$SALTS" wp-config.php

# Set permissions
chown -R ${WEB_USER}:${WEB_USER} "\$INSTALL_PATH"
find "\$INSTALL_PATH" -type d -exec chmod 755 {} \\;
find "\$INSTALL_PATH" -type f -exec chmod 644 {} \\;
chown -R www-data:www-data "$INSTALL_DIR"
find "$INSTALL_DIR" -type d -exec chmod 755 {} \;
find "$INSTALL_DIR" -type f -exec chmod 644 {} \;

echo "WordPress files installed for \$DOMAIN. Configure wp-config.php and your web server."
echo "WordPress installed successfully at $INSTALL_DIR"
EOF

    chmod +x "$WP_INSTALLER_DIR/install-wordpress.sh"
    chown -R "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR/installers"
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

start_services() {
    print_status "Reloading systemd, enabling and starting services..."
    systemctl daemon-reload
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

    systemctl enable redis --now 2>/dev/null || systemctl enable redis-server --now
    systemctl enable nginx --now
    systemctl enable hostpanel --now
    chmod +x $HOSTPANEL_DIR/scripts/*.sh
    chown -R $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/scripts
    
    # Add crontab entries
    (crontab -l 2>/dev/null; echo "0 2 * * * $HOSTPANEL_DIR/scripts/backup.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * $HOSTPANEL_DIR/scripts/monitor.sh") | crontab -
}

final_summary() {
    print_status "Finalizing installation..."
# Final status check and summary
final_status() {
    print_status "Installation completed! Checking services..."

    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    Installation Summary        ${NC}"
    echo -e "${BLUE}  Installation Summary${NC}"
    echo -e "${BLUE}================================${NC}"

    # Check service statuses
    for service in hostpanel nginx mariadb redis fail2ban; do
        if systemctl is-active --quiet "$service" || \
           ( [[ "$service" == "mariadb" ]] && (systemctl is-active --quiet "mysql" || systemctl is-active --quiet "mysqld") ) || \
           ( [[ "$service" == "redis" ]] && systemctl is-active --quiet "redis-server" ); then
            echo -e " ✓ $service: ${GREEN}Active${NC}"
        else
            echo -e " ✗ $service: ${RED}Inactive${NC}"
        fi
    done
    # Check service status
    if systemctl is-active --quiet hostpanel; then
        echo -e "HostPanel Pro: ${GREEN}✓ Running${NC}"
    else
        echo -e "HostPanel Pro: ${RED}✗ Not running${NC}"
    fi

    local IP_ADDRESS
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}Access your HostPanel Pro instance at:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  => ${BLUE}http://${DOMAIN}${NC}"
    if systemctl is-active --quiet nginx; then
        echo -e "Nginx: ${GREEN}✓ Running${NC}"
    else
        echo -e "  => ${BLUE}http://${IP_ADDRESS}${NC}"
        echo -e "Nginx: ${RED}✗ Not running${NC}"
    fi

    echo ""
    echo -e "${YELLOW}IMPORTANT NOTES & CREDENTIALS:${NC}"
    echo -e "  - HostPanel Directory: ${HOSTPANEL_DIR}"
    echo -e "  - Environment Config:  ${HOSTPANEL_DIR}/.env"
    echo -e "  - Database Password:   ${DB_PASSWORD} (Saved in .env)"
    if systemctl is-active --quiet mysql; then
        echo -e "MySQL: ${GREEN}✓ Running${NC}"
    else
        echo -e "MySQL: ${RED}✗ Not running${NC}"
    fi

    echo ""
    echo -e "${YELLOW}RECOMMENDED NEXT STEPS:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  1. Point your domain's DNS A record to: ${IP_ADDRESS}"
        echo -e "  2. Secure your site with an SSL certificate:"
        if [[ "$VERSION_ID" == "7" ]]; then
            echo -e "     ${GREEN}sudo certbot --nginx -d ${DOMAIN}${NC}"
        else
            echo -e "     ${GREEN}sudo certbot --nginx -d ${DOMAIN}${NC}"
        fi
    if systemctl is-active --quiet redis-server || systemctl is-active --quiet redis; then
        echo -e "Redis: ${GREEN}✓ Running${NC}"
    else
        echo -e "  1. To use a domain name, re-run this script or manually edit:"
        echo -e "     - ${HOSTPANEL_DIR}/.env (update APP_URL)"
        echo -e "     - Your Nginx config file (update server_name)"
        echo -e "Redis: ${RED}✗ Not running${NC}"
    fi
    echo -e "  3. Configure your SMTP mail settings in ${HOSTPANEL_DIR}/.env"
    
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

# --- Main Execution Logic ---
# Main installation process
main() {
    print_header

    read -p "Enter the domain name for HostPanel (e.g., panel.example.com) or leave blank to use IP: " DOMAIN
    
    check_root
    detect_os
    
    install_dependencies
    create_user
    setup_directories
@@ -512,9 +663,13 @@ main() {
    configure_firewall
    setup_fail2ban
    setup_wordpress_installer
    
    create_maintenance_scripts
    start_services
    final_summary
    final_status
}

# Run main installation
main "$@"
EOF

chmod +x scripts/install.sh
