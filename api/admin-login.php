<?php
/**
 * Admin Login Endpoint
 * POST /api/admin-login.php
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

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
