#!/bin/bash
# HostPanel Pro - Universal VPS Installation Script
# Compatible with Ubuntu, Debian, CentOS, Rocky Linux, AlmaLinux, Fedora, OpenSUSE

set -e

# --- Configuration ---
HOSTPANEL_USER="hostpanel"
HOSTPANEL_DIR="/opt/hostpanel"
SERVICE_PORT="3000"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=\+\/')
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)
# The GITHUB_REPO environment variable can be set to clone a specific repo.
# Example: export GITHUB_REPO="https://github.com/user/repo.git"

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
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
    echo -e "${BLUE}   HostPanel Pro Installation   ${NC}"
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

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION_ID=$VERSION_ID
        ID_LIKE=${ID_LIKE:-$ID}
    else
        print_error "Cannot detect operating system. Exiting."
        exit 1
    fi
    print_status "Detected OS: $OS $VERSION_ID"
}

# --- Installation Steps ---
install_dependencies() {
    print_status "Updating package lists and installing system dependencies..."

    case "$ID_LIKE" in
        debian|ubuntu)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update -y
            apt-get install -y curl wget git nginx mariadb-server redis-server certbot python3-certbot-nginx firewalld fail2ban htop iotop build-essential unzip
            
            print_status "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            apt-get install -y nodejs
            ;;
        rhel|fedora|centos)
            # For CentOS, Rocky, AlmaLinux, Fedora
            yum update -y
            yum install -y epel-release || true # Fails gracefully if not needed
            yum install -y curl wget git nginx mariadb-server redis certbot python3-certbot-nginx firewalld fail2ban htop iotop gcc gcc-c++ make unzip
            
            print_status "Installing Node.js..."
            yum remove -y nodejs npm # Remove old versions
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
            yum install -y nodejs
            ;;
        suse)
            zypper refresh
            zypper install -y curl wget git nginx mariadb redis certbot python3-certbot-nginx firewalld fail2ban htop iotop gcc make unzip patterns-devel-base_basis
            
            print_status "Installing Node.js..."
            zypper remove -y nodejs npm
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
            zypper install -y nodejs
            ;;
        *)
            print_error "Unsupported distribution: $OS"
            exit 1
            ;;
    esac

    print_status "Dependencies installed successfully."
}

create_user() {
    print_status "Creating dedicated user '$HOSTPANEL_USER'..."
    if ! id "$HOSTPANEL_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$HOSTPANEL_USER"
        # Grant sudo for specific tasks if needed, wheel for RHEL/SUSE, sudo for Debian
        usermod -aG sudo "$HOSTPANEL_USER" 2>/dev/null || usermod -aG wheel "$HOSTPANEL_USER"
    fi
}

setup_directories() {
    print_status "Setting up application directories..."
    mkdir -p "$HOSTPANEL_DIR" /var/log/hostpanel /var/backups/hostpanel /var/www/html
    
    chown -R "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR" /var/log/hostpanel /var/backups/hostpanel
}

