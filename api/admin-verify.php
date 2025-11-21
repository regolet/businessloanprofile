<?php
/**
 * Verify Admin Session Endpoint
 * GET /api/admin-verify.php
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

verifySession();

sendJson([
    'success' => true,
    'username' => $_SESSION['admin_username']
]);
?>
