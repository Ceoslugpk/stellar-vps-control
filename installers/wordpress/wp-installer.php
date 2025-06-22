
<?php
/**
 * WordPress Auto-Installer for HostPanel Pro
 * Handles automated WordPress installations
 */

class WordPressInstaller {
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function install() {
        try {
            $this->validateConfig();
            $this->downloadWordPress();
            $this->createDatabase();
            $this->configureWordPress();
            $this->runInstallation();
            $this->cleanup();
            
            return [
                'success' => true,
                'message' => 'WordPress installed successfully',
                'url' => $this->config['site_url']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Installation failed: ' . $e->getMessage()
            ];
        }
    }
    
    private function validateConfig() {
        $required = ['domain', 'path', 'db_name', 'db_user', 'db_pass', 'admin_user', 'admin_pass', 'admin_email'];
        foreach ($required as $field) {
            if (empty($this->config[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
    }
    
    private function downloadWordPress() {
        $install_dir = "/var/www/html/{$this->config['domain']}{$this->config['path']}";
        
        if (!is_dir($install_dir)) {
            mkdir($install_dir, 0755, true);
        }
        
        // Download and extract WordPress
        $wp_url = 'https://wordpress.org/latest.tar.gz';
        $temp_file = tempnam(sys_get_temp_dir(), 'wp_');
        
        file_put_contents($temp_file, file_get_contents($wp_url));
        
        $phar = new PharData($temp_file);
        $phar->extractTo($install_dir, null, true);
        
        // Move files from wordpress subdirectory to install directory
        $wp_source = $install_dir . '/wordpress';
        if (is_dir($wp_source)) {
            $this->moveDirectory($wp_source, $install_dir);
            rmdir($wp_source);
        }
        
        unlink($temp_file);
    }
    
    private function createDatabase() {
        $pdo = new PDO("mysql:host=localhost", 'root', '');
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$this->config['db_name']}`");
        $pdo->exec("CREATE USER IF NOT EXISTS `{$this->config['db_user']}`@'localhost' IDENTIFIED BY '{$this->config['db_pass']}'");
        $pdo->exec("GRANT ALL PRIVILEGES ON `{$this->config['db_name']}`.* TO `{$this->config['db_user']}`@'localhost'");
        $pdo->exec("FLUSH PRIVILEGES");
    }
    
    private function configureWordPress() {
        $install_dir = "/var/www/html/{$this->config['domain']}{$this->config['path']}";
        $wp_config_sample = $install_dir . '/wp-config-sample.php';
        $wp_config = $install_dir . '/wp-config.php';
        
        if (!file_exists($wp_config_sample)) {
            throw new Exception('wp-config-sample.php not found');
        }
        
        $config_content = file_get_contents($wp_config_sample);
        
        // Replace database settings
        $config_content = str_replace('database_name_here', $this->config['db_name'], $config_content);
        $config_content = str_replace('username_here', $this->config['db_user'], $config_content);
        $config_content = str_replace('password_here', $this->config['db_pass'], $config_content);
        
        // Generate and replace salt keys
        $salts = $this->generateSalts();
        $config_content = preg_replace('/put your unique phrase here/i', $salts, $config_content);
        
        file_put_contents($wp_config, $config_content);
        
        // Set proper permissions
        $this->set_permissions($install_dir);
    }
    
    private function runInstallation() {
        $install_dir = "/var/www/html/{$this->config['domain']}{$this->config['path']}";
        
        // Include WordPress installation functions
        define('WP_INSTALLING', true);
        require_once($install_dir . '/wp-config.php');
        require_once($install_dir . '/wp-admin/includes/upgrade.php');
        require_once($install_dir . '/wp-includes/wp-db.php');
        
        // Run WordPress installation
        wp_install(
            $this->config['site_title'] ?? 'WordPress Site',
            $this->config['admin_user'],
            $this->config['admin_email'],
            true, // public
            '',   // deprecated
            $this->config['admin_pass']
        );
    }
    
    private function generateSalts() {
        $salt_url = 'https://api.wordpress.org/secret-key/1.1/salt/';
        return file_get_contents($salt_url);
    }
    
    private function set_permissions($dir) {
        // Set directory permissions to 755
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $item) {
            if ($item->isDir()) {
                chmod($item, 0755);
            } else {
                chmod($item, 0644);
            }
        }
        
        // Change ownership to web server user
        exec("chown -R www-data:www-data " . escapeshellarg($dir));
    }
    
    private function moveDirectory($source, $dest) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $item) {
            $target = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
            
            if ($item->isDir()) {
                if (!is_dir($target)) {
                    mkdir($target, 0755, true);
                }
            } else {
                copy($item, $target);
            }
        }
    }
    
    private function cleanup() {
        // Remove installation files that shouldn't be accessible
        $install_dir = "/var/www/html/{$this->config['domain']}{$this->config['path']}";
        $files_to_remove = [
            $install_dir . '/wp-config-sample.php',
            $install_dir . '/readme.html',
            $install_dir . '/license.txt'
        ];
        
        foreach ($files_to_remove as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
    }
}

// Usage example
if (php_sapi_name() === 'cli') {
    $config = [
        'domain' => $argv[1] ?? '',
        'path' => $argv[2] ?? '/',
        'db_name' => $argv[3] ?? '',
        'db_user' => $argv[4] ?? '',
        'db_pass' => $argv[5] ?? '',
        'admin_user' => $argv[6] ?? 'admin',
        'admin_pass' => $argv[7] ?? '',
        'admin_email' => $argv[8] ?? '',
        'site_title' => $argv[9] ?? 'WordPress Site',
        'site_url' => 'http://' . ($argv[1] ?? '') . ($argv[2] ?? '/')
    ];
    
    $installer = new WordPressInstaller($config);
    $result = $installer->install();
    
    echo json_encode($result, JSON_PRETTY_PRINT);
}
?>
