<?php
/**
 * Migration Script - Add Footer Settings
 * This adds the missing footer settings to the site_settings table
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Footer Settings - Migration</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: #f5f7fa;
        }
        .success {
            background: #f0fff4;
            border-left: 4px solid #48bb78;
            padding: 1rem;
            margin: 1rem 0;
            color: #22543d;
        }
        .info {
            background: #ebf8ff;
            border-left: 4px solid #4299e1;
            padding: 1rem;
            margin: 1rem 0;
            color: #2c5282;
        }
        .error {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 1rem;
            margin: 1rem 0;
            color: #742a2a;
        }
    </style>
</head>
<body>
    <h1>Footer Settings Migration</h1>

<?php
try {
    $conn = getDbConnection();

    // Check if footer settings already exist
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM site_settings WHERE category = 'footer'");
    $stmt->execute();
    $result = $stmt->fetch();

    if ($result['count'] > 0) {
        echo "<div class='info'>";
        echo "ℹ️ Footer settings already exist ({$result['count']} settings found). No action needed.";
        echo "</div>";
    } else {
        echo "<div class='info'>Adding footer settings to database...</div>";

        // Insert footer settings
        $footerSettings = [
            ['footer', 'copyright_text', '© 2024 BusinessLoansProfile. All rights reserved.', 'text'],
            ['footer', 'tagline', 'Empowering businesses with fast, flexible financing solutions.', 'text'],
        ];

        $stmt = $conn->prepare("INSERT INTO site_settings (category, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)");

        $inserted = 0;
        foreach ($footerSettings as $setting) {
            $stmt->execute($setting);
            $inserted++;
        }

        echo "<div class='success'>";
        echo "✅ Successfully added $inserted footer settings to the database!";
        echo "<ul>";
        echo "<li>footer.copyright_text</li>";
        echo "<li>footer.tagline</li>";
        echo "</ul>";
        echo "</div>";

        echo "<div class='info'>";
        echo "<strong>Next Steps:</strong><br>";
        echo "1. Go back to your admin panel<br>";
        echo "2. Refresh the page<br>";
        echo "3. Navigate to Settings > Footer tab<br>";
        echo "4. You should now see the footer settings populated";
        echo "</div>";
    }

    // Show current footer settings
    echo "<h2>Current Footer Settings in Database:</h2>";
    $stmt = $conn->query("SELECT * FROM site_settings WHERE category = 'footer'");
    $footerSettings = $stmt->fetchAll();

    if (count($footerSettings) > 0) {
        echo "<table style='width: 100%; border-collapse: collapse; background: white;'>";
        echo "<tr style='background: #edf2f7;'>";
        echo "<th style='padding: 0.75rem; text-align: left; border: 1px solid #e2e8f0;'>Setting Key</th>";
        echo "<th style='padding: 0.75rem; text-align: left; border: 1px solid #e2e8f0;'>Value</th>";
        echo "</tr>";

        foreach ($footerSettings as $setting) {
            echo "<tr>";
            echo "<td style='padding: 0.75rem; border: 1px solid #e2e8f0;'><strong>{$setting['setting_key']}</strong></td>";
            echo "<td style='padding: 0.75rem; border: 1px solid #e2e8f0;'>{$setting['setting_value']}</td>";
            echo "</tr>";
        }

        echo "</table>";
    } else {
        echo "<div class='error'>No footer settings found in database.</div>";
    }

} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "❌ Error: " . htmlspecialchars($e->getMessage());
    echo "</div>";
}
?>

</body>
</html>
