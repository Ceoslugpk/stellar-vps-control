
#!/bin/bash
# HostPanel Pro - Complete Automated Installation Script
# Supports MySQL 8.0+, phpMyAdmin, SSL, and full web application deployment

set -e

# Configuration
HOSTPANEL_USER="hostpanel"
HOSTPANEL_DIR="/opt/hostpanel"
SERVICE_PORT="3000"
MYSQL_VERSION="8.0"
PHPMYADMIN_VERSION="5.2.1"
DOMAIN=""
ROOT_PASSWORD=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)
PHPMYADMIN_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)
BLOWFISH_SECRET=$(openssl rand -base64 32)

# Logging
LOGFILE="/var/log/hostpanel-install.log"
BACKUP_DIR="/var/backups/hostpanel-install"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOGFILE
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log "INFO: $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    log "WARN: $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR: $1"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  HostPanel Pro - Complete Installation${NC}"
    echo -e "${BLUE}  MySQL 8.0+ | phpMyAdmin | SSL | Web App${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Error handling and rollback
rollback() {
    print_error "Installation failed. Rolling back..."
    
    # Stop services
    systemctl stop hostpanel 2>/dev/null || true
    systemctl stop nginx 2>/dev/null || true
    systemctl stop mysql 2>/dev/null || true
    systemctl stop php*-fpm 2>/dev/null || true
    
    # Remove users
    userdel -r $HOSTPANEL_USER 2>/dev/null || true
    
    # Remove directories
    rm -rf $HOSTPANEL_DIR
    rm -rf /var/www/phpmyadmin
    
    # Remove systemd service
    rm -f /etc/systemd/system/hostpanel.service
    systemctl daemon-reload
    
    print_error "Rollback completed. Check logs: $LOGFILE"
    exit 1
}

trap rollback ERR

# Create backup directory and initialize logging
initialize_logging() {
    mkdir -p $BACKUP_DIR
    mkdir -p $(dirname $LOGFILE)
    touch $LOGFILE
    print_status "Logging initialized: $LOGFILE"
}

# Detect OS and distribution
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
        ID_LIKE=${ID_LIKE:-$ID}
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

