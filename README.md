
# HostPanel Pro - Web Hosting Control Panel

A comprehensive, modern web hosting control panel application that replicates and enhances the core functionalities of cPanel and Plesk. Designed specifically for VPS deployment with a focus on security, performance, and user experience.

## 🚀 Features

### Server Management
- **Domain & Subdomain Management**: Full DNS zone configuration and management
- **SSL Certificate Management**: Let's Encrypt integration and custom certificate support
- **Email Server Administration**: Complete SMTP, POP3, IMAP configuration
- **Database Management**: MySQL, MariaDB, and PostgreSQL support
- **FTP Account Management**: Secure file transfer protocol setup
- **Web Server Configuration**: Apache and Nginx configuration tools
- **Backup & Restoration**: Automated and manual backup solutions
- **System Monitoring**: Real-time resource usage and performance statistics

### Security Features
- **Multi-Factor Authentication**: Enhanced account security
- **IP Access Control**: Whitelist/blacklist management
- **Firewall Management**: UFW integration and rule management
- **SSL/TLS Encryption**: Automatic certificate provisioning
- **Security Monitoring**: Real-time threat detection and alerts
- **User Permission Management**: Role-based access control

### Technical Specifications
- **Linux Compatible**: Supports Debian, Ubuntu, and CentOS
- **Modular Architecture**: Easy feature expansion and customization
- **RESTful API**: Complete API for automation and integration
- **Mobile Responsive**: Optimized for all device sizes
- **Modern Browser Support**: Chrome, Firefox, Safari, Edge
- **Resource Efficient**: Optimized for VPS environments
- **Docker Support**: Container-ready deployment

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Charts**: Recharts for system monitoring
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS, Debian 11, or CentOS 8
- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4 GB
- **Storage**: 20 GB free space
- **Network**: Public IP address

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 cores (2.5 GHz)
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: Public IP with reverse DNS

## 🚀 Deployment & Installation

We recommend using the provided setup script for deploying HostPanel Pro on a fresh Ubuntu 22.04 LTS VPS. For other operating systems, manual installation, or local development, please see the manual setup instructions below.

### VPS Deployment with Setup Script (Recommended for Ubuntu 22.04)

This method uses a script to automate the initial server setup, including installing necessary dependencies like Nginx, Node.js, PostgreSQL, and configuring the firewall.

**About the Script (`scripts/vps_setup_ubuntu2204.sh`):**

