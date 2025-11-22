<?php
/**
 * Migration Script: Add thinking_about_it table
 * Run this once to add the thinking_about_it table
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Adding thinking_about_it Table</h2>";

try {
    $conn = getDbConnection();

    // Check if table already exists
    echo "<p>Checking if thinking_about_it table exists...</p>";

    $stmt = $conn->query("SHOW TABLES LIKE 'thinking_about_it'");
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "<p style='color: orange;'>✓ Table 'thinking_about_it' already exists.</p>";
    } else {
        echo "<p>Creating thinking_about_it table...</p>";

        // Create the table
        $conn->exec("
            CREATE TABLE thinking_about_it (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                cell VARCHAR(50) NOT NULL,
                email VARCHAR(255) NOT NULL,
                ready_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        echo "<p style='color: green;'>✓ Successfully created 'thinking_about_it' table!</p>";
    }

    // Show current table structure
    echo "<h3>Current thinking_about_it Table Structure:</h3>";
    $columns = $conn->query("DESCRIBE thinking_about_it")->fetchAll();
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

    // Show current submissions count
    echo "<h3>Current Submissions:</h3>";
    $count = $conn->query("SELECT COUNT(*) as count FROM thinking_about_it")->fetch();
    echo "<p>Total submissions: <strong>" . $count['count'] . "</strong></p>";

    if ($count['count'] > 0) {
        $submissions = $conn->query("SELECT id, name, email, cell, ready_date, status, created_at FROM thinking_about_it ORDER BY created_at DESC LIMIT 10")->fetchAll();

        echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Cell</th><th>Ready Date</th><th>Status</th><th>Submitted</th></tr>";
        foreach ($submissions as $sub) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($sub['id']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['name']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['email']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['cell']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['ready_date']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['status']) . "</td>";
            echo "<td>" . htmlspecialchars($sub['created_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No submissions found.</p>";
    }

    echo "<hr>";
    echo "<h3 style='color: green;'>✓ Migration Complete!</h3>";
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ol>";
    echo "<li>Go to your <a href='../thinking-about-it.html'>Thinking About It</a> page to test the form</li>";
    echo "<li>Check the <a href='../admin.html'>Admin Panel</a> → Settings → Thinking About It tab to manage submissions</li>";
    echo "</ol>";

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
