<?php
/**
 * Test script to verify maintenance_mode setting in database
 */

require_once 'config.php';

try {
    $conn = getDbConnection();

    echo "<h2>Testing Maintenance Mode Setting</h2>";

    // Check if site_settings table exists
    $tables = $conn->query("SHOW TABLES LIKE 'site_settings'")->fetchAll();
    echo "<p><strong>site_settings table exists:</strong> " . (count($tables) > 0 ? 'YES' : 'NO') . "</p>";

    if (count($tables) > 0) {
        // Check if maintenance_mode setting exists
        $stmt = $conn->prepare("SELECT * FROM site_settings WHERE category = 'system' AND setting_key = 'maintenance_mode'");
        $stmt->execute();
        $setting = $stmt->fetch();

        echo "<p><strong>maintenance_mode setting exists:</strong> " . ($setting ? 'YES' : 'NO') . "</p>";

        if ($setting) {
            echo "<p><strong>Current value:</strong> " . htmlspecialchars($setting['setting_value']) . "</p>";
            echo "<p><strong>Setting type:</strong> " . htmlspecialchars($setting['setting_type']) . "</p>";
            echo "<p><strong>Last updated:</strong> " . htmlspecialchars($setting['updated_at']) . "</p>";

            echo "<h3>Full Setting Data:</h3>";
            echo "<pre>" . print_r($setting, true) . "</pre>";
        } else {
            echo "<p style='color: red;'><strong>ERROR:</strong> maintenance_mode setting NOT FOUND in database!</p>";
            echo "<p>You need to add it manually or re-run setup.php</p>";

            // Try to insert it
            echo "<h3>Attempting to insert maintenance_mode setting...</h3>";
            try {
                $insertStmt = $conn->prepare("INSERT INTO site_settings (category, setting_key, setting_value, setting_type) VALUES ('system', 'maintenance_mode', '0', 'text')");
                $insertStmt->execute();
                echo "<p style='color: green;'>SUCCESS: maintenance_mode setting inserted!</p>";
            } catch (PDOException $e) {
                echo "<p style='color: red;'>ERROR inserting: " . $e->getMessage() . "</p>";
            }
        }

        // Show all system settings
        echo "<h3>All System Settings:</h3>";
        $allSystemSettings = $conn->query("SELECT * FROM site_settings WHERE category = 'system'")->fetchAll();
        echo "<pre>" . print_r($allSystemSettings, true) . "</pre>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Database Error:</strong> " . $e->getMessage() . "</p>";
}
?>
