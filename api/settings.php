<?php
/**
 * Public Settings Endpoint
 * GET /api/settings.php - Get all public settings
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

try {
    $conn = getDbConnection();

    $stmt = $conn->query("SELECT * FROM site_settings ORDER BY category, setting_key");
    $settings = $stmt->fetchAll();

    // Group by category
    $grouped = [];
    foreach ($settings as $setting) {
        $category = $setting['category'];
        if (!isset($grouped[$category])) {
            $grouped[$category] = [];
        }
        $grouped[$category][$setting['setting_key']] = $setting['setting_value'];
    }

    sendJson($grouped);

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
