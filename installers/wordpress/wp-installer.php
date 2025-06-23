
<?php
/**
 * WordPress Auto-Installer for HostPanel Pro
 * Compatible with MySQL 8.0+ and modern PHP versions
 */

class WordPressInstaller {
    private $config;
    private $mysql;
    private $errors = [];
    
    public function __construct($config) {
        $this->config = $config;
        $this->validateConfig();
    }
    
    private function validateConfig() {
        $required = ['domain', 'db_name', 'db_user', 'db_password', 'wp_admin_user', 'wp_admin_password', 'wp_admin_email'];
        
        foreach ($required as $field) {
            if (empty($this->config[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }
        
        // Validate email
        if (!filter_var($this->config['wp_admin_email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email address");
        }
        
        // Validate domain
        if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $this->config['domain'])) {
            throw new Exception("Invalid domain format");
        }
    }
    
    public function install() {
        try {
            $this->log("Starting WordPress installation for {$this->config['domain']}");
            
            // Step 1: Connect to database
            $this->connectDatabase();
            
            // Step 2: Create database if it doesn't exist
            $this->createDatabase();
            
            // Step 3: Download WordPress
            $this->downloadWordPress();
            
            // Step 4: Configure WordPress
            $this->configureWordPress();
            
            // Step 5: Install WordPress
            $this->installWordPress();
            
            // Step 6: Configure web server
            $this->configureWebServer();
            
            // Step 7: Set permissions
            $this->setPermissions();
            
            $this->log("WordPress installation completed successfully!");
            
            return [
                'success' => true,
                'site_url' => "http://{$this->config['domain']}",
                'admin_url' => "http://{$this->config['domain']}/wp-admin",
                'admin_user' => $this->config['wp_admin_user'],
                'admin_password' => $this->config['wp_admin_password']
            ];
            
        } catch (Exception $e) {
            $this->log("Installation failed: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'errors' => $this->errors
            ];
        }
    }
    
    private function connectDatabase() {
        $this->log("Connecting to MySQL database...");
        
        $dsn = "mysql:host=localhost;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        try {
            // Connect as root first to create database
            $root_password = getenv('MYSQL_ROOT_PASSWORD');
            $this->mysql = new PDO($dsn, 'root', $root_password, $options);
            $this->log("Database connection established");
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    private function createDatabase() {
        $this->log("Creating WordPress database...");
        
        $db_name = $this->config['db_name'];
        $db_user = $this->config['db_user'];
        $db_password = $this->config['db_password'];
        
        try {
            // Create database
            $this->mysql->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Create user
            $this->mysql->exec("CREATE USER IF NOT EXISTS '{$db_user}'@'localhost' IDENTIFIED BY '{$db_password}'");
            
            // Grant privileges
            $this->mysql->exec("GRANT ALL PRIVILEGES ON `{$db_name}`.* TO '{$db_user}'@'localhost'");
            $this->mysql->exec("FLUSH PRIVILEGES");
            
            $this->log("Database and user created successfully");
        } catch (PDOException $e) {
            throw new Exception("Database creation failed: " . $e->getMessage());
        }
    }
    
    private function downloadWordPress() {
        $this->log("Downloading WordPress...");
        
        $install_dir = "/var/www/html/{$this->config['domain']}";
        $temp_dir = "/tmp/wordpress_" . uniqid();
        
        // Create directories
        if (!file_exists($install_dir)) {
            mkdir($install_dir, 0755, true);
        }
        
        if (!file_exists($temp_dir)) {
            mkdir($temp_dir, 0755, true);
        }
        
        // Download WordPress
        $wp_url = "https://wordpress.org/latest.tar.gz";
        $wp_file = "{$temp_dir}/wordpress.tar.gz";
        
        if (!copy($wp_url, $wp_file)) {
            throw new Exception("Failed to download WordPress");
        }
        
        // Extract WordPress
        $archive = new PharData($wp_file);
        $archive->extractTo($temp_dir);
        
        // Move files to install directory
        $this->copyDirectory("{$temp_dir}/wordpress", $install_dir);
        
        // Clean up
        $this->removeDirectory($temp_dir);
        
        $this->log("WordPress downloaded and extracted to {$install_dir}");
        $this->config['install_dir'] = $install_dir;
    }
    
    private function configureWordPress() {
        $this->log("Configuring WordPress...");
        
        $install_dir = $this->config['install_dir'];
        $config_file = "{$install_dir}/wp-config.php";
        
        // Copy sample config
        copy("{$install_dir}/wp-config-sample.php", $config_file);
        
        // Read config file
        $config_content = file_get_contents($config_file);
        
        // Generate salts
        $salts = $this->generateSalts();
        
        // Replace placeholders
        $replacements = [
            'database_name_here' => $this->config['db_name'],
            'username_here' => $this->config['db_user'],
            'password_here' => $this->config['db_password'],
            'localhost' => 'localhost'
        ];
        
        foreach ($replacements as $search => $replace) {
            $config_content = str_replace($search, $replace, $config_content);
        }
        
        // Replace salts
        $config_content = preg_replace('/put your unique phrase here/', $salts, $config_content, 8);
        
        // Add custom configurations
        $custom_config = "
// Custom HostPanel Pro configurations
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
define('AUTOMATIC_UPDATER_DISABLED', false);
define('WP_AUTO_UPDATE_CORE', true);
define('WP_POST_REVISIONS', 5);
define('WP_MEMORY_LIMIT', '256M');

// Security enhancements
define('DISALLOW_FILE_EDIT', true);
define('FORCE_SSL_ADMIN', false);

// Performance optimizations
define('WP_CACHE', true);
define('COMPRESS_CSS', true);
define('COMPRESS_SCRIPTS', true);
";
        
        $config_content = str_replace("/* That's all, stop editing!", $custom_config . "\n/* That's all, stop editing!", $config_content);
        
        // Write config file
        file_put_contents($config_file, $config_content);
        
        $this->log("WordPress configuration created");
    }
    
    private function installWordPress() {
        $this->log("Installing WordPress...");
        
        $install_url = "http://{$this->config['domain']}/wp-admin/install.php";
        
        // WordPress installation data
        $install_data = [
            'weblog_title' => $this->config['site_title'] ?? $this->config['domain'],
            'user_name' => $this->config['wp_admin_user'],
            'admin_password' => $this->config['wp_admin_password'],
            'admin_password2' => $this->config['wp_admin_password'],
            'admin_email' => $this->config['wp_admin_email'],
            'blog_public' => '1',
            'Submit' => 'Install WordPress'
        ];
        
        // Perform WordPress installation via HTTP
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query($install_data)
            ]
        ]);
        
        $result = file_get_contents($install_url, false, $context);
        
        if ($result === false || strpos($result, 'success') === false) {
            // Fallback: Direct database installation
            $this->installWordPressDatabase();
        }
        
        $this->log("WordPress installation completed");
    }
    
    private function installWordPressDatabase() {
        $this->log("Installing WordPress via database...");
        
        // Connect to WordPress database
        $dsn = "mysql:host=localhost;dbname={$this->config['db_name']};charset=utf8mb4";
        $wp_db = new PDO($dsn, $this->config['db_user'], $this->config['db_password']);
        
        // Load WordPress installation functions
        require_once($this->config['install_dir'] . '/wp-includes/wp-db.php');
        require_once($this->config['install_dir'] . '/wp-admin/includes/upgrade.php');
        
        // Set WordPress globals
        global $wpdb;
        $wpdb = new wpdb($this->config['db_user'], $this->config['db_password'], $this->config['db_name'], 'localhost');
        
        // Run WordPress installation
        wp_install(
            $this->config['site_title'] ?? $this->config['domain'],
            $this->config['wp_admin_user'],
            $this->config['wp_admin_email'],
            true,
            '',
            $this->config['wp_admin_password']
        );
        
        $this->log("WordPress database installation completed");
    }
    
    private function configureWebServer() {
        $this->log("Configuring web server...");
        
        $domain = $this->config['domain'];
        $install_dir = $this->config['install_dir'];
        
        // Create Nginx virtual host
        $nginx_config = "
server {
    listen 80;
    server_name {$domain} www.{$domain};
    root {$install_dir};
    index index.php index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    
    # WordPress specific rules
    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }
    
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Deny access to sensitive files
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
    
    # WordPress security
    location ~ ^/(wp-admin|wp-includes)/ {
        location ~ \.php\$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        }
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
";
        
        // Write Nginx configuration
        $nginx_file = "/etc/nginx/sites-available/{$domain}";
        file_put_contents($nginx_file, $nginx_config);
        
        // Enable site
        $nginx_enabled = "/etc/nginx/sites-enabled/{$domain}";
        if (!file_exists($nginx_enabled)) {
            symlink($nginx_file, $nginx_enabled);
        }
        
        // Test and reload Nginx
        exec('nginx -t', $output, $return_code);
        if ($return_code === 0) {
            exec('systemctl reload nginx');
            $this->log("Nginx configuration created and reloaded");
        } else {
            throw new Exception("Nginx configuration test failed");
        }
    }
    
    private function setPermissions() {
        $this->log("Setting file permissions...");
        
        $install_dir = $this->config['install_dir'];
        
        // Set ownership
        exec("chown -R www-data:www-data {$install_dir}");
        
        // Set directory permissions
        exec("find {$install_dir} -type d -exec chmod 755 {} \\;");
        
        // Set file permissions
        exec("find {$install_dir} -type f -exec chmod 644 {} \\;");
        
        // Set wp-config.php permissions
        chmod("{$install_dir}/wp-config.php", 0600);
        
        $this->log("File permissions set correctly");
    }
    
    private function generateSalts() {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_ []{}<>~`+=,.;:/?|';
        $salts = [];
        
        $salt_keys = [
            'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY',
            'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT'
        ];
        
        foreach ($salt_keys as $key) {
            $salt = '';
            for ($i = 0; $i < 64; $i++) {
                $salt .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $salts[] = "define('{$key}', '{$salt}');";
        }
        
        return implode("\n", $salts);
    }
    
    private function copyDirectory($src, $dst) {
        $dir = opendir($src);
        @mkdir($dst, 0755, true);
        
        while (($file = readdir($dir)) !== false) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->copyDirectory($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        
        closedir($dir);
    }
    
    private function removeDirectory($dir) {
        if (!is_dir($dir)) return;
        
        $files = array_diff(scandir($dir), ['.', '..']);
        
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        
        rmdir($dir);
    }
    
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $log_message = "[{$timestamp}] {$message}\n";
        file_put_contents('/var/log/hostpanel/wordpress-installer.log', $log_message, FILE_APPEND | LOCK_EX);
        echo $log_message;
    }
}

// CLI usage
if (php_sapi_name() === 'cli') {
    if ($argc < 8) {
        echo "Usage: php wp-installer.php <domain> <db_name> <db_user> <db_password> <wp_admin_user> <wp_admin_password> <wp_admin_email> [site_title]\n";
        exit(1);
    }
    
    $config = [
        'domain' => $argv[1],
        'db_name' => $argv[2],
        'db_user' => $argv[3],
        'db_password' => $argv[4],
        'wp_admin_user' => $argv[5],
        'wp_admin_password' => $argv[6],
        'wp_admin_email' => $argv[7],
        'site_title' => $argv[8] ?? $argv[1]
    ];
    
    try {
        $installer = new WordPressInstaller($config);
        $result = $installer->install();
        
        if ($result['success']) {
            echo "WordPress installation successful!\n";
            echo "Site URL: {$result['site_url']}\n";
            echo "Admin URL: {$result['admin_url']}\n";
            echo "Admin User: {$result['admin_user']}\n";
            echo "Admin Password: {$result['admin_password']}\n";
        } else {
            echo "WordPress installation failed: {$result['error']}\n";
            exit(1);
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
?>
