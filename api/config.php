<?php
// Database configuration
// IMPORTANT: Update these values with your cPanel MySQL database credentials

define('DB_HOST', 'localhost');  // Usually 'localhost' in cPanel
define('DB_NAME', 'your_database_name');  // Your MySQL database name from cPanel
define('DB_USER', 'your_username');  // Your MySQL username from cPanel
define('DB_PASS', 'your_password');  // Your MySQL password from cPanel

// Admin credentials (change these!)
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin123');  // IMPORTANT: Change this to a secure password!

// Session settings
define('SESSION_LIFETIME', 86400);  // 24 hours in seconds

// Timezone
date_default_timezone_set('UTC');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getDbConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }
}

// Start session
session_start();

// Function to generate secure token
function generateToken() {
    return bin2hex(random_bytes(32));
}

// Function to verify admin session
function verifySession() {
    if (!isset($_SESSION['admin_token']) || !isset($_SESSION['admin_username'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }

    if (isset($_SESSION['expires_at']) && $_SESSION['expires_at'] < time()) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['error' => 'Session expired']);
        exit();
    }

    return true;
}

// Function to send JSON response
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Function to get JSON input
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}
?>
