<?php
/**
 * Admin Logout Endpoint
 * POST /api/admin-logout.php
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

verifySession();

session_destroy();

sendJson([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>