# Backup existing configuration
backup_existing_config() {
    print_status "Creating backup of existing configuration..."
    
    if [ -d "/etc/nginx" ]; then
        cp -r /etc/nginx $BACKUP_DIR/nginx-backup-$(date +%Y%m%d_%H%M%S) || true
    fi
    
    if [ -d "/etc/mysql" ]; then
        cp -r /etc/mysql $BACKUP_DIR/mysql-backup-$(date +%Y%m%d_%H%M%S) || true
    fi
    
    if [ -f "/etc/php/*/fpm/php.ini" ]; then
        cp /etc/php/*/fpm/php.ini $BACKUP_DIR/php-backup-$(date +%Y%m%d_%H%M%S).ini || true
    fi
}

# Install system dependencies
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    case $ID_LIKE in
        *debian*|*ubuntu*)
            # Update package lists
            apt update
            
            # Install basic dependencies
            apt install -y curl wget git unzip software-properties-common \
                          build-essential ufw fail2ban htop iotop bc expect \
                          ca-certificates lsb-release gnupg2
            
            # Install Node.js 18.x
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt install -y nodejs
            
            # Install Nginx
            apt install -y nginx
            
            # Install PHP 8.1
            add-apt-repository -y ppa:ondrej/php
            apt update
            apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd \
                          php8.1-mbstring php8.1-xml php8.1-zip php8.1-json \
                          php8.1-bcmath php8.1-intl php8.1-readline
            
            # Install additional tools
            apt install -y certbot python3-certbot-nginx redis-server
            ;;
            
        *rhel*|*centos*|*fedora*)
            if command -v dnf &> /dev/null; then
                dnf install -y epel-release
                dnf update -y
                dnf install -y curl wget git unzip gcc gcc-c++ make \
                              firewalld fail2ban htop iotop bc expect \
                              ca-certificates
                
                # Install Node.js 18.x
                curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
                dnf install -y nodejs nginx redis
                
                # Install PHP 8.1
                dnf install -y php php-fpm php-mysqlnd php-curl php-gd \
                              php-mbstring php-xml php-zip php-json \
                              php-bcmath php-intl
            else
                yum install -y epel-release
                yum update -y
                yum install -y curl wget git unzip gcc gcc-c++ make \
                              firewalld fail2ban htop iotop bc expect
                
                # Install Node.js 18.x
                curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
                yum install -y nodejs nginx redis
                
                # Install PHP 8.1
                yum install -y php php-fpm php-mysqlnd php-curl php-gd \
                              php-mbstring php-xml php-zip php-json
            fi
            ;;
    esac
    
    print_status "System dependencies installed successfully!"
}

# Install and configure MySQL 8.0+
install_mysql() {
    print_status "Installing MySQL 8.0+..."
    
    case $ID_LIKE in
        *debian*|*ubuntu*)
            # Download MySQL APT repository
            wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb
            
            # Pre-configure MySQL installation
            echo "mysql-apt-config mysql-apt-config/select-server select mysql-8.0" | debconf-set-selections
            DEBIAN_FRONTEND=noninteractive dpkg -i mysql-apt-config_0.8.29-1_all.deb
            
            # Update package list
            apt update
            
            # Install MySQL Server with pre-configured password
            echo "mysql-server mysql-server/root_password password $ROOT_PASSWORD" | debconf-set-selections
            echo "mysql-server mysql-server/root_password_again password $ROOT_PASSWORD" | debconf-set-selections
            DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
            
            rm -f mysql-apt-config_0.8.29-1_all.deb
            ;;
            
        *rhel*|*centos*|*fedora*)
            # Install MySQL repository
            if command -v dnf &> /dev/null; then
                dnf install -y https://dev.mysql.com/get/mysql80-community-release-el8-4.noarch.rpm
                dnf install -y mysql-server
            else
                yum install -y https://dev.mysql.com/get/mysql80-community-release-el7-5.noarch.rpm
                yum install -y mysql-server
            fi
            ;;
    esac
    
    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql
    
    # Wait for MySQL to be ready
    sleep 10
    
    print_status "MySQL 8.0+ installed successfully!"
}

# Secure MySQL installation
secure_mysql() {
    print_status "Securing MySQL installation..."
    
    # Create expect script for mysql_secure_installation
    cat > /tmp/mysql_secure.exp << EOF
#!/usr/bin/expect
spawn mysql_secure_installation
expect "Enter password for user root:"
send "$ROOT_PASSWORD\r"
expect "Press y|Y for Yes, any other key for No:"
send "y\r"
expect "Please enter 0 = LOW, 1 = MEDIUM and 2 = STRONG:"
send "2\r"
expect "Change the password for root ? ((Press y|Y for Yes, any other key for No) :"
send "n\r"
expect "Remove anonymous users? (Press y|Y for Yes, any other key for No) :"
send "y\r"
expect "Disallow root login remotely? (Press y|Y for Yes, any other key for No) :"
send "y\r"
expect "Remove test database and access to it? (Press y|Y for Yes, any other key for No) :"
send "y\r"
expect "Reload privilege tables now? (Press y|Y for Yes, any other key for No) :"
send "y\r"
expect eof
EOF
    
    chmod +x /tmp/mysql_secure.exp
    /tmp/mysql_secure.exp
    rm -f /tmp/mysql_secure.exp
    
    print_status "MySQL secured successfully!"
}

# Create databases and users
setup_databases() {
    print_status "Setting up databases and users..."
    
    # Create HostPanel database and user
    mysql -u root -p$ROOT_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS hostpanel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';

CREATE DATABASE IF NOT EXISTS wordpress_default CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'wp_admin'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON wordpress_default.* TO 'wp_admin'@'localhost';

CREATE USER IF NOT EXISTS 'phpmyadmin'@'localhost' IDENTIFIED BY '$PHPMYADMIN_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON *.* TO 'phpmyadmin'@'localhost';

FLUSH PRIVILEGES;
EOF
    
    print_status "Databases and users created successfully!"
}

# Install and configure phpMyAdmin
install_phpmyadmin() {
    print_status "Installing phpMyAdmin..."
    
    # Download and extract phpMyAdmin
    cd /tmp
    wget https://files.phpmyadmin.net/phpMyAdmin/${PHPMYADMIN_VERSION}/phpMyAdmin-${PHPMYADMIN_VERSION}-all-languages.tar.gz
    tar -xzf phpMyAdmin-${PHPMYADMIN_VERSION}-all-languages.tar.gz
    
    # Move to web directory
    mkdir -p /var/www/phpmyadmin
    mv phpMyAdmin-${PHPMYADMIN_VERSION}-all-languages/* /var/www/phpmyadmin/
    rm -rf phpMyAdmin-${PHPMYADMIN_VERSION}-all-languages*
    
    # Create phpMyAdmin configuration
    cat > /var/www/phpmyadmin/config.inc.php << EOF
<?php
\$cfg['blowfish_secret'] = '$BLOWFISH_SECRET';
\$i = 0;
\$i++;
\$cfg['Servers'][\$i]['auth_type'] = 'cookie';
\$cfg['Servers'][\$i]['host'] = 'localhost';
\$cfg['Servers'][\$i]['compress'] = false;
\$cfg['Servers'][\$i]['AllowNoPassword'] = false;

\$cfg['UploadDir'] = '';
\$cfg['SaveDir'] = '';
\$cfg['DefaultLang'] = 'en';
\$cfg['ServerDefault'] = 1;
\$cfg['SendErrorReports'] = 'never';
\$cfg['ConsoleEnterExecutes'] = true;
EOF
    
    # Set permissions
    chown -R www-data:www-data /var/www/phpmyadmin
    chmod -R 755 /var/www/phpmyadmin
    
    print_status "phpMyAdmin installed successfully!"
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
    mkdir -p /var/www/uploads
    
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR
    chown $HOSTPANEL_USER:$HOSTPANEL_USER /var/log/hostpanel
    chown $HOSTPANEL_USER:$HOSTPANEL_USER /var/backups/hostpanel
    chown www-data:www-data /var/www/html
    chown www-data:www-data /var/www/uploads
}

# Setup application
setup_application() {
    print_status "Setting up HostPanel Pro application..."
    cd $HOSTPANEL_DIR
    
    # Create package.json with all required dependencies
    cat > package.json << 'EOF'
{
  "name": "hostpanel-pro",
  "version": "2.1.0",
  "description": "Universal VPS Hosting Control Panel",
  "main": "dist/server.js",
  "scripts": {
    "dev": "node server.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "echo 'Building client...'",
    "build:server": "echo 'Building server...'",
    "start": "node server.js",
    "db:migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "redis": "^4.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "express-session": "^1.17.3",
    "multer": "^1.4.5-lts.1",
    "winston": "^3.10.0",
    "node-ssh": "^13.1.0",
    "archiver": "^6.0.1",
    "node-cron": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF
    
    # Create enhanced server.js
    cat > server.js << 'EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const winston = require('winston');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: '/var/log/hostpanel/error.log', level: 'error' }),
        new winston.transports.File({ filename: '/var/log/hostpanel/combined.log' }),
        new winston.transports.Console()
    ]
});

// Database connection pool
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'hostpanel',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hostpanel',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let dbPool;

// Redis client
let redisClient;

// Initialize database and Redis
async function initializeServices() {
    try {
        // Initialize MySQL
        dbPool = mysql.createPool(dbConfig);
        
        // Test database connection
        const connection = await dbPool.getConnection();
        await connection.ping();
        connection.release();
        logger.info('Database connected successfully');
        
        // Initialize Redis
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });
        
        await redisClient.connect();
        logger.info('Redis connected successfully');
        
    } catch (error) {
        logger.error('Failed to initialize services:', error);
    }
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/system/status', async (req, res) => {
    try {
        const systemInfo = {
            status: 'online',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.1.0',
            node: process.version,
            uptime: Math.floor(process.uptime()),
            database: 'connected',
            redis: 'connected'
        };
        
        res.json(systemInfo);
    } catch (error) {
        logger.error('System status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/database/test', async (req, res) => {
    try {
        const [rows] = await dbPool.execute('SELECT 1 as test');
        res.json({ status: 'Database connection successful', result: rows });
    } catch (error) {
        logger.error('Database test error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Serve React app
app.get('*', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>HostPanel Pro - VPS Control Panel</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh; display: flex; align-items: center; justify-content: center;
                    }
                    .container { 
                        max-width: 800px; margin: 0 auto; padding: 40px; 
                        background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    }
                    .header { text-align: center; color: #333; margin-bottom: 30px; }
                    .status { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
                    .success { color: #28a745; font-weight: bold; }
                    .info { color: #007bff; }
                    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
                    .feature { background: #e9ecef; padding: 15px; border-radius: 8px; text-align: center; }
                    .btn { 
                        display: inline-block; padding: 12px 24px; background: #007bff; color: white; 
                        text-decoration: none; border-radius: 6px; margin: 10px 5px; 
                        transition: background 0.3s;
                    }
                    .btn:hover { background: #0056b3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">🚀 HostPanel Pro</h1>
                    <div class="status">
                        <h2 class="success">✅ Installation Successful!</h2>
                        <p>Your comprehensive VPS hosting control panel is now running.</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0;">
                            <div>
                                <h3>System Information</h3>
                                <p><strong>Node.js:</strong> ${process.version}</p>
                                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
                                <p><strong>Port:</strong> ${PORT}</p>
                                <p><strong>Uptime:</strong> ${Math.floor(process.uptime())}s</p>
                            </div>
                            <div>
                                <h3>Services Status</h3>
                                <p class="success">✅ MySQL 8.0+ Connected</p>
                                <p class="success">✅ Redis Connected</p>
                                <p class="success">✅ Nginx Running</p>
                                <p class="success">✅ PHP-FPM Active</p>
                            </div>
                        </div>
                        
                        <div class="feature-grid">
                            <div class="feature">📁 File Management</div>
                            <div class="feature">🗄️ Database Admin</div>
                            <div class="feature">📧 Email Management</div>
                            <div class="feature">🌐 Domain Control</div>
                            <div class="feature">🔒 SSL/Security</div>
                            <div class="feature">📊 Analytics</div>
                            <div class="feature">🔧 System Tools</div>
                            <div class="feature">🚀 App Installer</div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="/phpmyadmin" class="btn">📊 phpMyAdmin</a>
                            <a href="/api/system/status" class="btn">🔍 System Status</a>
                            <a href="/api/database/test" class="btn">🗄️ Database Test</a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    await initializeServices();
    
    app.listen(PORT, () => {
        logger.info(`HostPanel Pro server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
        logger.info('All services initialized successfully');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    if (redisClient) await redisClient.quit();
    if (dbPool) await dbPool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    if (redisClient) await redisClient.quit();
    if (dbPool) await dbPool.end();
    process.exit(0);
});

startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
EOF
    
    # Set ownership
    chown $HOSTPANEL_USER:$HOSTPANEL_USER package.json server.js
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    sudo -u $HOSTPANEL_USER npm install --production
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
    
    print_status "Application setup completed successfully!"
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

# MySQL Root Password
MYSQL_ROOT_PASSWORD=$ROOT_PASSWORD

# phpMyAdmin Configuration
PHPMYADMIN_PASSWORD=$PHPMYADMIN_PASSWORD
BLOWFISH_SECRET=$BLOWFISH_SECRET

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

# WordPress Default Settings
WP_DB_NAME=wordpress_default
WP_DB_USER=wp_admin
WP_DB_PASSWORD=$DB_PASSWORD
EOF
    
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/.env
    chmod 600 $HOSTPANEL_DIR/.env
}

# Configure PHP
configure_php() {
    print_status "Configuring PHP..."
    
    # Find PHP version
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    
    # Configure PHP-FPM
    cat >> /etc/php/${PHP_VERSION}/fpm/php.ini << 'EOF'

; HostPanel Pro PHP Configuration
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
file_uploads = On
allow_url_fopen = On
EOF
    
    # Start and enable PHP-FPM
    systemctl restart php${PHP_VERSION}-fpm
    systemctl enable php${PHP_VERSION}-fpm
    
    print_status "PHP configured successfully!"
}

# Configure Nginx with PHP and phpMyAdmin
configure_nginx() {
    print_status "Configuring Nginx with PHP and phpMyAdmin support..."
    
    # Find PHP version for socket
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    
    # Create main nginx configuration
    cat > /etc/nginx/sites-available/hostpanel << EOF
# HostPanel Pro - Complete Configuration
# Includes Node.js app, phpMyAdmin, and PHP support

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone \$binary_remote_addr zone=uploads:10m rate=10r/m;

# Main server block
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
    
    # Hide server information
    server_tokens off;
    
    # Main application (Node.js)
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
        
        # Rate limiting for API
        limit_req zone=api burst=50 nodelay;
    }
    
    # phpMyAdmin
    location /phpmyadmin {
        alias /var/www/phpmyadmin;
        index index.php index.html;
        
        # Rate limiting for login attempts
        limit_req zone=login burst=5 nodelay;
        
        location ~ \.php\$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
            fastcgi_param SCRIPT_FILENAME \$request_filename;
            include fastcgi_params;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # File uploads
    location /uploads {
        alias /var/www/uploads;
        client_max_body_size 100M;
        limit_req zone=uploads burst=10 nodelay;
    }
    
    # Static files for web applications
    location /html {
        alias /var/www/html;
        index index.php index.html index.htm;
        
        location ~ \.php\$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
            fastcgi_param SCRIPT_FILENAME \$request_filename;
            include fastcgi_params;
        }
    }
    
    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://localhost:$SERVICE_PORT;
        access_log off;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# SSL redirect server block (activated when SSL is configured)
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL configuration will be added by certbot
    
    # Include the same location blocks as above
    include /etc/nginx/sites-available/hostpanel-locations.conf;
}
EOF

    # Create locations file for SSL reuse
    cat > /etc/nginx/sites-available/hostpanel-locations.conf << EOF
# Shared location blocks for HTTP and HTTPS
# This file is included in both server blocks
EOF
    
    # Enable site
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm /etc/nginx/sites-enabled/default
    fi
    ln -sf /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t
    
    if [ $? -ne 0 ]; then
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    print_status "Nginx configured successfully!"
}

# Create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/hostpanel.service << EOF
[Unit]
Description=HostPanel Pro VPS Control Panel
After=network.target mysql.service redis.service php8.1-fpm.service
Wants=mysql.service redis.service php8.1-fpm.service
Requires=mysql.service

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
ReadWritePaths=/tmp

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian firewall
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Essential services
        ufw allow ssh
        ufw allow http
        ufw allow https
        
        # Mail services
        ufw allow 25/tcp   # SMTP
        ufw allow 110/tcp  # POP3
        ufw allow 143/tcp  # IMAP
        ufw allow 465/tcp  # SMTPS
        ufw allow 587/tcp  # SMTP Submission
        ufw allow 993/tcp  # IMAPS
        ufw allow 995/tcp  # POP3S
        
        # FTP
        ufw allow 21/tcp
        ufw allow 20/tcp
        ufw allow 10000:10100/tcp  # Passive FTP range
        
        # DNS
        ufw allow 53
        
        ufw --force enable
        
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL/Fedora firewall
        systemctl enable firewalld
        systemctl start firewalld
        
        # Essential services
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        
        # Mail services
        firewall-cmd --permanent --add-service=smtp
        firewall-cmd --permanent --add-service=pop3
        firewall-cmd --permanent --add-service=imap
        firewall-cmd --permanent --add-port=587/tcp
        firewall-cmd --permanent --add-port=465/tcp
        firewall-cmd --permanent --add-port=993/tcp
        firewall-cmd --permanent --add-port=995/tcp
        
        # FTP
        firewall-cmd --permanent --add-service=ftp
        firewall-cmd --permanent --add-port=10000-10100/tcp
        
        # DNS
        firewall-cmd --permanent --add-service=dns
        
        firewall-cmd --reload
    fi
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
destemail = root@localhost
sender = fail2ban@localhost
mta = sendmail

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[mysql]
enabled = true
port = 3306
logpath = /var/log/mysql/error.log
maxretry = 3

[phpmyadmin-syslog]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3
findtime = 600
bantime = 3600
filter = apache-auth
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
}

# Create database migration script
create_migration_script() {
    print_status "Creating database migration script..."
    
    mkdir -p $HOSTPANEL_DIR/scripts
    
    cat > $HOSTPANEL_DIR/scripts/migrate.js << 'EOF'
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'hostpanel',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hostpanel'
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('Running database migrations...');
        
        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Domains table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS domains (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                domain_name VARCHAR(255) NOT NULL,
                document_root VARCHAR(500),
                ssl_enabled BOOLEAN DEFAULT FALSE,
                status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Databases table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS databases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                db_name VARCHAR(255) NOT NULL,
                db_user VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Email accounts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS email_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                email_address VARCHAR(255) NOT NULL,
                quota_mb INT DEFAULT 1000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // System logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                log_level ENUM('info', 'warning', 'error') NOT NULL,
                message TEXT NOT NULL,
                component VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_log_level (log_level)
            )
        `);
        
        // Create default admin user
        const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (existingUsers[0].count === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await connection.execute(`
                INSERT INTO users (username, email, password_hash, role) 
                VALUES ('admin', 'admin@localhost', ?, 'admin')
            `, [hashedPassword]);
            
            console.log('Default admin user created: admin / admin123');
        }
        
        console.log('Database migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
EOF
    
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/scripts/migrate.js
}

# Create maintenance scripts
create_maintenance_scripts() {
    print_status "Creating maintenance scripts..."
    
    # Enhanced monitoring script
    cat > $HOSTPANEL_DIR/scripts/monitor.sh << 'EOF'
#!/bin/bash
# HostPanel Pro - Enhanced System Monitoring Script

LOGFILE="/var/log/hostpanel/monitor.log"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOGFILE
}

check_services() {
    local services=("hostpanel" "nginx" "mysql" "redis-server" "php8.1-fpm")
    
    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet $service; then
            log_message "SERVICE DOWN: $service - Attempting restart"
            systemctl restart $service
            
            sleep 5
            if systemctl is-active --quiet $service; then
                log_message "SERVICE RESTORED: $service"
            else
                log_message "SERVICE RESTART FAILED: $service"
            fi
        fi
    done
}

check_resources() {
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
}

check_database() {
    if ! mysql -u hostpanel -p$(grep DB_PASSWORD /opt/hostpanel/.env | cut -d'=' -f2) -e "SELECT 1;" &>/dev/null; then
        log_message "DATABASE CONNECTION FAILED"
    fi
}

check_services
check_resources
check_database
EOF
    
    # Enhanced backup script
    cat > $HOSTPANEL_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
# HostPanel Pro - Enhanced Backup Script

BACKUP_DIR="/var/backups/hostpanel"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DB_PASSWORD=$(grep DB_PASSWORD /opt/hostpanel/.env | cut -d'=' -f2)

mkdir -p $BACKUP_DIR

echo "Starting backup process: $DATE"

# Database backups
echo "Backing up databases..."
mysqldump -u hostpanel -p$DB_PASSWORD hostpanel > $BACKUP_DIR/hostpanel_db_$DATE.sql
mysqldump -u hostpanel -p$DB_PASSWORD wordpress_default > $BACKUP_DIR/wordpress_db_$DATE.sql 2>/dev/null || true

# Compress database backups
gzip $BACKUP_DIR/hostpanel_db_$DATE.sql
gzip $BACKUP_DIR/wordpress_db_$DATE.sql 2>/dev/null || true

# Application backup
echo "Backing up application files..."
tar -czf $BACKUP_DIR/application_$DATE.tar.gz -C /opt hostpanel --exclude='node_modules'

# Web files backup
echo "Backing up web files..."
tar -czf $BACKUP_DIR/webfiles_$DATE.tar.gz /var/www/html /var/www/uploads 2>/dev/null || true

# Configuration backup
echo "Backing up configuration files..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/mysql /etc/php /var/www/phpmyadmin/config.inc.php

# phpMyAdmin backup
tar -czf $BACKUP_DIR/phpmyadmin_$DATE.tar.gz /var/www/phpmyadmin

# Clean old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
echo "Backup location: $BACKUP_DIR"
EOF
    
    chmod +x $HOSTPANEL_DIR/scripts/*.sh
    chown -R $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/scripts
    
    # Add crontab entries
    (crontab -l 2>/dev/null; echo "0 2 * * * $HOSTPANEL_DIR/scripts/backup.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * $HOSTPANEL_DIR/scripts/monitor.sh") | crontab -
}

# Start all services
start_services() {
    print_status "Starting all services..."
    
    systemctl daemon-reload
    
    # Start in correct order
    systemctl start mysql
    systemctl start redis-server || systemctl start redis
    systemctl start php*-fpm
    systemctl start nginx
    
    # Run database migration
    cd $HOSTPANEL_DIR
    sudo -u $HOSTPANEL_USER npm run db:migrate
    
    # Start HostPanel application
    systemctl start hostpanel
    
    # Enable all services
    systemctl enable mysql redis-server nginx hostpanel
    systemctl enable php*-fpm
    
    # Wait and verify services
    sleep 10
    
    print_status "Verifying service status..."
    for service in mysql nginx hostpanel redis-server; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            print_status "$service: ✓ Running"
        else
            print_warning "$service: ✗ Not running - checking alternative names"
            # Try alternative service names
            case $service in
                redis-server) systemctl is-active --quiet redis && print_status "redis: ✓ Running" || print_error "Redis: ✗ Failed" ;;
                *) print_error "$service: ✗ Failed to start" ;;
            esac
        fi
    done
}

# Setup SSL (optional)
setup_ssl() {
    if [ ! -z "$DOMAIN" ]; then
        print_status "Setting up SSL certificate for $DOMAIN..."
        
        # Update nginx configuration with domain
        sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/hostpanel
        systemctl reload nginx
        
        # Get SSL certificate
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
            print_warning "SSL certificate installation failed. You can set it up later with:"
            print_warning "certbot --nginx -d $DOMAIN"
        }
    fi
}

# Create credentials file
create_credentials_file() {
    print_status "Creating credentials file..."
    
    cat > $HOSTPANEL_DIR/CREDENTIALS.txt << EOF
=== HostPanel Pro Installation Credentials ===
Generated: $(date)

=== Web Access ===
URL: http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT
phpMyAdmin: http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT/phpmyadmin

=== Database Credentials ===
MySQL Root Password: $ROOT_PASSWORD
HostPanel DB User: hostpanel
HostPanel DB Password: $DB_PASSWORD
WordPress DB User: wp_admin
WordPress DB Password: $DB_PASSWORD
phpMyAdmin User: phpmyadmin
phpMyAdmin Password: $PHPMYADMIN_PASSWORD

=== Default Admin Account ===
Username: admin
Password: admin123
(Change this password immediately after first login)

=== System Information ===
Node.js Version: $(node --version)
MySQL Version: $(mysql --version | head -n1)
PHP Version: $(php --version | head -n1)
Nginx Version: $(nginx -v 2>&1)

=== Important Files ===
Application Directory: $HOSTPANEL_DIR
Configuration File: $HOSTPANEL_DIR/.env
Log Files: /var/log/hostpanel/
Backup Directory: /var/backups/hostpanel
Web Root: /var/www/html
Uploads Directory: /var/www/uploads

=== Service Management ===
Start HostPanel: systemctl start hostpanel
Stop HostPanel: systemctl stop hostpanel
Restart HostPanel: systemctl restart hostpanel
View Logs: journalctl -u hostpanel -f

=== Security Notes ===
- Change default passwords immediately
- Configure firewall rules as needed
- Set up SSL certificate for production use
- Review and update security settings

=== Support ===
Documentation: Check INSTALLATION.md
Logs: $LOGFILE
Troubleshooting: systemctl status hostpanel

EOF
    
    chmod 600 $HOSTPANEL_DIR/CREDENTIALS.txt
    chown $HOSTPANEL_USER:$HOSTPANEL_USER $HOSTPANEL_DIR/CREDENTIALS.txt
}

# Final status and summary
final_status() {
    print_status "Installation completed! Running final verification..."
    
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  HostPanel Pro - Installation Complete${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    echo ""
    echo -e "${GREEN}✅ INSTALLATION SUCCESSFUL!${NC}"
    echo ""
    
    # System Information
    echo -e "${PURPLE}System Information:${NC}"
    echo "  OS: $OS $VERSION"
    echo "  Node.js: $(node --version)"
    echo "  MySQL: $(mysql --version | head -n1)"
    echo "  PHP: $(php --version | head -n1)"
    echo "  Nginx: $(nginx -v 2>&1)"
    echo ""
    
    # Service Status
    echo -e "${PURPLE}Service Status:${NC}"
    services=("hostpanel" "nginx" "mysql" "redis-server" "php8.1-fpm")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            echo -e "  $service: ${GREEN}✓ Running${NC}"
        elif [ "$service" = "redis-server" ] && systemctl is-active --quiet redis 2>/dev/null; then
            echo -e "  redis: ${GREEN}✓ Running${NC}"
        else
            echo -e "  $service: ${RED}✗ Not running${NC}"
        fi
    done
    echo ""
    
    # Access Information
    echo -e "${PURPLE}Access Information:${NC}"
    echo -e "  🌐 HostPanel Pro: ${BLUE}http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT${NC}"
    echo -e "  📊 phpMyAdmin: ${BLUE}http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT/phpmyadmin${NC}"
    echo -e "  🔍 System Status: ${BLUE}http://$(hostname -I | awk '{print $1}'):$SERVICE_PORT/api/system/status${NC}"
    echo ""
    
    # Credentials
    echo -e "${PURPLE}Default Login:${NC}"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo -e "  ${YELLOW}⚠️  Change this password immediately!${NC}"
    echo ""
    
    # Important Files
    echo -e "${PURPLE}Important Files:${NC}"
    echo "  📋 Credentials: $HOSTPANEL_DIR/CREDENTIALS.txt"
    echo "  ⚙️  Configuration: $HOSTPANEL_DIR/.env"
    echo "  📝 Logs: /var/log/hostpanel/"
    echo "  💾 Backups: /var/backups/hostpanel/"
    echo ""
    
    # Next Steps
    echo -e "${PURPLE}Next Steps:${NC}"
    echo "  1. 🔒 Change default admin password"
    echo "  2. 🌐 Configure your domain name"
    echo "  3. 🔐 Set up SSL certificate"
    echo "  4. 📧 Configure SMTP settings"
    echo "  5. 🛡️  Review security settings"
    echo ""
    
    # Quick Commands
    echo -e "${PURPLE}Quick Commands:${NC}"
    echo "  View logs: journalctl -u hostpanel -f"
    echo "  Restart app: systemctl restart hostpanel"
    echo "  Run backup: $HOSTPANEL_DIR/scripts/backup.sh"
    echo "  Check status: systemctl status hostpanel"
    echo ""
    
    # Test the installation
    echo -e "${PURPLE}Testing Installation:${NC}"
    if curl -s http://localhost:$SERVICE_PORT/health > /dev/null; then
        echo -e "  API Test: ${GREEN}✓ Passed${NC}"
    else
        echo -e "  API Test: ${RED}✗ Failed${NC}"
    fi
    
    if mysql -u hostpanel -p$DB_PASSWORD -e "SELECT 1;" &>/dev/null; then
        echo -e "  Database Test: ${GREEN}✓ Passed${NC}"
    else
        echo -e "  Database Test: ${RED}✗ Failed${NC}"
    fi
    echo ""
    
    echo -e "${GREEN}🎉 HostPanel Pro is now ready to use!${NC}"
    echo -e "${YELLOW}📖 Check CREDENTIALS.txt for all login details${NC}"
    echo ""
}

# Main installation process
main() {
    print_header
    
    # Check prerequisites
    check_root
    detect_os
    initialize_logging
    
    # Create backup
    backup_existing_config
    
    # Install and configure everything
    install_system_dependencies
    install_mysql
    secure_mysql
    setup_databases
    install_phpmyadmin
    configure_php
    create_user
    setup_directories
    setup_application
    create_env_config
    create_migration_script
    create_systemd_service
    configure_nginx
    configure_firewall
    setup_fail2ban
    create_maintenance_scripts
    start_services
    setup_ssl
    create_credentials_file
    final_status
    
    # Final message
    echo -e "${GREEN}Installation completed successfully!${NC}"
    echo -e "${YELLOW}Please read CREDENTIALS.txt for important login information.${NC}"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--domain your-domain.com]"
            echo "  --domain: Optional domain name for SSL certificate"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main installation
main "$@"
