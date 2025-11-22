<?php
/**
 * Admin Login Endpoint
 * POST /api/admin-login.php
 */

require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

startSession(); // Start session for login

$input = getJsonInput();

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
    $token = generateToken();
    $expiresAt = time() + SESSION_LIFETIME;

    $_SESSION['admin_token'] = $token;
    $_SESSION['admin_username'] = $username;
    $_SESSION['expires_at'] = $expiresAt;

    sendJson([
        'success' => true,
        'token' => $token,
        'message' => 'Login successful'
    ]);
} else {
    sendJson([
        'success' => false,
        'message' => 'Invalid username or password'
    ], 401);
}
?>
