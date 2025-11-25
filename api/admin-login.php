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

if (empty($username) || empty($password)) {
    sendJson([
        'success' => false,
        'message' => 'Username and password are required'
    ], 400);
}

try {
    $conn = getDbConnection();

    // Use database authentication only
    $stmt = $conn->prepare("SELECT id, username, email, password_hash, role, account_status, billing_status, first_name, last_name FROM accounts WHERE username = ? AND is_active = 1");
    $stmt->execute([$username]);
    $account = $stmt->fetch();

    if ($account && password_verify($password, $account['password_hash'])) {
        $token = generateToken();
        $expiresAt = time() + SESSION_LIFETIME;

        $_SESSION['admin_token'] = $token;
        $_SESSION['admin_username'] = $username;
        $_SESSION['user_id'] = $account['id'];
        $_SESSION['user_email'] = $account['email'];
        $_SESSION['user_role'] = $account['role'];
        $_SESSION['account_status'] = $account['account_status'];
        $_SESSION['expires_at'] = $expiresAt;

        // Update last login time
        $updateStmt = $conn->prepare("UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
        $updateStmt->execute([$account['id']]);

        sendJson([
            'success' => true,
            'token' => $token,
            'message' => 'Login successful',
            'user' => [
                'id' => $account['id'],
                'username' => $account['username'],
                'email' => $account['email'],
                'role' => $account['role'],
                'account_status' => $account['account_status'],
                'first_name' => $account['first_name'],
                'last_name' => $account['last_name']
            ]
        ]);
    } else {
        sendJson([
            'success' => false,
            'message' => 'Invalid username or password'
        ], 401);
    }
} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'message' => 'Login failed. Please try again later.'
    ], 500);
}
?>