setup_application() {
    print_status "Setting up HostPanel Pro application..."
    
    if [ -n "$GITHUB_REPO" ]; then
        print_status "Cloning from GITHUB_REPO: $GITHUB_REPO"
        sudo -u "$HOSTPANEL_USER" git clone "$GITHUB_REPO" "$HOSTPANEL_DIR"
    else
        print_status "Creating boilerplate application structure..."
        sudo -u "$HOSTPANEL_USER" mkdir -p "$HOSTPANEL_DIR"/{src,public,scripts}
        
        # Create a basic package.json
        sudo -u "$HOSTPANEL_USER" tee "$HOSTPANEL_DIR/package.json" > /dev/null << 'EOF'
{
  "name": "hostpanel-pro",
  "version": "2.1.0",
  "description": "Universal VPS Hosting Control Panel",
  "main": "dist/server.js",
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
    fi
    
    print_status "Installing Node.js dependencies..."
    cd "$HOSTPANEL_DIR"
    sudo -u "$HOSTPANEL_USER" npm install
}

setup_database() {
    print_status "Starting and configuring database..."
    
    # Start and enable MariaDB/MySQL
    systemctl enable mariadb --now 2>/dev/null || systemctl enable mysql --now 2>/dev/null || systemctl enable mysqld --now
    
    # Basic non-interactive security
    print_status "Securing database and creating application user..."
    mysql -u root -e "DELETE FROM mysql.user WHERE User='';"
    mysql -u root -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -u root -e "DROP DATABASE IF EXISTS test;"
    mysql -u root -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    
    # Create database and user
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS hostpanel;"
    mysql -u root -e "CREATE USER IF NOT EXISTS 'hostpanel'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON hostpanel.* TO 'hostpanel'@'localhost';"
    mysql -u root -e "FLUSH PRIVILEGES;"
}

create_env_config() {
    print_status "Creating environment configuration file..."
    local IP_ADDRESS
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    tee "$HOSTPANEL_DIR/.env" > /dev/null << EOF
# Application Settings
NODE_ENV=production
PORT=$SERVICE_PORT
APP_URL=http://${DOMAIN:-$IP_ADDRESS}
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
SMTP_FROM="HostPanel Pro <noreply@${DOMAIN:-$IP_ADDRESS}>"
EOF
    
    chown "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR/.env"
    chmod 600 "$HOSTPANEL_DIR/.env"
}

create_systemd_service() {
    print_status "Creating systemd service for HostPanel..."
    tee /etc/systemd/system/hostpanel.service > /dev/null << EOF
[Unit]
Description=HostPanel Pro Control Panel
After=network.target mariadb.service redis.service
Wants=mariadb.service redis.service

[Service]
Type=simple
User=$HOSTPANEL_USER
Group=$HOSTPANEL_USER
WorkingDirectory=$HOSTPANEL_DIR
ExecStart=$(command -v npm) start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$SERVICE_PORT
EnvironmentFile=$HOSTPANEL_DIR/.env

# Security Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$HOSTPANEL_DIR /var/log/hostpanel /var/backups/hostpanel /var/www

[Install]
WantedBy=multi-user.target
EOF
}

configure_nginx() {
    print_status "Configuring Nginx reverse proxy..."
    
    # Define server name based on user input or IP
    local SERVER_NAME="${DOMAIN:-_}"
    
    local NGINX_CONF_CONTENT
    NGINX_CONF_CONTENT=$(cat <<EOF
# Rate limiting zone, defined once
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

server {
    listen 80;
    server_name ${SERVER_NAME};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
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
        proxy_read_timeout 900s; # 15 minutes
        
        # Apply rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Static file handling (optional, if your app serves static files)
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
        ln -sf /etc/nginx/sites-available/hostpanel /etc/nginx/sites-enabled/
    else
        # RHEL/SUSE style
        echo "$NGINX_CONF_CONTENT" > /etc/nginx/conf.d/hostpanel.conf
        # It's good practice to also remove the default if it exists
        mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
        sed '/include \/etc\/nginx\/conf.d\/\*.conf;/,/server {/s/server {.*}/server {/;/^    include \/etc\/nginx\/default.d\/\*.conf;$/d' /etc/nginx/nginx.conf.backup > /etc/nginx/nginx.conf || true
    fi
    
    print_status "Testing Nginx configuration..."
    sudo nginx -t
}

configure_firewall() {
    print_status "Configuring firewall..."
    systemctl enable firewalld --now
    
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    
    print_warning "Firewall enabled for SSH, HTTP, and HTTPS. Review and add other ports if needed."
}

setup_fail2ban() {
    print_status "Configuring Fail2Ban..."
    tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    systemctl enable fail2ban --now
}

setup_wordpress_installer() {
    print_status "Setting up WordPress one-click installer..."
    
    # Determine web server user
    local WEB_USER="www-data" # Default for Debian
    if [ -n "$(command -v apache2)" ]; then
        WEB_USER=$(ps axo user,group,comm | egrep '(apache|httpd)' | grep -v ^root | uniq | cut -d ' ' -f 1)
    elif [ -n "$(command -v nginx)" ]; then
        # On RHEL/Fedora, this is 'nginx'. On Debian/Ubuntu it's 'www-data'
        case "$ID_LIKE" in
            rhel|fedora|centos|suse) WEB_USER="nginx" ;;
        esac
    fi
    print_status "Detected web server user as: $WEB_USER"

    local WP_INSTALLER_DIR="$HOSTPANEL_DIR/installers/wordpress"
    mkdir -p "$WP_INSTALLER_DIR"
    
    print_status "Downloading latest WordPress..."
    wget -qO- https://wordpress.org/latest.tar.gz | tar -xz -C "$WP_INSTALLER_DIR"
    
    # Create the installer script
    tee "$WP_INSTALLER_DIR/install-wordpress.sh" > /dev/null <<EOF
#!/bin/bash
# WordPress Installation Script for HostPanel Pro
set -e

DOMAIN="\$1"
INSTALL_PATH="/var/www/html/\$DOMAIN"

if [ -z "\$DOMAIN" ]; then
    echo "Usage: \$0 <domain-name>"
    exit 1
fi

mkdir -p "\$INSTALL_PATH"
cp -r ${WP_INSTALLER_DIR}/wordpress/* "\$INSTALL_PATH/"
cd "\$INSTALL_PATH"
cp wp-config-sample.php wp-config.php

# Generate salts
SALTS=\$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
sed -i "/put your unique phrase here/c\\\$SALTS" wp-config.php

# Note: DB credentials must be configured manually in wp-config.php by the user
# or passed as arguments to a more advanced version of this script.

# Set permissions
chown -R ${WEB_USER}:${WEB_USER} "\$INSTALL_PATH"
find "\$INSTALL_PATH" -type d -exec chmod 755 {} \\;
find "\$INSTALL_PATH" -type f -exec chmod 644 {} \\;

echo "WordPress files installed for \$DOMAIN. Configure wp-config.php and your web server."
EOF
    
    chmod +x "$WP_INSTALLER_DIR/install-wordpress.sh"
    chown -R "$HOSTPANEL_USER:$HOSTPANEL_USER" "$HOSTPANEL_DIR/installers"
}


start_services() {
    print_status "Reloading systemd, enabling and starting services..."
    systemctl daemon-reload
    
    systemctl enable redis --now 2>/dev/null || systemctl enable redis-server --now
    systemctl enable nginx --now
    systemctl enable hostpanel --now
}

final_summary() {
    print_status "Finalizing installation..."
    
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    Installation Summary        ${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # Check service statuses
    for service in hostpanel nginx mariadb redis fail2ban; do
        if systemctl is-active --quiet "$service"; then
            echo -e " ✓ $service: ${GREEN}Active${NC}"
        else
            echo -e " ✗ $service: ${RED}Inactive${NC}"
        fi
    done
    
    local IP_ADDRESS
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}Access your HostPanel Pro instance at:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  => ${BLUE}http://${DOMAIN}${NC}"
    else
        echo -e "  => ${BLUE}http://${IP_ADDRESS}${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}IMPORTANT NOTES & CREDENTIALS:${NC}"
    echo -e "  - HostPanel Directory: ${HOSTPANEL_DIR}"
    echo -e "  - Environment Config:  ${HOSTPANEL_DIR}/.env"
    echo -e "  - Database Password:   ${DB_PASSWORD} (Saved in .env)"
    
    echo ""
    echo -e "${YELLOW}RECOMMENDED NEXT STEPS:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  1. Point your domain's DNS A record to: ${IP_ADDRESS}"
        echo -e "  2. Secure your site with an SSL certificate:"
        echo -e "     ${GREEN}sudo certbot --nginx -d ${DOMAIN}${NC}"
    else
        echo -e "  1. To use a domain name, re-run this script or manually edit:"
        echo -e "     - ${HOSTPANEL_DIR}/.env (update APP_URL)"
        echo -e "     - Your Nginx config file (update server_name)"
    fi
    echo -e "  3. Configure your SMTP mail settings in ${HOSTPANEL_DIR}/.env"
    echo ""
    echo -e "${GREEN}Installation completed successfully!${NC}"
}

# --- Main Execution Logic ---
main() {
    print_header
    
    read -p "Enter the domain name for HostPanel (e.g., panel.example.com) or leave blank to use IP: " DOMAIN
    
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
    
    start_services
    final_summary
}

main "$@"

