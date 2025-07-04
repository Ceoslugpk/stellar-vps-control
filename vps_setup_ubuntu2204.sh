#!/bin/bash

# VPS Setup Script for Ubuntu 22.04 LTS
# Installs: Nginx, Node.js (LTS), PM2, PostgreSQL, UFW, Git, Certbot prerequisites.
# Creates a new non-root user with sudo privileges.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Script Configuration & User Input ---
NEW_USERNAME=""
NEW_USER_PASSWORD=""
NODE_MAJOR_VERSION="20" # Specify desired Node.js major version (e.g., 20 for LTS)

# Function to prompt for user input securely
prompt_for_credentials() {
    echo "--- User Setup ---"
    while [ -z "$NEW_USERNAME" ]; do
        read -rp "Enter username for the new non-root user: " NEW_USERNAME
        if ! [[ "$NEW_USERNAME" =~ ^[a-z_][a-z0-9_-]*[$]?$ ]]; then
            echo "Invalid username. Please use standard Linux username format (lowercase, no spaces, etc.)."
            NEW_USERNAME=""
        fi
    done

    while [ -z "$NEW_USER_PASSWORD" ]; do
        read -rsp "Enter password for $NEW_USERNAME: " NEW_USER_PASSWORD
        echo
        read -rsp "Confirm password for $NEW_USERNAME: " NEW_USER_PASSWORD_CONFIRM
        echo
        if [ "$NEW_USER_PASSWORD" != "$NEW_USER_PASSWORD_CONFIRM" ]; then
            echo "Passwords do not match. Please try again."
            NEW_USER_PASSWORD=""
        elif [ ${#NEW_USER_PASSWORD} -lt 8 ]; then
            echo "Password must be at least 8 characters long."
            NEW_USER_PASSWORD=""
        fi
    done
    echo "Credentials captured."
}

# --- Helper Functions ---
print_step() {
    echo ""
    echo "----------------------------------------------------"
    echo "$1"
    echo "----------------------------------------------------"
    echo ""
}

# Check if script is run as root
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root or with sudo privileges." >&2
  exit 1
fi

prompt_for_credentials

# --- 1. Initial System Setup ---
print_step "Updating and upgrading system packages..."
apt update
apt upgrade -y

print_step "Installing essential utilities..."
apt install -y curl wget gnupg software-properties-common apt-transport-https ca-certificates build-essential

# --- 2. Create Non-Root User ---
print_step "Creating new user '$NEW_USERNAME'..."
if id "$NEW_USERNAME" &>/dev/null; then
    echo "User '$NEW_USERNAME' already exists. Skipping creation."
else
    useradd -m -s /bin/bash "$NEW_USERNAME"
    echo "$NEW_USERNAME:$NEW_USER_PASSWORD" | chpasswd
    usermod -aG sudo "$NEW_USERNAME"
    echo "User '$NEW_USERNAME' created and added to sudo group."
    echo "Consider copying SSH keys to /home/$NEW_USERNAME/.ssh/authorized_keys for passwordless login."
fi

# --- 3. Install Git ---
print_step "Installing Git..."
apt install -y git

# --- 4. Install Node.js and PM2 ---
print_step "Installing Node.js (v$NODE_MAJOR_VERSION LTS) and PM2..."
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_$NODE_MAJOR_VERSION.x | sudo -E bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Configure PM2 to start on system boot for the new user
# Create a dummy app file for pm2 to have something to save
# This will be run as the new user to set up the correct environment
sudo -u "$NEW_USERNAME" bash -c "mkdir -p /home/$NEW_USERNAME/app && echo 'console.log(\"PM2 init\");' > /home/$NEW_USERNAME/app/pm2_init.js"
sudo -u "$NEW_USERNAME" env PATH=$PATH:/usr/bin pm2 startup systemd -u "$NEW_USERNAME" --hp "/home/$NEW_USERNAME"
# The previous command will output a command that needs to be run as root.
# Example: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u newuser --hp /home/newuser
# We capture this and run it.
PM2_STARTUP_CMD=$(sudo -u "$NEW_USERNAME" env PATH=$PATH:/usr/bin pm2 startup systemd -u "$NEW_USERNAME" --hp "/home/$NEW_USERNAME" | grep "sudo")
if [ -n "$PM2_STARTUP_CMD" ]; then
    echo "Running PM2 startup command: $PM2_STARTUP_CMD"
    eval "$PM2_STARTUP_CMD"
    sudo -u "$NEW_USERNAME" env PATH=$PATH:/usr/bin pm2 save --force # Save current empty process list
    echo "PM2 configured to start on boot for user $NEW_USERNAME."
else
    echo "Could not automatically determine PM2 startup command. Please run it manually if needed."
fi


# --- 5. Install Nginx ---
print_step "Installing Nginx..."
apt install -y nginx

NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
PLACEHOLDER_DOMAIN="your_domain.com" # User should replace this
NGINX_SITE_CONF="$NGINX_CONF_DIR/$PLACEHOLDER_DOMAIN"

print_step "Configuring Nginx placeholder site for $PLACEHOLDER_DOMAIN..."
# Create a basic Nginx server block
cat <<EOF > "$NGINX_SITE_CONF"
server {
    listen 80;
    listen [::]:80;

    server_name $PLACEHOLDER_DOMAIN www.$PLACEHOLDER_DOMAIN;

    root /var/www/$PLACEHOLDER_DOMAIN/html; # Create this directory
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
        # Example for proxying to a Node.js app (e.g., running on port 3000)
        # proxy_pass http://localhost:3000;
        # proxy_http_version 1.1;
        # proxy_set_header Upgrade \$http_upgrade;
        # proxy_set_header Connection 'upgrade';
        # proxy_set_header Host \$host;
        # proxy_cache_bypass \$http_upgrade;
    }

    # SSL settings will be added by Certbot
    # listen 443 ssl;
    # listen [::]:443 ssl;
    # ssl_certificate /etc/letsencrypt/live/$PLACEHOLDER_DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$PLACEHOLDER_DOMAIN/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
EOF

# Create placeholder web root and index file
mkdir -p "/var/www/$PLACEHOLDER_DOMAIN/html"
echo "<h1>Welcome to $PLACEHOLDER_DOMAIN!</h1><p>This site is configured by Nginx.</p>" > "/var/www/$PLACEHOLDER_DOMAIN/html/index.html"
chown -R www-data:www-data "/var/www/$PLACEHOLDER_DOMAIN"

# Enable the site
if [ ! -L "$NGINX_ENABLED_DIR/$PLACEHOLDER_DOMAIN" ]; then
    ln -s "$NGINX_SITE_CONF" "$NGINX_ENABLED_DIR/"
else
    echo "Nginx site $PLACEHOLDER_DOMAIN already enabled."
fi

# Test Nginx configuration and reload
nginx -t
systemctl reload nginx
systemctl enable nginx
echo "Nginx installed and basic site configured for $PLACEHOLDER_DOMAIN."

# --- 6. Install PostgreSQL ---
print_step "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

systemctl start postgresql
systemctl enable postgresql

# Create PostgreSQL user and database (interactive)
# It's safer to do this manually or prompt interactively.
# For this script, we'll guide the user.
NEW_PG_USER="$NEW_USERNAME" # Default to the system username
NEW_PG_DB="${NEW_USERNAME}_db"  # Default database name

print_step "Configuring PostgreSQL..."
echo "You will be prompted to create a PostgreSQL user and database."
echo "It's recommended to use '$NEW_PG_USER' as the PostgreSQL username and set a strong password."

# Check if user already exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$NEW_PG_USER'" | grep -q 1; then
    echo "PostgreSQL user '$NEW_PG_USER' already exists. Skipping user creation."
else
    sudo -u postgres createuser --interactive --pwprompt "$NEW_PG_USER" || echo "PostgreSQL user creation failed or was skipped. You may need to create it manually."
fi

# Check if database already exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$NEW_PG_DB"; then
    echo "PostgreSQL database '$NEW_PG_DB' already exists. Skipping database creation."
else
    sudo -u postgres createdb -O "$NEW_PG_USER" "$NEW_PG_DB" || echo "PostgreSQL database creation failed or was skipped. You may need to create it manually."
fi

echo "PostgreSQL installed. User '$NEW_PG_USER' and database '$NEW_PG_DB' setup process initiated."
echo "To connect: sudo -u $NEW_PG_USER psql $NEW_PG_DB"
echo "Further security (e.g., pg_hba.conf for remote access) should be configured manually if needed."

# --- 7. Configure Firewall (UFW) ---
print_step "Configuring Firewall (UFW)..."
apt install -y ufw

ufw default deny incoming
ufw default allow outgoing

ufw allow OpenSSH # or 22/tcp
ufw allow 'Nginx Full' # Allows both HTTP (80) and HTTPS (443)

# Enable UFW (non-interactively)
echo "y" | ufw enable
ufw status verbose
echo "Firewall (UFW) configured and enabled."

# --- 8. Install Certbot (for Let's Encrypt) ---
print_step "Installing Certbot..."
apt install -y certbot python3-certbot-nginx
echo "Certbot installed."

# --- 9. Final Instructions & Cleanup ---
print_step "VPS Setup Almost Complete!"
echo ""
echo "--------------------- IMPORTANT NEXT STEPS ---------------------"
echo "1. DNS Configuration: Point your domain name ($PLACEHOLDER_DOMAIN or your actual domain) to this server's IP address."
echo "2. Nginx Configuration: Edit '$NGINX_SITE_CONF' to replace '$PLACEHOLDER_DOMAIN' with your actual domain name."
echo "   Then run: sudo nginx -t && sudo systemctl reload nginx"
echo "3. SSL Certificate: Once DNS is propagated, run Certbot to obtain SSL certificate:"
echo "   sudo certbot --nginx -d your_actual_domain.com -d www.your_actual_domain.com (replace with your domain)"
echo "   Certbot will automatically update your Nginx configuration for SSL."
echo "4. PostgreSQL: Connect and manage your database using:"
echo "   sudo -u $NEW_PG_USER psql $NEW_PG_DB"
echo "   Consider further security hardening for PostgreSQL if needed."
echo "5. Application Deployment: Deploy your application (e.g., Node.js app in /home/$NEW_USERNAME/app)."
echo "   Use PM2 to manage your Node.js application: "
echo "   sudo -u $NEW_USERNAME pm2 start /home/$NEW_USERNAME/app/your_app.js --name my-app"
echo "   sudo -u $NEW_USERNAME pm2 save"
echo "6. SSH Security: For enhanced security, consider:"
echo "   - Disabling password authentication and using SSH keys only."
echo "   - Changing the default SSH port (update UFW if you do)."
echo "------------------------------------------------------------------"
echo ""
print_step "Performing system cleanup..."
apt autoremove -y
apt clean

echo ""
echo "Script finished. It's recommended to reboot the server: sudo reboot"
echo "Login as '$NEW_USERNAME' for daily operations."

exit 0
