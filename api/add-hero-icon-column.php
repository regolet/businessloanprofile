<?php
/**
 * Migration Script: Add icon_name column to hero_features table
 * Run this once to add the icon_name column
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Adding icon_name Column to hero_features Table</h2>";

try {
    $conn = getDbConnection();

    // Check if column already exists
    echo "<p>Checking if icon_name column exists...</p>";

    $stmt = $conn->query("SHOW COLUMNS FROM hero_features LIKE 'icon_name'");
    $columnExists = $stmt->fetch();

    if ($columnExists) {
        echo "<p style='color: orange;'>✓ Column 'icon_name' already exists in hero_features table.</p>";
    } else {
        echo "<p>Adding icon_name column to hero_features table...</p>";

        // Add the column
        $conn->exec("
            ALTER TABLE hero_features
            ADD COLUMN icon_name VARCHAR(50) DEFAULT NULL AFTER feature_text
        ");

        echo "<p style='color: green;'>✓ Successfully added 'icon_name' column to hero_features table!</p>";
    }

    // Show current table structure
    echo "<h3>Current hero_features Table Structure:</h3>";
    $columns = $conn->query("DESCRIBE hero_features")->fetchAll();
    echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($col['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</td>";
        echo "</tr>";
    }
    echo "</table>";

    // Show current hero features
    echo "<h3>Current Hero Features:</h3>";
    $count = $conn->query("SELECT COUNT(*) as count FROM hero_features")->fetch();
    echo "<p>Total features: <strong>" . $count['count'] . "</strong></p>";

    if ($count['count'] > 0) {
        $features = $conn->query("SELECT id, feature_text, icon_name, order_index FROM hero_features ORDER BY order_index ASC")->fetchAll();

        echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Feature Text</th><th>Icon Name</th><th>Order</th></tr>";
        foreach ($features as $feature) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($feature['id']) . "</td>";
            echo "<td>" . htmlspecialchars($feature['feature_text']) . "</td>";
            echo "<td>" . htmlspecialchars($feature['icon_name'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($feature['order_index']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No hero features found.</p>";
    }

    echo "<hr>";
    echo "<h3 style='color: green;'>✓ Migration Complete!</h3>";
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ol>";
    echo "<li>Go to your <a href='../admin.html'>Admin Panel</a> → Settings → Hero Features</li>";
    echo "<li>Edit your hero features to add icons (optional)</li>";
    echo "<li>Icons will appear on the hero section of your landing page</li>";
    echo "</ol>";

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
