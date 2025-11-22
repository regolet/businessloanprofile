<?php
/**
 * Migration Script: Add is_featured column to loan_types table
 * Run this once to add the is_featured column
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Adding is_featured Column to loan_types Table</h2>";

try {
    $conn = getDbConnection();

    // Check if column already exists
    echo "<p>Checking if is_featured column exists...</p>";

    $stmt = $conn->query("SHOW COLUMNS FROM loan_types LIKE 'is_featured'");
    $columnExists = $stmt->fetch();

    if ($columnExists) {
        echo "<p style='color: orange;'>✓ Column 'is_featured' already exists in loan_types table.</p>";
    } else {
        echo "<p>Adding is_featured column...</p>";

        // Add the column
        $conn->exec("ALTER TABLE loan_types ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER features");

        echo "<p style='color: green;'>✓ Successfully added 'is_featured' column to loan_types table!</p>";
    }

    // Show current table structure
    echo "<h3>Current loan_types Table Structure:</h3>";
    $columns = $conn->query("DESCRIBE loan_types")->fetchAll();
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

    // Show current loan types data
    echo "<h3>Current Loan Types:</h3>";
    $loanTypes = $conn->query("SELECT id, title, is_featured FROM loan_types ORDER BY order_index")->fetchAll();

    if (count($loanTypes) > 0) {
        echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Title</th><th>Is Featured</th></tr>";
        foreach ($loanTypes as $type) {
            $featuredText = $type['is_featured'] == 1 ? '<strong style="color: green;">YES</strong>' : 'No';
            echo "<tr>";
            echo "<td>" . htmlspecialchars($type['id']) . "</td>";
            echo "<td>" . htmlspecialchars($type['title']) . "</td>";
            echo "<td>" . $featuredText . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No loan types found in database.</p>";
    }

    echo "<hr>";
    echo "<h3 style='color: green;'>✓ Migration Complete!</h3>";
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ol>";
    echo "<li>Go to your <a href='../admin.html'>Admin Panel</a></li>";
    echo "<li>Navigate to Settings → Dynamic Content → Loan Types</li>";
    echo "<li>Click Edit on the loan type you want to mark as featured</li>";
    echo "<li>Check the 'Mark as Featured' checkbox</li>";
    echo "<li>Save the changes</li>";
    echo "<li>Refresh your landing page to see the 'MOST POPULAR' badge</li>";
    echo "</ol>";

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
