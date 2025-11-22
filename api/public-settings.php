<?php
/**
 * Public Settings Endpoint (No Authentication Required)
 * GET /api/public-settings.php - Get all settings for public website
 */

require_once 'config.php';

$conn = getDbConnection();

try {
    // GET - Retrieve all settings (no authentication required)
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
    } else {
        sendJson(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
