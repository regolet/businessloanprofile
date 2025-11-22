<?php
/**
 * Admin Settings Management Endpoint
 * GET /api/admin-settings.php - Get all settings
 * PUT /api/admin-settings.php - Update settings
 */

require_once 'config.php';

verifySession();

$conn = getDbConnection();

try {
    // GET - Retrieve all settings
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $conn->query("SELECT * FROM site_settings ORDER BY category, setting_key");
        $settings = $stmt->fetchAll();

        // Group by category
        $grouped = [];
        foreach ($settings as $setting) {
            $category = $setting['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][$setting['setting_key']] = [
                'value' => $setting['setting_value'],
                'type' => $setting['setting_type']
            ];
        }

        sendJson($grouped);
    }

    // PUT - Update settings
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = getJsonInput();

        if (!isset($input['settings']) || !is_array($input['settings'])) {
            sendJson(['error' => 'Invalid settings data'], 400);
        }

        $conn->beginTransaction();

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update
        $upsertStmt = $conn->prepare("
            INSERT INTO site_settings (category, setting_key, setting_value, setting_type, updated_at)
            VALUES (?, ?, ?, 'text', CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                setting_value = VALUES(setting_value),
                updated_at = CURRENT_TIMESTAMP
        ");

        foreach ($input['settings'] as $category => $settings) {
            foreach ($settings as $key => $value) {
                $upsertStmt->execute([$category, $key, $value]);
            }
        }

        $conn->commit();

        sendJson([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }

    else {
        sendJson(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