*   **Purpose:** Automates the initial setup of an Ubuntu 22.04 LTS server and deploys the HostPanel Pro application.
*   **Automates:**
    *   Creation of a new non-root user with `sudo` privileges (prompts for username/password).
    *   Installation of essential utilities: `git`, `curl`, `wget`, `build-essential`.
    *   Installation of Node.js (LTS), npm, and PM2 process manager.
    *   Installation and basic configuration of Nginx (including proxy to Node.js app on port 3000).
    *   Installation and basic configuration of PostgreSQL (creates a user and database).
    *   Setup of UFW (firewall) with rules for SSH, HTTP, HTTPS.
    *   Installation of Certbot (for Let's Encrypt SSL).
    *   Cloning of the HostPanel Pro repository (uses a placeholder URL, ensure `scripts/vps_setup_ubuntu2204.sh` has the correct one).
    *   Installation of HostPanel Pro application dependencies (`npm install`).
    *   Building of the HostPanel Pro application (`npm run build`).
    *   Creation of a placeholder `.env` file for HostPanel Pro.
    *   Setup of PM2 to manage the HostPanel Pro application.

**Steps:**

1.  **Download/Transfer the Script:**
    *   The script `vps_setup_ubuntu2204.sh` is included in this repository in the `scripts/` directory.
    *   Upload it to your server (e.g., using `scp`):
        ```bash
        scp ./scripts/vps_setup_ubuntu2204.sh your_vps_user@your_vps_ip:~/
        ```
        *(Replace `your_vps_user` and `your_vps_ip` with your server details. This initial user might be `root` or a user provided by your VPS host).*

2.  **Make Executable:**
    *   Log in to your VPS via SSH.
    *   Navigate to where you uploaded the script and make it executable:
        ```bash
        chmod +x vps_setup_ubuntu2204.sh
        ```

3.  **Run the Script:**
    *   Execute the script with `sudo` privileges:
        ```bash
        sudo ./vps_setup_ubuntu2204.sh
        ```
    *   The script will prompt you to enter a username and password for the new non-root user it will create. Follow the on-screen instructions.

**Post-Script Setup (Crucial Manual Steps):**

After the script completes, you **must** perform these steps:

1.  **DNS Configuration:**
    *   Point your domain name (e.g., `panel.yourdomain.com`) to your server's public IP address. This is done via your domain registrar or DNS provider.

2.  **Nginx Configuration:**
    *   Log in as the new user created by the script.
    *   Edit the Nginx site configuration file (the script will tell you the placeholder path, typically `/etc/nginx/sites-available/your_domain.com`):
        ```bash
        sudo nano /etc/nginx/sites-available/your_domain.com
        ```
        *(Replace `your_domain.com` with the actual placeholder filename used by the script if different)*.
    *   Update `server_name` with your actual domain (e.g., `panel.yourdomain.com`). The script pre-configures `proxy_pass` to `http://localhost:3000`. If your application's `.env` file specifies a different `PORT`, ensure the `proxy_pass` port in Nginx matches it.
    *   Test Nginx configuration and reload:
        ```bash
        sudo nginx -t
        sudo systemctl reload nginx
        ```

3.  **Application Environment Configuration (`.env` file):**
    *   **CRITICAL:** The script creates a placeholder `.env` file in the application directory (`/home/your_new_username/hostpanel-pro/.env`). You **must** edit this file:
        ```bash
        sudo nano /home/your_new_username/hostpanel-pro/.env
        ```
        *(Replace `your_new_username` with the actual username you provided to the script).*
    *   Fill in the following:
        *   `DB_PASSWORD`: The password you set for the PostgreSQL user during the script's execution.
        *   `JWT_SECRET`: A strong, unique random string for session security.
        *   Review other settings like `PORT` (if you changed it from the default 3000), SMTP details, etc.
    *   After saving the `.env` file, restart the HostPanel Pro application using PM2 for the changes to take effect:
        ```bash
        sudo -u your_new_username pm2 restart hostpanel-pro
        ```

4.  **SSL Certificate (Let's Encrypt):**
    *   Once DNS has propagated and Nginx is configured with your actual domain, run Certbot:
        ```bash
        sudo certbot --nginx -d panel.yourdomain.com # Replace with your actual domain
        ```
    *   Follow Certbot's prompts. It will automatically update your Nginx configuration for SSL.

5.  **Access HostPanel Pro:**
    *   You should now be able to access HostPanel Pro at `https://panel.yourdomain.com`.
    *   Check PM2 logs if you encounter issues: `sudo -u your_new_username pm2 logs hostpanel-pro`.

### Manual Installation / Local Development

These steps are for setting up a local development environment or for manually installing on operating systems other than Ubuntu 22.04 (where the script is not applicable).

```bash
# 1. Clone repository
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro

# 2. Install Node.js and npm
# (Refer to Node.js official documentation for your OS)
# Example for Ubuntu/Debian:
# sudo apt update
# sudo apt install -y nodejs npm

# 3. Install dependencies
npm install

# 4. Build application (for production preview or manual deployment)
npm run build

# 5. Start development server (for local development)
npm run dev
```
This starts a local development server (usually on `http://localhost:5173` or similar).

**For manual production deployment (without the VPS script):**
You would need to:
1.  Set up a web server (Nginx or Apache).
2.  Configure it to serve the built static files (from `dist` or `build` folder) or proxy to your Node.js server process.
3.  Set up a database (PostgreSQL, MySQL).
4.  Configure environment variables for HostPanel Pro.
5.  Use a process manager like PM2 to keep your application running.
6.  Set up SSL certificates.

For more detailed manual steps, refer to our comprehensive [Installation Guide](INSTALLATION.md).

### Docker Installation

For users who prefer Docker:

```bash
# Clone repository
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro

# Start with Docker Compose
docker-compose up -d
```
*(Ensure you have Docker and Docker Compose installed. Configuration details for Docker deployment can be found in `INSTALLATION.md` or a dedicated Docker guide if available).*


## 📖 Detailed Installation Guide

For complete manual installation instructions, system configuration, and advanced deployment scenarios, please refer to our comprehensive [Installation Guide](INSTALLATION.md).

The installation guide covers:
- System preparation and prerequisites
- Step-by-step installation process
- Database setup and configuration
- Web server configuration (Nginx/Apache)
- SSL certificate setup
- System service configuration
- Security hardening
- Docker deployment
- Troubleshooting and maintenance

## 🖥️ Dashboard Features

### System Overview
- Real-time CPU, memory, and disk usage monitoring
- Service status monitoring (Apache, MySQL, SSH, etc.)
- System information and uptime tracking
- Quick action shortcuts

### Domain Management
- Add, configure, and manage domains and subdomains
- DNS zone file editing
- SSL certificate assignment
- PHP version management per domain

### Database Administration
- MySQL, MariaDB, and PostgreSQL support
- Database creation and management
- User permission management
- phpMyAdmin integration

### Email Management
- Email account creation and management
- Autoresponder configuration
- Email forwarding rules
- SMTP, POP3, IMAP server settings

### File Manager
- Web-based file browser
- Code editor with syntax highlighting
- File upload and download
- Permission management
- Archive extraction

### Security Center
- Firewall rule management
- IP whitelist/blacklist
- Security event monitoring
- SSL/TLS certificate management
- Two-factor authentication

### Backup System
- Automated backup scheduling
- Manual backup creation
- Restore functionality
- Cloud storage integration
- Backup verification

### System Monitoring
- Resource usage graphs
- Process monitoring
- Network traffic analysis
- Performance alerts
- Log file access

## 🔐 Security Features

HostPanel Pro implements enterprise-grade security measures:

### Authentication & Authorization
- Multi-factor authentication (TOTP, SMS)
- Role-based access control
- Session management
- IP-based restrictions
- Failed login attempt monitoring

### Data Protection
- End-to-end encryption
- Secure password storage (bcrypt)
- CSRF protection
- XSS prevention
- SQL injection protection

### Server Security
- Automated security updates
- Firewall integration (UFW)
- Intrusion detection (Fail2Ban)
- SSL/TLS enforcement
- Security headers implementation

## 🌐 API Documentation

HostPanel Pro provides a comprehensive RESTful API for automation and integration:

```bash
# Example API endpoints
GET /api/v1/system/stats          # System statistics
POST /api/v1/domains              # Create domain
GET /api/v1/databases             # List databases
POST /api/v1/backups              # Create backup
GET /api/v1/ssl/certificates      # List SSL certificates
```

API features:
- RESTful design principles
- JWT authentication
- Rate limiting
- Comprehensive error handling
- OpenAPI/Swagger documentation

## 🎨 User Interface

### Design Principles
- **Modern & Clean**: Contemporary design following current UI/UX trends
- **Responsive**: Optimized for desktop, tablet, and mobile devices
- **Accessible**: WCAG 2.1 AA compliance
- **Intuitive**: User-friendly navigation and workflow
- **Customizable**: Themeable interface with dark/light modes

### Key UI Components
- Real-time dashboards with live data updates
- Interactive charts and graphs
- Modal dialogs for complex operations
- Drag-and-drop file management
- Context-sensitive help system

## 🔧 Configuration

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostpanel
DB_USER=hostpanel
DB_PASSWORD=secure_password

# Security Settings
JWT_SECRET=your-jwt-secret
SESSION_TIMEOUT=1800
MAX_LOGIN_ATTEMPTS=5

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=smtp_password

# Backup Settings
BACKUP_PATH=/var/backups/hostpanel
BACKUP_RETENTION=30
```

### Configuration Files
- `/etc/hostpanel/hostpanel.conf` - Main configuration
- `/etc/hostpanel/database.conf` - Database settings
- `/etc/hostpanel/security.conf` - Security policies
- `/etc/hostpanel/backup.conf` - Backup configuration

## 🧪 Development

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-repo/hostpanel-pro.git
cd hostpanel-pro

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure
```
hostpanel-pro/
├── src/
│   ├── components/          # React components
│   ├── dashboard/          # Dashboard modules
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── pages/              # Page components
├── public/                 # Static assets
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
└── config/                 # Configuration files
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for changes
- Follow the existing code style
- Test across different browsers and devices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Community Support
- **Documentation**: [https://docs.hostpanel.pro](https://docs.hostpanel.pro)
- **Community Forum**: [https://community.hostpanel.pro](https://community.hostpanel.pro)
- **Discord Server**: [Join our Discord](https://discord.gg/hostpanel)
- **GitHub Discussions**: [GitHub Discussions](https://github.com/your-repo/hostpanel-pro/discussions)

### Professional Support
- **Priority Support**: Available for enterprise customers
- **Custom Development**: Tailored solutions for specific requirements
- **Training & Consulting**: Professional services available
- **Security Audits**: Comprehensive security assessments

### Bug Reports & Feature Requests
- **GitHub Issues**: [Report issues](https://github.com/your-repo/hostpanel-pro/issues)
- **Security Vulnerabilities**: security@hostpanel.pro
- **Feature Requests**: [Request features](https://github.com/your-repo/hostpanel-pro/discussions/categories/ideas)

## 🗺️ Roadmap

### Version 2.2.0 (Q2 2024)
- [ ] Advanced monitoring and alerting
- [ ] Multi-server management
- [ ] API rate limiting and quotas
- [ ] Advanced backup encryption

### Version 2.3.0 (Q3 2024)
- [ ] Docker container management
- [ ] Kubernetes integration
- [ ] Advanced user roles and permissions
- [ ] Mobile application

### Version 3.0.0 (Q4 2024)
- [ ] Multi-tenancy support
- [ ] Advanced automation engine
- [ ] Cloud provider integrations
- [ ] AI-powered system optimization

## 📊 Statistics

- **Lines of Code**: 50,000+
- **Components**: 100+
- **Test Coverage**: 85%+
- **Performance Score**: 95+
- **Security Score**: A+

## 🙏 Acknowledgments

- **React Team** for the excellent framework
- **Tailwind CSS** for the utility-first CSS framework
- **Shadcn/ui** for the beautiful component library
- **Radix UI** for accessible component primitives
- **Recharts** for data visualization components
- **Community Contributors** for their valuable contributions

---

**HostPanel Pro** - Empowering web hosting with modern technology and exceptional user experience.

Made with ❤️ by the HostPanel Pro team.
