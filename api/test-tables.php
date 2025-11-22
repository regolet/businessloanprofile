<?php
/**
 * Test script to verify all dynamic content tables exist
 */

require_once 'config.php';

try {
    $conn = getDbConnection();

    echo "<h2>Testing Dynamic Content Tables</h2>";

    $requiredTables = [
        'hero_features',
        'loan_types',
        'how_it_works_steps',
        'faqs'
    ];

    foreach ($requiredTables as $table) {
        echo "<h3>Table: $table</h3>";

        // Check if table exists
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch();

        if ($exists) {
            echo "<p style='color: green;'>✓ Table EXISTS</p>";

            // Show table structure
            echo "<h4>Structure:</h4>";
            $columns = $conn->query("DESCRIBE $table")->fetchAll();
            echo "<pre>";
            foreach ($columns as $col) {
                echo $col['Field'] . " (" . $col['Type'] . ") " . ($col['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
            }
            echo "</pre>";

            // Count records
            $count = $conn->query("SELECT COUNT(*) as count FROM $table")->fetch();
            echo "<p><strong>Records:</strong> " . $count['count'] . "</p>";

            // Show sample data
            if ($count['count'] > 0) {
                echo "<h4>Sample Data:</h4>";
                $sample = $conn->query("SELECT * FROM $table LIMIT 3")->fetchAll();
                echo "<pre>" . print_r($sample, true) . "</pre>";
            }
        } else {
            echo "<p style='color: red;'>✗ Table DOES NOT EXIST</p>";
            echo "<p>This table needs to be created by running api/setup.php</p>";
        }

        echo "<hr>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Database Error:</strong> " . $e->getMessage() . "</p>";
}
?>
