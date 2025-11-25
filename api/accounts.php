<?php
/**
 * Account Management API Endpoint
 * GET /api/accounts.php - Get all accounts (super_admin only)
 * GET /api/accounts.php?id=123 - Get specific account
 * POST /api/accounts.php - Create new account
 * PUT /api/accounts.php - Update account
 * DELETE /api/accounts.php?id=123 - Delete account
 */

require_once 'config.php';

verifySession();

$conn = getDbConnection();

// Verify user is super admin for most operations
function verifySuperAdmin() {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'super_admin') {
        sendJson(['error' => 'Access denied. Super admin privileges required.'], 403);
    }
}

try {
    // GET - Retrieve accounts
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        verifySuperAdmin();

        if (isset($_GET['id'])) {
            // Get specific account
            $stmt = $conn->prepare("SELECT id, username, email, role, account_status, billing_status, first_name, last_name, is_active, last_login, created_at, updated_at FROM accounts WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $account = $stmt->fetch();

            if ($account) {
                sendJson($account);
            } else {
                sendJson(['error' => 'Account not found'], 404);
            }
        } else {
            // Get all accounts
            $stmt = $conn->query("SELECT id, username, email, role, account_status, billing_status, first_name, last_name, is_active, last_login, created_at, updated_at FROM accounts ORDER BY created_at DESC");
            $accounts = $stmt->fetchAll();
            sendJson($accounts);
        }
    }

    // POST - Create new account
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifySuperAdmin();

        $input = getJsonInput();

        // Validate required fields
        if (!isset($input['username']) || !isset($input['email']) || !isset($input['password'])) {
            sendJson(['error' => 'Username, email, and password are required'], 400);
        }

        // Check if username or email already exists
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM accounts WHERE username = ? OR email = ?");
        $stmt->execute([$input['username'], $input['email']]);
        $result = $stmt->fetch();

        if ($result['count'] > 0) {
            sendJson(['error' => 'Username or email already exists'], 409);
        }

        // Hash password
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

        // Insert new account
        $stmt = $conn->prepare("
            INSERT INTO accounts (username, email, password_hash, role, account_status, billing_status, first_name, last_name, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $input['username'],
            $input['email'],
            $passwordHash,
            $input['role'] ?? 'user',
            $input['account_status'] ?? 'regular',
            $input['billing_status'] ?? 'active',
            $input['first_name'] ?? null,
            $input['last_name'] ?? null,
            isset($input['is_active']) ? (int)$input['is_active'] : 1
        ]);

        $accountId = $conn->lastInsertId();

        sendJson([
            'success' => true,
            'message' => 'Account created successfully',
            'account_id' => $accountId
        ], 201);
    }

    // PUT - Update account
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        verifySuperAdmin();

        $input = getJsonInput();

        if (!isset($input['id'])) {
            sendJson(['error' => 'Account ID is required'], 400);
        }

        // Check if account exists
        $stmt = $conn->prepare("SELECT id FROM accounts WHERE id = ?");
        $stmt->execute([$input['id']]);
        if (!$stmt->fetch()) {
            sendJson(['error' => 'Account not found'], 404);
        }

        // Build update query dynamically
        $updateFields = [];
        $params = [];

        if (isset($input['username'])) {
            $updateFields[] = "username = ?";
            $params[] = $input['username'];
        }
        if (isset($input['email'])) {
            $updateFields[] = "email = ?";
            $params[] = $input['email'];
        }
        if (isset($input['password'])) {
            $updateFields[] = "password_hash = ?";
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        if (isset($input['role'])) {
            $updateFields[] = "role = ?";
            $params[] = $input['role'];
        }
        if (isset($input['account_status'])) {
            $updateFields[] = "account_status = ?";
            $params[] = $input['account_status'];
        }
        if (isset($input['billing_status'])) {
            $updateFields[] = "billing_status = ?";
            $params[] = $input['billing_status'];
        }
        if (isset($input['first_name'])) {
            $updateFields[] = "first_name = ?";
            $params[] = $input['first_name'];
        }
        if (isset($input['last_name'])) {
            $updateFields[] = "last_name = ?";
            $params[] = $input['last_name'];
        }
        if (isset($input['is_active'])) {
            $updateFields[] = "is_active = ?";
            $params[] = (int)$input['is_active'];
        }

        if (empty($updateFields)) {
            sendJson(['error' => 'No fields to update'], 400);
        }

        $params[] = $input['id'];
        $sql = "UPDATE accounts SET " . implode(", ", $updateFields) . " WHERE id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        sendJson([
            'success' => true,
            'message' => 'Account updated successfully'
        ]);
    }

    // DELETE - Delete account
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        verifySuperAdmin();

        if (!isset($_GET['id'])) {
            sendJson(['error' => 'Account ID is required'], 400);
        }

        // Prevent deleting your own account
        if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $_GET['id']) {
            sendJson(['error' => 'Cannot delete your own account'], 400);
        }

        $stmt = $conn->prepare("DELETE FROM accounts WHERE id = ?");
        $stmt->execute([$_GET['id']]);

        if ($stmt->rowCount() > 0) {
            sendJson([
                'success' => true,
                'message' => 'Account deleted successfully'
            ]);
        } else {
            sendJson(['error' => 'Account not found'], 404);
        }
    }

    else {
        sendJson(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
