<?php
/**
 * Database Setup Script
 * Run this file ONCE to create all necessary MySQL tables
 * Access: http://yourdomain.com/api/setup.php
 */

require_once 'config.php';

try {
    $conn = getDbConnection();

    // Create questions table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_text TEXT NOT NULL,
            question_type VARCHAR(50) NOT NULL,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create question_options table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS question_options (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            option_text TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create leads table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            business_name VARCHAR(255),
            loan_amount VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create answers table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS answers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lead_id INT NOT NULL,
            question_id INT NOT NULL,
            answer_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Check if default questions exist
    $stmt = $conn->query("SELECT COUNT(*) as count FROM questions");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        // Insert default questions
        $defaultQuestions = [
            [
                'text' => 'What type of business loan are you looking for?',
                'type' => 'multiple_choice',
                'order' => 1,
                'options' => [
                    'Term Loan',
                    'Line of Credit',
                    'SBA Loan',
                    'Equipment Financing',
                    'Invoice Financing',
                    'Merchant Cash Advance'
                ]
            ],
            [
                'text' => 'How much funding do you need?',
                'type' => 'multiple_choice',
                'order' => 2,
                'options' => [
                    'Under $50,000',
                    '$50,000 - $100,000',
                    '$100,000 - $250,000',
                    '$250,000 - $500,000',
                    '$500,000+'
                ]
            ],
            [
                'text' => 'How long has your business been operating?',
                'type' => 'multiple_choice',
                'order' => 3,
                'options' => [
                    'Less than 6 months',
                    '6 months - 1 year',
                    '1 - 2 years',
                    '2 - 5 years',
                    '5+ years'
                ]
            ],
            [
                'text' => 'What is your estimated annual revenue?',
                'type' => 'multiple_choice',
                'order' => 4,
                'options' => [
                    'Under $100,000',
                    '$100,000 - $250,000',
                    '$250,000 - $500,000',
                    '$500,000 - $1,000,000',
                    '$1,000,000+'
                ]
            ],
            [
                'text' => 'What will you use the funds for?',
                'type' => 'text',
                'order' => 5,
                'options' => []
            ]
        ];

        $questionStmt = $conn->prepare("INSERT INTO questions (question_text, question_type, order_index) VALUES (?, ?, ?)");
        $optionStmt = $conn->prepare("INSERT INTO question_options (question_id, option_text) VALUES (?, ?)");

        foreach ($defaultQuestions as $q) {
            $questionStmt->execute([$q['text'], $q['type'], $q['order']]);
            $questionId = $conn->lastInsertId();

            foreach ($q['options'] as $option) {
                $optionStmt->execute([$questionId, $option]);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Database tables created and default questions inserted successfully!'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Database tables already exist. No changes made.'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Setup failed: ' . $e->getMessage()
    ]);
}
?>
